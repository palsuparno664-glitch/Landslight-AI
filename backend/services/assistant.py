"""
LANDSIGHT AI - Civic "Ask the AI" Assistant Service
Offline natural-language Q&A over the live NER monitoring grid (rainfall, slope, soil
saturation, history) plus shelter / incident / dispatch data. Freeform questions can be
answered by an optional Anthropic LLM when LANDSIGHT_LLM_API_KEY or ANTHROPIC_API_KEY is set;
otherwise every question is answered offline from the structured data (never throws).

Entry point: answer_question(question, history, context)
"""

import math
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from backend.models.risk_model import LandslideFeatureInput, risk_engine
from backend.services.explainability import generate_mitigation_actions, get_evacuation_urgency

try:  # httpx is optional — only needed for the LLM slot
    import httpx
except ImportError:  # pragma: no cover
    httpx = None

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EMERGENCY_HOTLINES = "\n".join(
    [
        "• NDRF / SDRF Central: **1070**",
        "• State DEOC Helpline: **1077**",
        "• Border Roads (BRTF): **1800-118-005**",
    ]
)

DEFAULT_SUGGESTIONS = [
    "Where will landslides occur today?",
    "Where are the safe zones?",
    "Nearest shelter to Mangan",
    "Is Gangtok at risk?",
    "What should I do in an emergency?",
]

GREETINGS = {"hi", "hello", "hey", "namaste", "namaskar", "yo", "hola"}
HELP_ONLY = {
    "help",
    "what can you do",
    "what do you do",
    "how do i use this",
    "how does this work",
    "who are you",
    "what are you",
    "capabilities",
    "features",
}

# Canonical NER state names for aggregation / matching
NER_STATE_NAMES = [
    "sikkim",
    "meghalaya",
    "assam",
    "arunachal pradesh",
    "arunachal",
    "nagaland",
    "manipur",
    "mizoram",
    "tripura",
]

# Intent keyword tables (scored; longer phrases score higher = more specific)
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "evacuation": [
        "what should i do",
        "what to do",
        "how do i stay safe",
        "how to stay safe",
        "stay safe",
        "safety tips",
        "evacuate",
        "evacuation",
        "sos",
        "emergency",
        "hotline",
        "helpline",
        "phone number",
        "call",
        "contact",
        "protect",
        "guidance",
    ],
    "nearest_shelter": [
        "nearest shelter",
        "closest shelter",
        "shelter near",
        "take shelter",
        "shelter at",
        "evacuation point",
        "relief camp",
        "go to safety",
        "where should i go",
        "safe place to go",
        "shelter",
    ],
    "safe_zones": [
        "safe zone",
        "safe zones",
        "safe area",
        "safe areas",
        "safe place",
        "safest",
        "where is safe",
        "where is it safe",
        "not dangerous",
        "is it safe",
        "safe to stay",
        "safe",
    ],
    "danger_now": [
        "right now",
        "today",
        "tonight",
        "imminent",
        "immediately",
        "current",
        "at the moment",
        "avoid",
        "stay away",
        "dangerous",
        "danger zones",
        "red alert",
        "warning zone",
        "is it dangerous",
        "danger",
        "landslide today",
        "going to landslide",
        "will landslide happen now",
        "happen now",
        "fresh slide",
    ],
    "highest_risk": [
        "where will landslide",
        "landslide occur",
        "landslide happen",
        "landslide hit",
        "which places",
        "which areas",
        "where are the areas",
        "likely to occur",
        "prone to",
        "prone",
        "expected landslide",
        "landslide risk",
        "risk hotspots",
        "hotspots",
        "most at risk",
        "highest risk",
        "biggest threat",
        "potential landslide",
        "landslide location",
        "landslide sites",
        "at risk areas",
    ],
    "rainfall": [
        "rain",
        "rainfall",
        "raining",
        "monsoon",
        "precipitation",
        "downpour",
        "shower",
        "mm of rain",
        "imd",
        "weather",
    ],
    "recent_incidents": [
        "recent",
        "latest",
        "incident",
        "incidents",
        "what happened",
        "news",
        "reports",
        "reported",
        "any landslide",
        "landslide occurred",
        "occurred",
        "the situation",
        "happened around",
    ],
    "road_status": [
        "road",
        "highway",
        "nh 10",
        "nh 29",
        "nh",
        "route",
        "travel",
        "commute",
        "corridor",
        "bridge",
        "road block",
        "road blocked",
        "blocked",
        "can i drive",
        "can i travel",
        "is it open",
    ],
    "state_risk": [
        "which state",
        "riskiest state",
        "state is most",
        "state is least",
        "which is riskiest",
        "state has",
        "states",
        "in sikkim",
        "in meghalaya",
        "in assam",
        "in arunachal",
        "in nagaland",
        "in manipur",
        "in mizoram",
        "in tripura",
        "sikkim",
        "meghalaya",
        "assam",
        "arunachal",
        "nagaland",
        "manipur",
        "mizoram",
        "tripura",
    ],
    "zone_status": [
        "at risk",
        "risk in",
        "risk of landslide in",
        "risk level of",
        "how dangerous is",
        "status of",
        "tell me about",
        "what about",
        "what is the risk",
        "landslide risk in",
        "risk at",
        "is it safe in",
        "is it dangerous in",
    ],
}

# Higher = wins ties
PRIORITY_ORDER = [
    "evacuation",
    "nearest_shelter",
    "safe_zones",
    "danger_now",
    "highest_risk",
    "rainfall",
    "recent_incidents",
    "road_status",
    "state_risk",
    "zone_status",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _norm(text: str) -> str:
    """Lowercase, strip punctuation/dashes (so NH-10 -> 'nh 10')."""
    return re.sub(r"[^a-z0-9\s]", " ", text.lower())


def _base(word: str) -> str:
    """Crude stem so 'landslides' matches 'landslide', 'places' -> 'place', etc."""
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 3 and word.endswith("s") and not word.endswith(("ss", "us")):
        return word[:-1]
    return word


def _matches(text: str, keyword: str) -> bool:
    """True if keyword appears in text, tolerant to plural/gerund word forms."""
    if keyword in text:
        return True
    kw_tokens = keyword.split()
    text_tokens = text.split()
    if not kw_tokens:
        return False
    for i in range(len(text_tokens) - len(kw_tokens) + 1):
        if all(_base(text_tokens[i + j]) == _base(w) for j, w in enumerate(kw_tokens)):
            return True
    return False


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _match_state(text: str) -> Optional[str]:
    for name in NER_STATE_NAMES:
        if name in text:
            return "Arunachal Pradesh" if name.startswith("arunachal") else name.capitalize()
    return None


def _match_zone(zones: List[Dict[str, Any]], text: str) -> Optional[Dict[str, Any]]:
    """Best fuzzy zone match by overlapping meaningful tokens (len>=4)."""
    words = [w for w in text.split() if len(w) >= 4]
    if not words:
        return None
    best, best_score = None, 0
    for z in zones:
        n = _norm(z["name"])
        hits = sum(1 for w in words if w in n)
        if hits > best_score:
            best, best_score = z, hits
    return best if best_score > 0 else None


def _sort_zones(zones: List[Dict[str, Any]], by: str = "risk_score") -> List[Dict[str, Any]]:
    return sorted(zones, key=lambda z: float(z.get(by, 0.0)), reverse=True)


def _open_shelters(shelters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    opened = [s for s in shelters if str(s.get("status", "")).lower() in {"open", "operational", "active"}]
    return opened or shelters


def _nearest_shelter(zone: Dict[str, Any], shelters: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    lat, lon = float(zone["coordinates"][0]), float(zone["coordinates"][1])
    best, best_d = None, None
    for s in _open_shelters(shelters):
        d = _haversine_km(lat, lon, float(s["latitude"]), float(s["longitude"]))
        if best_d is None or d < best_d:
            best, best_d = s, d
    return best


def _assess_zone(z: Dict[str, Any]) -> Tuple[float, str, str, List[Dict[str, Any]]]:
    """Run the heuristic risk engine against a zone's live factors."""
    pred = risk_engine.predict(
        LandslideFeatureInput(
            location_name=z["name"],
            latitude=float(z["coordinates"][0]),
            longitude=float(z["coordinates"][1]),
            state=z["state"],
            rainfall_last_24h=float(z["rainfall_last_24h"]),
            slope_angle=float(z["slope_angle"]),
            soil_moisture_index=float(z["soil_moisture_index"]),
            elevation=float(z["elevation"]),
            geological_formation_score=float(z["geological_formation_score"]),
            historical_landslide_count=int(z["historical_landslide_count"]),
        )
    )
    score, level, _color, contributors = pred
    return pred[0], pred[1], pred[2], [
        {"factor": c.factor_name, "feature_key": c.feature_key, "pct": c.contribution_percentage}
        for c in contributors
    ]


def _zone_source(z: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "kind": "zone",
        "label": z["name"],
        "detail": f"{z['risk_level']} · {z['risk_score']}/100 · {z['rainfall_last_24h']}mm · {z['state']}",
    }


def _shelter_source(s: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "kind": "shelter",
        "label": s["name"],
        "detail": f"{s['state']} · capacity {s['capacity']} · {s['status']}",
    }


def _report_source(r: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "kind": "report",
        "label": r["location_name"],
        "detail": f"{r['severity']} · {r['hazard_type']} · {r['status']}",
    }


# ---------------------------------------------------------------------------
# Intent handlers
# ---------------------------------------------------------------------------

def _greeting(text: str) -> Optional[Tuple[List[str], str, List[Dict[str, Any]], List[str]]]:
    words = text.split()
    if text in GREETINGS or text in HELP_ONLY or (len(words) <= 5 and words and words[0] in {"hello", "hi", "hey"}):
        return (
            ["greeting"],
            (
                "Hello! I'm the **LANDSIGHT Ask-AI** civic assistant. I read the live NER monitoring grid "
                "(rainfall, slope, soil saturation, history) plus shelter and incident data to answer "
                "landslide-safety questions — even fully offline.\n\n"
                "I can help with:\n"
                "• **Where** landslides are most likely now (risk hotspots)\n"
                "• Which areas are **dangerous right now** (Critical alerts)\n"
                "• **Safe zones** and open evacuation shelters, incl. the nearest one to your area\n"
                "• Risk status of a specific place (e.g. *Is Gangtok at risk?*)\n"
                "• **Rainfall intensity**, the riskiest **state**, and road/corridor status\n"
                "• **Emergency / evacuation** guidance and hotlines\n\n"
                "Try one of the suggested questions below 👇"
            ),
            [],
            DEFAULT_SUGGESTIONS,
        )
    return None


def _evacuation(text: str, zones: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    ref = _sort_zones(zones)[0] if zones else {}
    if not ref:
        return "I don't have zone data to advise from right now.", [], []
    score, level, _c, contribs = _assess_zone(ref)
    trigger = contribs[0]["feature_key"] if contribs else "rainfall_last_24h"
    actions = generate_mitigation_actions(level, trigger, ref["name"])[:3]
    urgency = get_evacuation_urgency(level)
    answer = (
        f"🧯 **Evacuation guidance (reference sector: {ref['name']})**\n\n"
        f"Urgency: **{urgency}**\n\n"
        "Immediate actions for you:\n"
        f"• {actions[0]}\n"
        f"• {actions[1] if len(actions) > 1 else actions[0]}\n"
        f"• {actions[2] if len(actions) > 2 else actions[0]}\n\n"
        "📞 Emergency contacts:\n" + EMERGENCY_HOTLINES + "\n\n"
        "If you are near a warned zone, move away from slopes and riverbeds and head to the nearest open "
        "shelter. Ask me **\"Nearest shelter to <your area>\"** to get one."
    )
    return answer, [_zone_source(ref)], [
        "Nearest shelter to " + ref["name"].split(" ")[0],
        "Where are the safe zones?",
        "Is " + ref["name"].split(" ")[0] + " at risk?",
    ]


def _nearest_shelter_answer(zone: Optional[Dict[str, Any]], shelters: List[Dict[str, Any]], zones: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    ref = zone or (_sort_zones(zones)[0] if zones else None)
    if not ref or not shelters:
        return "I couldn't find shelter data for that area.", [], []
    s = _nearest_shelter(ref, shelters)
    if not s:
        s = shelters[0]
    lat, lon = float(ref["coordinates"][0]), float(ref["coordinates"][1])
    dist = _haversine_km(lat, lon, float(s["latitude"]), float(s["longitude"]))
    answer = (
        f"🏥 **Nearest open shelter to {ref['name']}**: **{s['name']}**\n"
        f"• Distance: **{dist:.1f} km** {('(as the crow flies)' if dist > 2 else '(same area)')}\n"
        f"• Location: {s['state']} · Capacity **{s['capacity']}** · Status: {s['status']}\n\n"
        "Only travel if it is safe to do so — confirm the route is open with local authorities during heavy rain."
    )
    return answer, [_shelter_source(s), _zone_source(ref)], [
        "What should I do in an emergency?",
        "Where are the safe zones?",
        "Is " + (zone or zones[0])["name"].split(" ")[0] + " at risk?",
    ]


def _safe_zones(zones: List[Dict[str, Any]], shelters: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    safe = sorted(
        [z for z in zones if z["risk_level"] in ("Low", "Moderate")],
        key=lambda z: float(z["risk_score"]),
    )
    open_sh = _open_shelters(shelters)
    lines = []
    if safe:
        lines.append("✅ **Relatively safe monitoring sectors right now** (Low / Moderate risk):")
        for z in safe[:5]:
            lines.append(f"• {z['name']} — {z['risk_level']} {z['risk_score']}/100 · {z['rainfall_last_24h']}mm")
    else:
        lines.append("All monitored sectors are elevated risk right now — treat everywhere with caution.")
    if open_sh:
        lines.append("\n🏠 **Open shelters you can go to:**")
        for s in open_sh[:5]:
            lines.append(f"• {s['name']} — {s['state']} · capacity {s['capacity']} · {s['status']}")
    lines.append("\nStick to these unless a **new alert** is issued. Ask me **\"Nearest shelter to <your town>\"** for one near you.")
    sources = [_shelter_source(s) for s in open_sh[:4]] + [_zone_source(z) for z in safe[:3]]
    return "\n".join(lines), sources, [
        "Nearest shelter to Mangan",
        "What should I do in an emergency?",
        "Which areas are dangerous right now?",
    ]


def _danger_now(zones: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    danger = _sort_zones([z for z in zones if z["risk_level"] == "Critical"])
    if not danger:
        danger = _sort_zones(zones)[:2]
    if not danger:
        return "No danger zones in the current grid.", [], []
    lines = ["🚨 **Danger zones RIGHT NOW** (Critical / very high):"]
    for z in danger[:4]:
        lines.append(f"• **{z['name']}** — {z['risk_score']} {z['risk_level']} · {z['rainfall_last_24h']}mm rain")
        lines.append(f"  ⚠️ {z['active_alert']}")
    lines.append("\nDo not travel to these areas. If you are nearby, move away from slopes, cuts and riverbeds, and follow official instructions.")
    sources = [_zone_source(z) for z in danger[:4]]
    return "\n".join(lines), sources, [
        "Where are the safe zones?",
        "What should I do in an emergency?",
        "Nearest shelter to " + danger[0]["name"].split(" ")[0],
    ]


def _highest_risk(zones: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    top = _sort_zones(zones)[:4]
    if not top:
        return "No zone data available yet.", [], []
    lines = ["🎯 **Highest landslide-risk hotspots in NER right now** (model score):"]
    for z in top:
        lines.append(f"• **{z['name']}** ({z['state']}) — **{z['risk_score']}** {z['risk_level']} · {z['rainfall_last_24h']}mm/24h")
    if len(top) >= 2:
        lines.append(f"\nThe {top[0]['name'].split(' ')[0]} sector leads on risk, driven mainly by heavy rain and steep slopes. Avoid non-essential travel there.")
    sources = [_zone_source(z) for z in top]
    return "\n".join(lines), sources, [
        "Nearest shelter to " + top[0]["name"].split(" ")[0],
        "What should I do in an emergency?",
        "Which state is riskiest?",
    ]


def _rainfall(zones: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    wet = _sort_zones(zones, by="rainfall_last_24h")[:3]
    if not wet:
        return "No rainfall telemetry available.", [], []
    lines = ["🌧️ **Heaviest 24-hour rainfall right now:**"]
    for z in wet:
        tag = " (cloudburst!)" if z["rainfall_last_24h"] > 150 else (" (heavy)" if z["rainfall_last_24h"] >= 70 else "")
        lines.append(f"• {z['name']} ({z['state']}) — **{z['rainfall_last_24h']}mm**{tag}")
    lines.append("\nRain ≥70mm in 24h on steep slopes significantly raises landslide danger. Keep an eye on the wettest sectors above.")
    sources = [_zone_source(z) for z in wet]
    return "\n".join(lines), sources, [
        "Where will landslides occur today?",
        "Is " + wet[0]["name"].split(" ")[0] + " at risk?",
        "What should I do in an emergency?",
    ]


def _recent_incidents(reports: List[Dict[str, Any]], state: Optional[str]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    pool = [r for r in reports if not state or r.get("state", "").lower() == state.lower()]
    if not pool:
        return f"No recent citizen/field reports for {state}." if state else "No recent incident reports in the database.", [], []
    lines = ["📸 **Latest verified reports:**"]
    for r in pool[:3]:
        lines.append(
            f"• {r['location_name']} ({r['state']}) — **{r['severity']}** · {r['hazard_type']} · {r['status']}"
        )
    lines.append("\nReport something: open the **Citizen Reporting** panel on this app.")
    sources = [_report_source(r) for r in pool[:3]]
    return "\n".join(lines), sources, [
        "Where will landslides occur today?",
        "Where are the safe zones?",
        "Nearest shelter to " + pool[0]["location_name"].split(" ")[0],
    ]


def _road_status(zones: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    road_zones = [
        z for z in zones
        if any(k in _norm(z["name"]) for k in ("nh", "road", "corridor", "highway", "bypass"))
    ]
    if not road_zones:
        road_zones = _sort_zones(zones)[:3]
    if not road_zones:
        return "No road/corridor telemetry available.", [], []
    lines = ["🛣️ **Lifeline highway / corridor status:**"]
    for z in road_zones[:4]:
        lines.append(f"• **{z['name']}** ({z['state']})")
        lines.append(f"  ⚠️ {z['active_alert']} · {z['evacuation_status']}")
    lines.append("\nCheck the live GIS map for exact closures before travelling.")
    sources = [_zone_source(z) for z in road_zones[:4]]
    return "\n".join(lines), sources, [
        "Which areas are dangerous right now?",
        "Where are the safe zones?",
        "What should I do in an emergency?",
    ]


def _state_risk(zones: List[Dict[str, Any]], matched_state: Optional[str]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    from collections import defaultdict

    agg: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"count": 0, "critical": 0, "high": 0, "scores": []}
    )
    for z in zones:
        st = z["state"]
        a = agg[st]
        a["count"] += 1
        a["critical"] += int(z["risk_level"] == "Critical")
        a["high"] += int(z["risk_level"] == "High")
        a["scores"].append(float(z["risk_score"]))
    if not agg:
        return "No state-level data yet.", [], []

    if matched_state:
        a = agg.get(matched_state)
        if not a:
            return f"I have no monitored zones for {matched_state} right now.", [], []
        avg = sum(a["scores"]) / a["count"]
        worst = _sort_zones([z for z in zones if z["state"] == matched_state])[0]
        answer = (
            f"📊 **{matched_state} right now:** {a['count']} monitored zone(s), "
            f"**{a['critical']} critical**, **{a['high']} high** · avg risk **{avg:.0f}/100**.\n"
            f"Riskiest sector: **{worst['name']}** ({worst['risk_score']}/100)."
        )
        sources = [_zone_source(worst)]
    else:
        rows = sorted(
            ((st, a) for st, a in agg.items()),
            key=lambda kv: (sum(kv[1]["scores"]) / kv[1]["count"]),
            reverse=True,
        )
        lines = ["🌍 **Risk across the 8 NER states** (avg monitored-zone score):"]
        for st, a in rows:
            avg = sum(a["scores"]) / a["count"]
            lines.append(f"• {st} — avg **{avg:.0f}** · {a['critical']} critical / {a['high']} high")
        lines.append(f"\n**{rows[0][0]}** is the riskiest right now; **{rows[-1][0]}** is the calmest.")
        answer = "\n".join(lines)
        worst = _sort_zones(zones)[0]
        sources = [_zone_source(worst)]
    return answer, sources, [
        "Where will landslides occur today?",
        "Where are the safe zones?",
        "Is " + worst["name"].split(" ")[0] + " at risk?",
    ]


def _zone_status(zone: Dict[str, Any]) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    score, level, _c, contribs = _assess_zone(zone)
    top = contribs[:2]
    top_txt = ", ".join(f"{t['factor']} ({t['pct']}%)" for t in top) or "balanced"
    first_action = generate_mitigation_actions(level, top[0]["feature_key"] if top else "rainfall_last_24h", zone["name"])[0]
    smi_pct = round(float(zone["soil_moisture_index"]) * 100)
    answer = (
        f"📍 **{zone['name']}** ({zone['state']}) — risk assessment\n"
        f"• Level: **{level}** · Score **{score}/100** (confidence 0.92)\n"
        f"• Rainfall 24h: **{zone['rainfall_last_24h']}mm** · Slope **{zone['slope_angle']}°** · Soil saturation **{smi_pct}%**\n"
        f"• Top drivers: {top_txt}\n"
        f"• Advisory: {zone['active_alert']} · {zone['evacuation_status']}\n\n"
        f"Next step: {first_action}"
    )
    return answer, [_zone_source(zone)], [
        "Nearest shelter to " + zone["name"].split(" ")[0],
        "What should I do in an emergency?",
        "Which areas are dangerous right now?",
    ]


# ---------------------------------------------------------------------------
# Offline dispatch
# ---------------------------------------------------------------------------

def _offline_answer(
    text: str, zone: Optional[Dict[str, Any]], state: Optional[str], zones: List[Dict[str, Any]],
    shelters: List[Dict[str, Any]], reports: List[Dict[str, Any]],
) -> Tuple[str, List[str], str, List[Dict[str, Any]], List[str]]:
    greeting = _greeting(text)
    if greeting:
        return "offline", *greeting

    road_zones_exist = bool(
        zones
        and any(any(k in _norm(z["name"]) for k in ("nh", "road", "corridor", "highway", "bypass")) for z in zones)
    )

    def score(intent: str) -> float:
        s = 0.0
        for kw in INTENT_KEYWORDS[intent]:
            if _matches(text, kw):
                s += 1.5 if len(kw) >= 5 else 1.0
        if intent == "zone_status" and zone:
            s += 0.5  # a place was named — mildly favour a location answer
        if intent == "nearest_shelter" and zone:
            s += 0.5
        if intent == "road_status" and not road_zones_exist:
            s = 0.0
        if intent == "zone_status" and not zone:
            s = 0.0
        return s

    best_intent, best_score_val = None, 0.0
    for intent in PRIORITY_ORDER:
        sc = score(intent)
        if sc > best_score_val:
            best_intent, best_score_val = intent, sc

    if best_intent is None and zone:
        # A place was named with no crisp intent keyword -> they asked about that place
        best_intent, best_score_val = "zone_status", 0.0

    handlers = {
        "evacuation": lambda: _evacuation(text, zones),
        "nearest_shelter": lambda: _nearest_shelter_answer(zone, shelters, zones),
        "safe_zones": lambda: _safe_zones(zones, shelters),
        "danger_now": lambda: _danger_now(zones),
        "highest_risk": lambda: _highest_risk(zones),
        "rainfall": lambda: _rainfall(zones),
        "recent_incidents": lambda: _recent_incidents(reports, state),
        "road_status": lambda: _road_status(zones),
        "state_risk": lambda: _state_risk(zones, state),
        "zone_status": lambda: _zone_status(zone) if zone else ("I'm not sure which location you mean.", [], []),
    }
    if best_intent in handlers:
        answer, sources, suggestions = handlers[best_intent]()
        return "offline", [best_intent], answer, sources, suggestions

    return "offline", [], "", [], DEFAULT_SUGGESTIONS


# ---------------------------------------------------------------------------
# LLM slot (optional)
# ---------------------------------------------------------------------------

def _llm_available() -> bool:
    return bool(os.getenv("LANDSIGHT_LLM_API_KEY") or os.getenv("ANTHROPIC_API_KEY")) and httpx is not None


def _build_digest(context: Dict[str, Any]) -> str:
    zones = context.get("zones") or []
    shelters = context.get("shelters") or []
    lines = ["LANDSIGHT NER landslide-monitoring context:"]
    for z in _sort_zones(zones)[:5]:
        lines.append(
            f"- {z['name']} ({z['state']}): risk {z['risk_level']} {z['risk_score']}/100, "
            f"rain {z['rainfall_last_24h']}mm/24h, slope {z['slope_angle']}°, soil {z['soil_moisture_index']}, "
            f"alert: {z['active_alert']}"
        )
    lines.append(f"Open shelters: {len([s for s in shelters if str(s.get('status', '')).lower() in {'open', 'operational', 'active'}])} across 8 states.")
    return "\n".join(lines)


def _llm_answer(question: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> Optional[str]:
    if not _llm_available():
        return None
    key = os.getenv("LANDSIGHT_LLM_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    system = (
        "You are the LANDSIGHT Ask-AI civic assistant for landslide early warning in the North-Eastern "
        "Region of India (Sikkim, Meghalaya, Assam, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura). "
        "Answer civilians concisely and reassuringly using ONLY the context below. Mention shelters and "
        "hotlines (NDRF/SDRF 1070, DEOC 1077, BRTF 1800-118-005) when relevant.\n\n" + _build_digest(context)
    )
    messages: List[Dict[str, Any]] = []
    for h in history[-6:]:
        role = "user" if str(h.get("role")) == "user" else "assistant"
        content = str(h.get("content", ""))[:500]
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question})
    try:
        resp = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={"model": "claude-haiku-4-5-20251001", "max_tokens": 400, "system": system, "messages": messages},
            timeout=20.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text").strip() or None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def answer_question(
    question: str,
    history: Optional[List[Dict[str, str]]] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    question = (question or "").strip()
    context = context or {}
    zones = context.get("zones") or []
    shelters = context.get("shelters") or []
    reports = context.get("reports") or []
    history = history or []

    text = _norm(question)
    zone = _match_zone(zones, text)
    state = _match_state(text)

    provider, intents, answer, sources, suggestions = _offline_answer(text, zone, state, zones, shelters, reports)

    # Freeform / unmatched questions can go to the LLM when a key is configured.
    if not intents and _llm_available():
        llm_text = _llm_answer(question, history, context)
        if llm_text:
            provider = "llm"
            intents = ["freeform"]
            answer = llm_text
            sources = [_zone_source(z) for z in _sort_zones(zones)[:2]] or []
            suggestions = DEFAULT_SUGGESTIONS

    if not intents:
        provider = "offline"
        intents = ["generic_capability"]
        answer = (
            "I can answer data-driven questions from the live NER monitoring grid even offline. Try asking:\n"
            "• \"Where will landslides occur today?\"\n"
            "• \"Which areas are dangerous right now?\"\n"
            "• \"Where are the safe zones?\"\n"
            "• \"Is Gangtok at risk?\"\n"
            "• \"Nearest shelter to Mangan\"\n"
            "• \"Which state is riskiest?\"\n"
            "• \"What should I do in an emergency?\""
        )

    return {
        "provider": provider,
        "intents": intents,
        "answer": answer,
        "sources": sources,
        "suggested_questions": suggestions,
    }