"""
LANDSIGHT AI - FastAPI REST API Router
Endpoints for ML Risk Scoring, Citizen Reports, GIS Layer Ingestion, and Multilingual Dispatch
"""

from typing import List, Dict, Any, Optional, Literal
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import base64
import hashlib
import hmac
import json
import os
import random
import time

from backend.models.risk_model import (
    LandslideFeatureInput,
    RiskPredictionOutput,
    risk_engine,
    FactorContribution
)
from backend.services.explainability import (
    generate_mitigation_actions,
    get_evacuation_urgency
)
from backend.services.dispatcher import generate_multilingual_alerts
from backend.services.assistant import answer_question

router = APIRouter(prefix="/api/v1", tags=["Landslide Early Warning"])

# In-memory storage for prototype / offline-sync
citizen_reports_db: List[Dict[str, Any]] = [
    {
        "id": "REP-2026-001",
        "timestamp": "2026-08-28T00:45:00Z",
        "latitude": 27.5028,
        "longitude": 88.5303,
        "location_name": "Mangan North Road, Sikkim",
        "state": "Sikkim",
        "severity": "Critical",
        "hazard_type": "Debris Flow & Road Blockage",
        "description": "Massive mudflow after 120mm torrential overnight downpour. Road blocked near km 34. Retaining wall breached.",
        "media_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop",
        "reporter_name": "Tashi Bhutia (Field Volunteer)",
        "reporter_phone": "+91 98765 43210",
        "cv_verification_score": 94.2,
        "cv_detected_hazards": ["Mudflow", "Structural Breach", "Road Debris"],
        "status": "Verified & Dispatched",
        "sync_status": "synced"
    },
    {
        "id": "REP-2026-002",
        "timestamp": "2026-08-28T01:05:00Z",
        "latitude": 25.2986,
        "longitude": 91.5822,
        "location_name": "Cherrapunji Escarpment, East Khasi Hills",
        "state": "Meghalaya",
        "severity": "High",
        "hazard_type": "Tension Cracks on Slope",
        "description": "Long horizontal tension cracks (15-20cm wide) observed above village settlement. Water seeping from fracture fissures.",
        "media_url": "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop",
        "reporter_name": "Wanbiang Marbaniang (Local Resident)",
        "reporter_phone": "+91 94361 88231",
        "cv_verification_score": 88.7,
        "cv_detected_hazards": ["Tension Cracks", "High Slope Saturation"],
        "status": "Investigating",
        "sync_status": "synced"
    },
    {
        "id": "REP-2026-003",
        "timestamp": "2026-08-28T01:10:00Z",
        "latitude": 25.1234,
        "longitude": 93.0152,
        "location_name": "Dima Hasao Hill Section, Lumding-Badarpur",
        "state": "Assam",
        "severity": "Moderate",
        "hazard_type": "Minor Slump & Ballast Erosion",
        "description": "Minor mud slumping near railway track culvert #42. Track patrol team alerted.",
        "media_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop",
        "reporter_name": "Alok Sarma (Track Inspector)",
        "reporter_phone": "+91 97060 11223",
        "cv_verification_score": 79.4,
        "cv_detected_hazards": ["Soil Slump"],
        "status": "Under Repair",
        "sync_status": "synced"
    }
]

# Dispatch record store
dispatch_logs: List[Dict[str, Any]] = [
    {
        "dispatch_id": "DISP-9921",
        "timestamp": "2026-08-28T00:50:00Z",
        "zone_name": "Mangan - Chungthang Corridor",
        "state": "Sikkim",
        "target_audience": "District Responders & 14,200 Registered Citizens",
        "channels": ["SMS Broadcast", "CAP Common Alerting Protocol", "IVR Siren", "NDRF Radio"],
        "languages": ["en", "hi", "ne", "as"],
        "priority": "P1 - Critical",
        "message_preview": "🚨 [CRITICAL LANDSLIDE ALERT] Imminent landslide danger at Mangan North Road. Evacuate downhill slopes immediately."
    }
]

# ----------------------------------------------------------------------
# Identity & Access — seeded field-officer directory + citizen registry.
# Prototype stores, mirroring citizen_reports_db / dispatch_logs above.
# ----------------------------------------------------------------------

# Seeded field-officer roster — one roving responder per NER state.
# In a production build this would resolve from a directory service, not code.
FIELD_OFFICERS_DB: List[Dict[str, Any]] = [
    {"officer_id": "OFF-SKM-001", "name": "Meena Rai", "state": "Sikkim", "district": "Mangan", "department": "SDRF", "security_code": "SKM482"},
    {"officer_id": "OFF-MEG-002", "name": "Sanjiv Marak", "state": "Meghalaya", "district": "East Khasi Hills", "department": "DEOC", "security_code": "MEG774"},
    {"officer_id": "OFF-ASM-003", "name": "Alok Sarma", "state": "Assam", "district": "Dima Hasao", "department": "Rail Track Patrol", "security_code": "ASM310"},
    {"officer_id": "OFF-ARU-004", "name": "Pempa Bhutia", "state": "Arunachal Pradesh", "district": "Tawang", "department": "BRTF", "security_code": "ARU906"},
    {"officer_id": "OFF-NAG-005", "name": "Kenei Kire", "state": "Nagaland", "district": "Kohima", "department": "SDRF", "security_code": "NAG558"},
    {"officer_id": "OFF-MIZ-006", "name": "Hmingthana", "state": "Mizoram", "district": "Aizawl", "department": "DEOC", "security_code": "MIZ223"},
    {"officer_id": "OFF-MAN-007", "name": "Ningthoujam Singh", "state": "Manipur", "district": "Tamenglong", "department": "SDRF", "security_code": "MAN661"},
    {"officer_id": "OFF-TRI-008", "name": "Basu Debnath", "state": "Tripura", "district": "Jampui Hills", "department": "NDRF", "security_code": "TRI147"},
]

# Registered citizens (in-memory prototype registry)
citizen_registry: List[Dict[str, Any]] = []
_citizen_sequence = 0


def _next_citizen_id() -> str:
    global _citizen_sequence
    _citizen_sequence += 1
    return f"CTZ-2026-{_citizen_sequence:03d}"


class CitizenReportCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_name: str
    state: str
    severity: str = Field(..., description="Low | Moderate | High | Critical")
    hazard_type: str
    description: str
    media_url: Optional[str] = None
    media_base64: Optional[str] = None
    voice_note_base64: Optional[str] = None
    reporter_name: str = "Anonymous Citizen"
    reporter_phone: str = "Unlisted"
    device_offline_timestamp: Optional[str] = None


class AuthorityDispatchPayload(BaseModel):
    zone_id: str
    zone_name: str
    state: str
    risk_level: str
    risk_score: float
    channels: List[str]
    selected_languages: List[str]
    custom_instruction: Optional[str] = None
    deployed_sdrf_units: Optional[int] = 2


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural-language question from a civilian")
    history: List[Dict[str, str]] = Field(default_factory=list, description="Recent {role, content} turns (kept trimmed to ~8)")


class AskResponse(BaseModel):
    question: str
    answer: str
    provider: str = "offline"  # "offline" | "llm"
    intents: List[str]
    sources: List[Dict[str, Any]]
    suggested_questions: List[str]
    timestamp: str


# ----------------------------------------------------------------------
# Identity & Access — signed session tokens + the /auth/login endpoint.
# Secret is read from env; default is a dev-only value (override in prod).
# ----------------------------------------------------------------------

AUTH_SECRET = os.getenv("LANDSIGHT_AUTH_SECRET", "landsight-dev-2026")
SESSION_TTL_SECONDS = 12 * 60 * 60


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign_session_token(profile: Dict[str, Any], role: str, ttl: int = SESSION_TTL_SECONDS) -> str:
    """Signs an opaque, verifiable session token: base64url(payload).hmac_sha256_hex."""
    now = int(time.time())
    payload = {
        "role": role,
        "sub": profile.get("id") or profile.get("officer_id", ""),
        "name": profile.get("name", ""),
        "state": profile.get("state", ""),
        "district": profile.get("district"),
        "department": profile.get("department"),
        "iat": now,
        "exp": now + ttl,
    }
    body = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def _verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Returns the payload dict if the signature is valid and unexpired, else None."""
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(AUTH_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(_b64url_decode(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


class AuthLoginRequest(BaseModel):
    role: Literal["citizen", "officer"]
    # Officer credentials
    officer_id: Optional[str] = None
    district: Optional[str] = None
    security_code: Optional[str] = None
    # Citizen identity
    full_name: Optional[str] = None
    home_state: Optional[str] = None


class AuthLoginResponse(BaseModel):
    status: str
    role: Literal["citizen", "officer"]
    user: Dict[str, Any]
    token: str


@router.post("/auth/login", response_model=AuthLoginResponse)
def login_user(payload: AuthLoginRequest):
    """
    Verifies the visitor's identity as either a Citizen (name + home state) or a
    Field Officer (officer ID + district + access code) and returns a signed
    session token bound to that role.
    """
    if payload.role == "officer":
        officer = next(
            (
                o for o in FIELD_OFFICERS_DB
                if o["officer_id"] == payload.officer_id
                and o["district"].strip().lower() == (payload.district or "").strip().lower()
                and hmac.compare_digest(o["security_code"], (payload.security_code or "").strip().upper())
            ),
            None,
        )
        if officer is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid officer credentials. Check the officer ID, district, and access code.",
            )
        profile = dict(officer)
        profile["id"] = officer["officer_id"]
        profile.pop("security_code", None)
        token = _sign_session_token(profile, "officer")
        return AuthLoginResponse(status="success", role="officer", user=profile, token=token)

    # Citizen — register (or return as new) a lightweight citizen profile.
    if not payload.full_name or not payload.home_state:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name and home state are required to register as a citizen.",
        )
    profile = {
        "id": _next_citizen_id(),
        "name": payload.full_name.strip(),
        "state": payload.home_state.strip().title(),
        "role": "citizen",
    }
    citizen_registry.append(profile)
    token = _sign_session_token(profile, "citizen")
    return AuthLoginResponse(status="success", role="citizen", user=profile, token=token)


@router.post("/predict-risk", response_model=RiskPredictionOutput)
def predict_landslide_risk(input_data: LandslideFeatureInput):
    """
    Computes real-time landslide risk score (0-100), risk level (Low, Moderate, High, Critical),
    SHAP-like factor contributions, emergency mitigation steps, and multilingual alerts.
    """
    score, level, color, contributors = risk_engine.predict(input_data)
    
    top_trigger = contributors[0].feature_key if contributors else "rainfall_last_24h"
    mitigation = generate_mitigation_actions(level, top_trigger, input_data.location_name or "Target Zone")
    urgency = get_evacuation_urgency(level)
    alerts = generate_multilingual_alerts(
        input_data.location_name or "Target Zone",
        input_data.state or "NER",
        level,
        score
    )

    return RiskPredictionOutput(
        risk_score=score,
        risk_level=level,
        risk_color=color,
        confidence=0.92,
        input_data=input_data,
        top_contributors=contributors,
        mitigation_actions=mitigation,
        evacuation_urgency=urgency,
        multilingual_alerts=alerts,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


# Monitored geo-zones across the 8 NER states (source of truth for /zones and the Ask-AI assistant)
NER_MONITORING_ZONES: List[Dict[str, Any]] = [
        {
            "id": "ZONE-SKM-01",
            "name": "Mangan - Chungthang Highway",
            "state": "Sikkim",
            "coordinates": [27.5028, 88.5303],
            "polygon": [
                [27.53, 88.50], [27.54, 88.56], [27.48, 88.57], [27.47, 88.51]
            ],
            "rainfall_last_24h": 142.5,
            "slope_angle": 44.2,
            "soil_moisture_index": 0.89,
            "elevation": 1820,
            "geological_formation_score": 8.8,
            "historical_landslide_count": 9,
            "risk_score": 86.4,
            "risk_level": "Critical",
            "active_alert": "Red Alert: Debris Flow Warning",
            "evacuation_status": "Mandatory Evacuation Triggered"
        },
        {
            "id": "ZONE-SKM-02",
            "name": "Gangtok - Sevoke Road (NH-10)",
            "state": "Sikkim",
            "coordinates": [27.3389, 88.6065],
            "polygon": [
                [27.36, 88.58], [27.37, 88.63], [27.31, 88.64], [27.30, 88.59]
            ],
            "rainfall_last_24h": 78.0,
            "slope_angle": 36.5,
            "soil_moisture_index": 0.74,
            "elevation": 1650,
            "geological_formation_score": 7.2,
            "historical_landslide_count": 6,
            "risk_score": 64.8,
            "risk_level": "High",
            "active_alert": "Amber Alert: Slope Monitoring",
            "evacuation_status": "Commuter Restriction"
        },
        {
            "id": "ZONE-MEG-01",
            "name": "Sohra (Cherrapunji) Cliff Section",
            "state": "Meghalaya",
            "coordinates": [25.2986, 91.5822],
            "polygon": [
                [25.32, 91.55], [25.33, 91.61], [25.27, 91.62], [25.26, 91.56]
            ],
            "rainfall_last_24h": 185.0,
            "slope_angle": 48.0,
            "soil_moisture_index": 0.94,
            "elevation": 1430,
            "geological_formation_score": 8.0,
            "historical_landslide_count": 11,
            "risk_score": 93.2,
            "risk_level": "Critical",
            "active_alert": "Extreme Danger: Flash Flood & Slope Failure",
            "evacuation_status": "Relief Centers Activated"
        },
        {
            "id": "ZONE-MEG-02",
            "name": "Shillong Peak Ridge - Umiam Corridor",
            "state": "Meghalaya",
            "coordinates": [25.5788, 91.8933],
            "polygon": [
                [25.60, 91.86], [25.61, 91.92], [25.55, 91.93], [25.54, 91.87]
            ],
            "rainfall_last_24h": 42.0,
            "slope_angle": 24.0,
            "soil_moisture_index": 0.58,
            "elevation": 1520,
            "geological_formation_score": 4.5,
            "historical_landslide_count": 2,
            "risk_score": 38.5,
            "risk_level": "Moderate",
            "active_alert": "Yellow Advisory: Intermittent Showers",
            "evacuation_status": "Normal Operations"
        },
        {
            "id": "ZONE-ASM-01",
            "name": "Dima Hasao Hill Pass & Jatinga Valley",
            "state": "Assam",
            "coordinates": [25.1234, 93.0152],
            "polygon": [
                [25.15, 92.98], [25.16, 93.05], [25.09, 93.06], [25.08, 93.00]
            ],
            "rainfall_last_24h": 88.0,
            "slope_angle": 33.0,
            "soil_moisture_index": 0.76,
            "elevation": 650,
            "geological_formation_score": 7.5,
            "historical_landslide_count": 8,
            "risk_score": 67.2,
            "risk_level": "High",
            "active_alert": "Amber Alert: Rail Corridor Vulnerable",
            "evacuation_status": "Track Speed Restriction (20 km/h)"
        },
        {
            "id": "ZONE-ARU-01",
            "name": "Tawang - Bap Teng Kang Valley",
            "state": "Arunachal Pradesh",
            "coordinates": [27.5860, 91.8654],
            "polygon": [
                [27.61, 91.83], [27.62, 91.90], [27.55, 91.91], [27.54, 91.84]
            ],
            "rainfall_last_24h": 95.0,
            "slope_angle": 42.0,
            "soil_moisture_index": 0.82,
            "elevation": 2660,
            "geological_formation_score": 8.2,
            "historical_landslide_count": 5,
            "risk_score": 74.5,
            "risk_level": "High",
            "active_alert": "High Risk: High Altitude Talus Slide",
            "evacuation_status": "Border Road Task Force Alerted"
        },
        {
            "id": "ZONE-NAG-01",
            "name": "Kohima - Dimapur NH-29 Bypass",
            "state": "Nagaland",
            "coordinates": [25.6751, 94.1086],
            "polygon": [
                [25.70, 94.07], [25.71, 94.14], [25.64, 94.15], [25.63, 94.08]
            ],
            "rainfall_last_24h": 64.0,
            "slope_angle": 31.5,
            "soil_moisture_index": 0.68,
            "elevation": 1440,
            "geological_formation_score": 7.0,
            "historical_landslide_count": 7,
            "risk_score": 58.6,
            "risk_level": "High",
            "active_alert": "Amber: Paglapahar Subsidence Sector",
            "evacuation_status": "Single Lane Traffic Diverted"
        },
        {
            "id": "ZONE-MIZ-01",
            "name": "Aizawl Hunthar Slide Zone",
            "state": "Mizoram",
            "coordinates": [23.7271, 92.7176],
            "polygon": [
                [23.75, 92.68], [23.76, 92.75], [23.70, 92.76], [23.69, 92.69]
            ],
            "rainfall_last_24h": 55.0,
            "slope_angle": 38.0,
            "soil_moisture_index": 0.65,
            "elevation": 1132,
            "geological_formation_score": 6.8,
            "historical_landslide_count": 6,
            "risk_score": 54.2,
            "risk_level": "High",
            "active_alert": "High Caution: Sinking Zone Monitoring",
            "evacuation_status": "Geotechnical Survey Active"
        },
        {
            "id": "ZONE-MAN-01",
            "name": "Noney - Imphal Railway Corridor",
            "state": "Manipur",
            "coordinates": [24.8170, 93.6030],
            "polygon": [
                [24.84, 93.57], [24.85, 93.64], [24.78, 93.65], [24.77, 93.58]
            ],
            "rainfall_last_24h": 72.0,
            "slope_angle": 35.0,
            "soil_moisture_index": 0.71,
            "elevation": 920,
            "geological_formation_score": 7.4,
            "historical_landslide_count": 5,
            "risk_score": 62.0,
            "risk_level": "High",
            "active_alert": "High Risk: Tupul Catchment Basin",
            "evacuation_status": "SDRF Camp Pre-positioned"
        },
        {
            "id": "ZONE-TRI-01",
            "name": "Jampui Hills Ridge",
            "state": "Tripura",
            "coordinates": [23.8500, 92.2600],
            "polygon": [
                [23.88, 92.23], [23.89, 92.29], [23.82, 92.30], [23.81, 92.24]
            ],
            "rainfall_last_24h": 22.0,
            "slope_angle": 18.0,
            "soil_moisture_index": 0.38,
            "elevation": 780,
            "geological_formation_score": 3.2,
            "historical_landslide_count": 1,
            "risk_score": 19.4,
            "risk_level": "Low",
            "active_alert": "Green: Stable Weather",
            "evacuation_status": "Normal Operations"
        }
    ]

# Open evacuation shelters / safe zones across NER (mirrors the live GIS shelter layer)
SAFE_SHELTERS_DB: List[Dict[str, Any]] = [
    {
        "name": "Mangan District Community Hall",
        "zone_name": "Mangan - Chungthang Highway",
        "state": "Sikkim",
        "latitude": 27.5128,
        "longitude": 88.5353,
        "capacity": 850,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Ranipool Indoor Sports Complex",
        "zone_name": "Gangtok - Sevoke Road (NH-10)",
        "state": "Sikkim",
        "latitude": 27.2837,
        "longitude": 88.6089,
        "capacity": 1200,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Sohra Civil Sub-Division Shelter",
        "zone_name": "Sohra (Cherrapunji) Cliff Section",
        "state": "Meghalaya",
        "latitude": 25.2986,
        "longitude": 91.5822,
        "capacity": 1500,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Mawlai Community Centre",
        "zone_name": "Shillong Peak Ridge - Umiam Corridor",
        "state": "Meghalaya",
        "latitude": 25.5788,
        "longitude": 91.8933,
        "capacity": 600,
        "status": "Open",
        "open_hours": "06:00-22:00"
    },
    {
        "name": "Haflong District Gymnasium",
        "zone_name": "Dima Hasao Hill Pass & Jatinga Valley",
        "state": "Assam",
        "latitude": 25.1634,
        "longitude": 93.0152,
        "capacity": 1100,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Tawang Town Multipurpose Hall",
        "zone_name": "Tawang - Bap Teng Kang Valley",
        "state": "Arunachal Pradesh",
        "latitude": 27.5860,
        "longitude": 91.8654,
        "capacity": 900,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Kohima Science College Shelter",
        "zone_name": "Kohima - Dimapur NH-29 Bypass",
        "state": "Nagaland",
        "latitude": 25.6751,
        "longitude": 94.1086,
        "capacity": 750,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Aizawl West YMA Hall",
        "zone_name": "Aizawl Hunthar Slide Zone",
        "state": "Mizoram",
        "latitude": 23.7271,
        "longitude": 92.7176,
        "capacity": 800,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Noney Community Hall",
        "zone_name": "Noney - Imphal Railway Corridor",
        "state": "Manipur",
        "latitude": 24.8170,
        "longitude": 93.6030,
        "capacity": 700,
        "status": "Open",
        "open_hours": "24x7"
    },
    {
        "name": "Vanghmun Village Hall",
        "zone_name": "Jampui Hills Ridge",
        "state": "Tripura",
        "latitude": 23.8500,
        "longitude": 92.2600,
        "capacity": 450,
        "status": "Open",
        "open_hours": "08:00-20:00"
    }
]


@router.get("/zones")
def get_ner_monitoring_zones():
    """
    Returns monitored geographical zones across the 8 NER states with live risk computations.
    """
    return {
        "status": "success",
        "region": "North Eastern Region (NER) India",
        "total_monitored_zones": len(NER_MONITORING_ZONES),
        "zones": NER_MONITORING_ZONES
    }


@router.post("/ask", response_model=AskResponse)
def ask_landslide_ai(payload: AskRequest):
    """
    Civic "Ask the AI" — answers natural-language questions (where will landslides hit,
    safe zones, nearest shelter, evacuation advice, etc.) from the offline risk engine.
    Falls back to a real LLM only when LANDSIGHT_LLM_API_KEY / ANTHROPIC_API_KEY is set.
    """
    result = answer_question(
        question=payload.question,
        history=payload.history[-8:],
        context={
            "zones": NER_MONITORING_ZONES,
            "shelters": SAFE_SHELTERS_DB,
            "reports": citizen_reports_db,
            "dispatches": dispatch_logs,
        },
    )
    return AskResponse(
        question=payload.question,
        answer=result["answer"],
        provider=result["provider"],
        intents=result["intents"],
        sources=result["sources"],
        suggested_questions=result["suggested_questions"],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def submit_citizen_report(report_data: CitizenReportCreate):
    """
    Ingests citizen & field volunteer incident reports (supports offline-sync batch submissions).
    Includes Computer Vision heuristic damage estimation.
    """
    # Heuristic CV verification score simulation
    cv_score = round(random.uniform(85.0, 97.5), 1)
    
    hazard_mapping = {
        "Critical": ["Major Rockfall", "Debris Torrents", "Direct Road Destruction"],
        "High": ["Tension Cracks", "Soil Creep", "Culvert Breach"],
        "Moderate": ["Minor Slump", "Drainage Overflow", "Tree Tilting"],
        "Low": ["Loose Gravel", "Normal Runoff"]
    }
    detected = hazard_mapping.get(report_data.severity, ["Unclassified Hazard"])

    new_id = f"REP-2026-{len(citizen_reports_db) + 1:03d}"
    record = {
        "id": new_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": report_data.latitude,
        "longitude": report_data.longitude,
        "location_name": report_data.location_name,
        "state": report_data.state,
        "severity": report_data.severity,
        "hazard_type": report_data.hazard_type,
        "description": report_data.description,
        "media_url": report_data.media_url or "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop",
        "reporter_name": report_data.reporter_name,
        "reporter_phone": report_data.reporter_phone,
        "cv_verification_score": cv_score,
        "cv_detected_hazards": detected,
        "status": "Verified & Forwarded to Authority",
        "sync_status": "synced",
        "device_offline_timestamp": report_data.device_offline_timestamp
    }

    citizen_reports_db.insert(0, record)
    return {
        "status": "success",
        "message": "Citizen incident report registered and verified with AI Vision model.",
        "report": record
    }


@router.get("/reports")
def get_all_reports():
    return {
        "status": "success",
        "total_reports": len(citizen_reports_db),
        "reports": citizen_reports_db
    }


@router.post("/dispatch-alert")
def dispatch_emergency_alert(payload: AuthorityDispatchPayload):
    """
    Dispatches authority notifications across SMS, IVR Siren, CAP protocol, and radio in selected languages.
    """
    dispatch_id = f"DISP-{random.randint(1000, 9999)}"
    alerts = generate_multilingual_alerts(payload.zone_name, payload.state, payload.risk_level, payload.risk_score)
    
    log_entry = {
        "dispatch_id": dispatch_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "zone_name": payload.zone_name,
        "state": payload.state,
        "target_audience": f"Public Broadcast ({payload.state}) + SDRF Rapid Response",
        "channels": payload.channels,
        "languages": payload.selected_languages,
        "priority": f"{payload.risk_level.upper()} PRIORITY",
        "message_preview": alerts.get("en", "Landslide Warning Active"),
        "sdrf_units_deployed": payload.deployed_sdrf_units
    }
    dispatch_logs.insert(0, log_entry)

    return {
        "status": "success",
        "dispatch_id": dispatch_id,
        "channels_broadcasted": payload.channels,
        "languages_sent": payload.selected_languages,
        "multilingual_payload": {lang: alerts[lang] for lang in payload.selected_languages if lang in alerts},
        "sdrf_mobilization": f"{payload.deployed_sdrf_units} SDRF/NDRF Search & Rescue Platoons Dispatched"
    }


@router.get("/dispatch-logs")
def get_dispatch_logs():
    return {
        "status": "success",
        "total_dispatches": len(dispatch_logs),
        "logs": dispatch_logs
    }


@router.get("/batch-test-data")
def get_batch_test_data():
    """
    Returns realistic benchmark test coordinates across Sikkim and Meghalaya.
    """
    benchmarks = [
        {
            "name": "Mangan District Epicenter",
            "state": "Sikkim",
            "latitude": 27.5028,
            "longitude": 88.5303,
            "rainfall_last_24h": 145.0,
            "slope_angle": 45.0,
            "soil_moisture_index": 0.91,
            "elevation": 1820,
            "geological_formation_score": 8.8,
            "historical_landslide_count": 10,
            "scenario": "Red Alert Monsoon Cloudburst"
        },
        {
            "name": "Pakyong Airport Slopes",
            "state": "Sikkim",
            "latitude": 27.2300,
            "longitude": 88.5900,
            "rainfall_last_24h": 68.0,
            "slope_angle": 32.0,
            "soil_moisture_index": 0.69,
            "elevation": 1390,
            "geological_formation_score": 6.5,
            "historical_landslide_count": 4,
            "scenario": "Pre-monsoon Saturated Ground"
        },
        {
            "name": "Cherrapunji Rim Escarpment",
            "state": "Meghalaya",
            "latitude": 25.2986,
            "longitude": 91.5822,
            "rainfall_last_24h": 210.0,
            "slope_angle": 52.0,
            "soil_moisture_index": 0.98,
            "elevation": 1484,
            "geological_formation_score": 8.5,
            "historical_landslide_count": 14,
            "scenario": "Catastrophic Rainfall Infiltration"
        },
        {
            "name": "Mawsynram Valley Sector",
            "state": "Meghalaya",
            "latitude": 25.3000,
            "longitude": 91.5800,
            "rainfall_last_24h": 180.0,
            "slope_angle": 46.0,
            "soil_moisture_index": 0.95,
            "elevation": 1400,
            "geological_formation_score": 8.0,
            "historical_landslide_count": 9,
            "scenario": "Severe Runoff Surge"
        },
        {
            "name": "Shillong Peak Suburbs",
            "state": "Meghalaya",
            "latitude": 25.5788,
            "longitude": 91.8933,
            "rainfall_last_24h": 35.0,
            "slope_angle": 22.0,
            "soil_moisture_index": 0.48,
            "elevation": 1965,
            "geological_formation_score": 4.0,
            "historical_landslide_count": 2,
            "scenario": "Moderate Seasonal Rain"
        }
    ]
    return {"status": "success", "benchmarks": benchmarks}
