"""
test_routes.py — Integration tests for Flask API routes.
Updated for MongoDB backend (uses MONGODB_URI env var from CI).
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code in (200, 503)   # 503 if MongoDB unreachable in CI
    assert "status" in r.json


def test_recommend_missing_body(client):
    r = client.post("/api/recommend", content_type="application/json", data="{}")
    assert r.status_code == 200


def test_recommend_valid(client):
    r = client.post("/api/recommend", json={
        "education": "graduation",
        "skills": ["communication", "finance"],
        "sectors": ["agriculture"],
    })
    assert r.status_code == 200
    assert "results" in r.json
    assert isinstance(r.json["results"], list)


def test_courses_all(client):
    r = client.get("/api/courses")
    assert r.status_code == 200


def test_courses_skill(client):
    r = client.get("/api/courses/communication")
    assert r.status_code in (200, 404)


def test_internships_list(client):
    r = client.get("/api/internships")
    assert r.status_code == 200
    assert "internships" in r.json
