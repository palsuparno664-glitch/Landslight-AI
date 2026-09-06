"""
Unit tests for LANDSIGHT AI citizen / field-officer authentication flow
"""

from fastapi.testclient import TestClient

from backend.main import app
from backend.api.routes import _verify_session_token

client = TestClient(app)


def test_officer_login_success():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "role": "officer",
            "officer_id": "OFF-SKM-001",
            "district": "Mangan",
            "security_code": "SKM482",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["role"] == "officer"
    assert body["user"]["officer_id"] == "OFF-SKM-001"
    assert body["user"]["department"] == "SDRF"
    # Never leak the security code back to the client
    assert "security_code" not in body["user"]
    # Token validates and carries the officer role
    payload = _verify_session_token(body["token"])
    assert payload is not None and payload["role"] == "officer"


def test_officer_login_unknown_id():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "role": "officer",
            "officer_id": "OFF-XXX-999",
            "district": "Mangan",
            "security_code": "SKM482",
        },
    )
    assert res.status_code == 401


def test_officer_login_wrong_security_code():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "role": "officer",
            "officer_id": "OFF-SKM-001",
            "district": "Mangan",
            "security_code": "NOPE00",
        },
    )
    assert res.status_code == 401


def test_officer_login_wrong_district():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "role": "officer",
            "officer_id": "OFF-SKM-001",
            "district": "Gangtok",
            "security_code": "SKM482",
        },
    )
    assert res.status_code == 401


def test_citizen_login_success():
    res = client.post(
        "/api/v1/auth/login",
        json={"role": "citizen", "full_name": "Anamika Das", "home_state": "assam"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "citizen"
    assert body["user"]["id"].startswith("CTZ-2026-")
    # home_state is normalized to title case
    assert body["user"]["state"] == "Assam"
    payload = _verify_session_token(body["token"])
    assert payload is not None and payload["role"] == "citizen"


def test_citizen_login_missing_fields():
    res = client.post("/api/v1/auth/login", json={"role": "citizen", "full_name": "No State"})
    assert res.status_code == 422


def test_malformed_token_rejected():
    assert _verify_session_token("not-a-token") is None
    assert _verify_session_token("aaa.bbb") is None


if __name__ == "__main__":
    test_officer_login_success()
    test_officer_login_unknown_id()
    test_officer_login_wrong_security_code()
    test_officer_login_wrong_district()
    test_citizen_login_success()
    test_citizen_login_missing_fields()
    test_malformed_token_rejected()
    print("All Auth flow tests passed successfully!")