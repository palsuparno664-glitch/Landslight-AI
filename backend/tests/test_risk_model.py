"""
Unit tests for LANDSIGHT AI risk inference engine
"""

from backend.models.risk_model import LandslideFeatureInput, risk_engine
from backend.services.explainability import generate_mitigation_actions, get_evacuation_urgency
from backend.services.dispatcher import generate_multilingual_alerts


def test_critical_risk_prediction():
    inp = LandslideFeatureInput(
        location_name="Mangan Test Zone",
        latitude=27.5028,
        longitude=88.5303,
        state="Sikkim",
        rainfall_last_24h=180.0,
        slope_angle=48.0,
        soil_moisture_index=0.92,
        elevation=1900.0,
        geological_formation_score=8.5,
        historical_landslide_count=9
    )
    score, level, color, contributors = risk_engine.predict(inp)
    assert 75.0 <= score <= 100.0
    assert level == "Critical"
    assert color == "#ef4444"
    assert len(contributors) == 6
    assert sum(c.contribution_percentage for c in contributors) >= 99.0


def test_low_risk_prediction():
    inp = LandslideFeatureInput(
        location_name="Low Risk Plains Test",
        latitude=26.1445,
        longitude=91.7362,
        state="Assam",
        rainfall_last_24h=10.0,
        slope_angle=8.0,
        soil_moisture_index=0.25,
        elevation=120.0,
        geological_formation_score=2.0,
        historical_landslide_count=0
    )
    score, level, color, contributors = risk_engine.predict(inp)
    assert 0.0 <= score < 25.0
    assert level == "Low"
    assert color == "#10b981"


def test_multilingual_alert_generation():
    alerts = generate_multilingual_alerts("Cherrapunji", "Meghalaya", "Critical", 92.5)
    assert "en" in alerts
    assert "hi" in alerts
    assert "as" in alerts
    assert "bn" in alerts
    assert "ne" in alerts
    assert "kha" in alerts
    assert "miz" in alerts
    assert "mni" in alerts
    assert "Cherrapunji" in alerts["en"]
    assert "Cherrapunji" in alerts["hi"]


def test_mitigation_actions():
    actions = generate_mitigation_actions("Critical", "rainfall_last_24h", "Mangan")
    assert len(actions) >= 4
    assert any("EVACUATION" in a for a in actions)


if __name__ == "__main__":
    test_critical_risk_prediction()
    test_low_risk_prediction()
    test_multilingual_alert_generation()
    test_mitigation_actions()
    print("All ML Risk Engine unit tests passed successfully!")
