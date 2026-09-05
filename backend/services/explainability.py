"""
LANDSIGHT AI - Explainability & Mitigation Recommendation Service
Generates actionable Standard Operating Procedures (SOP) based on risk levels and dominant risk triggers.
"""

from typing import List, Dict


def generate_mitigation_actions(risk_level: str, top_trigger_key: str, location_name: str) -> List[str]:
    """Generates immediate field actions for SDRF, NDMA, District Magistrates, and Citizens."""
    actions = []

    if risk_level == "Critical":
        actions.append(f"🚨 IMMEDIATE EVACUATION: Trigger sirens and SMS alerts in vulnerable downhill settlements of {location_name}.")
        actions.append("⛔ HIGHWAY CLOSURE: Restrict vehicular movement on exposed arterial mountain corridors and NH links.")
        actions.append("🚜 HEAVY MACHINERY MOBILIZATION: Pre-stage JCBs, bulldozers, and NDRF/SDRF rescue battalions at staging hubs.")
        actions.append("⚡ UTILITY CUTOFF: De-energize high-tension electrical grids across slide-prone slopes to avoid secondary fires.")
        actions.append("🏥 SHELTER READINESS: Activate designated community cyclone/landslide relief shelters with medical triage.")

    elif risk_level == "High":
        actions.append(f"⚠️ AMBER ADVISORY: Restrict heavy commercial vehicles from passing through {location_name}.")
        actions.append("📡 SENSOR POLLING: Increase IoT inclinometer and rain gauge telemetry frequency to 5-minute intervals.")
        actions.append("👷 FIELD INSPECTION: Deploy quick-response engineers to check tension cracks along road embankments.")
        actions.append("📢 CITIZEN ALERT: Broadcast caution notices to local residents via radio, loudspeakers, and WhatsApp channels.")
        actions.append("💧 DRAINAGE CLEARANCE: Clear culverts, roadside drains, and weep holes to prevent hydrostatic pressure buildup.")

    elif risk_level == "Moderate":
        actions.append("🟡 MONITORING ALERT: District Emergency Operation Center (DEOC) placed on active yellow alert.")
        actions.append("🌧️ WEATHER TRACKING: Monitor IMD Doppler Radar for localized cloudburst clusters in next 6-12 hours.")
        actions.append("🚙 ADVISORY: Advise commuters to avoid nighttime travel on hilly roads unless strictly necessary.")
        actions.append("📋 CITIZEN VERIFICATION: Cross-reference citizen ground reports with satellite soil moisture imagery.")

    else:  # Low
        actions.append("🟢 GREEN - ROUTINE SURVEILLANCE: Normal baseline monitoring active across all seismic and slope sensors.")
        actions.append("🌱 PREVENTATIVE MAINTENANCE: Continue routine slope stabilization, retaining wall checks, and hydro-seeding.")
        actions.append("📊 DATA INGESTION: Satellite and IMD ingestion pipelines operating at standard 1-hour heartbeat.")

    # Tailored specific trigger action
    if top_trigger_key == "rainfall_last_24h":
        actions.append("💧 RAINFALL TRIGGER: Continuous downpour detected — watch out for flash flood debris flows at river bottlenecks.")
    elif top_trigger_key == "slope_angle":
        actions.append("⛰️ STEEP SLOPE VULNERABILITY: Escarpment angle exceeds critical stability limit — danger of sudden rockfall.")
    elif top_trigger_key == "soil_moisture_index":
        actions.append("🌊 SOIL SATURATION: Liquefaction potential is elevated due to complete groundwater pore saturation.")
    elif top_trigger_key == "geological_formation_score":
        actions.append("🪨 GEOLOGICAL ANOMALY: Highly sheared rock strata susceptible to progressive sliding.")

    return actions


def get_evacuation_urgency(risk_level: str) -> str:
    urgency_map = {
        "Critical": "IMMEDIATE (0 - 2 Hours) - Mandatory Evacuation",
        "High": "HIGH (2 - 6 Hours) - Voluntary Evacuation Recommended",
        "Moderate": "MODERATE (6 - 24 Hours) - Stay Alert & Prepared",
        "Low": "NONE - Normal Status"
    }
    return urgency_map.get(risk_level, "NONE - Normal Status")
