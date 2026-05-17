import pytest

from backend.app import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app()
    app.config.update(TESTING=True, SECRET_KEY="test-secret")
    app.instance_path = str(tmp_path)
    with app.test_client() as test_client:
        yield test_client


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"
    assert response.json["data_source"] in {"file", "mongodb"}


def test_recommend_missing_body(client):
    response = client.post("/api/recommend", content_type="application/json", data="{}")
    assert response.status_code == 400


def test_recommend_valid(client):
    response = client.post("/api/recommend", json={
        "state": "Remote",
        "education": "graduation",
        "skills": ["python", "javascript"],
        "sectors": ["engineering"],
    })
    assert response.status_code == 200
    assert "results" in response.json
    assert isinstance(response.json["results"], list)


def test_courses_all(client):
    response = client.get("/api/courses")
    assert response.status_code == 200
    assert isinstance(response.json, dict)


def test_courses_skill(client):
    response = client.get("/api/courses/python")
    assert response.status_code == 200
    assert response.json["skill"] == "python"


def test_internships_list(client):
    response = client.get("/api/internships")
    assert response.status_code == 200
    assert "internships" in response.json
    assert response.json["count"] > 0


def test_internship_metadata(client):
    response = client.get("/api/internship-metadata")
    assert response.status_code == 200
    assert response.json["source"] == "excel"
    assert response.json["count"] > 0
    assert "skills" in response.json
    assert "locations" in response.json


def test_progress_save_and_load(client):
    payload = {
        "user_id": "candidate-1",
        "xp": 55,
        "completedCourses": ["python-foundations"],
        "activities": [{"id": "a1", "text": "Completed", "xp": 55}],
    }
    save = client.post("/api/progress", json=payload)
    assert save.status_code == 200
    assert save.json["saved"] is True

    load = client.get("/api/progress/candidate-1")
    assert load.status_code == 200
    assert load.json["xp"] == 55
    assert load.json["completedCourses"] == ["python-foundations"]


def test_session(client):
    response = client.post("/api/session", json={})
    assert response.status_code == 200
    assert "user_id" in response.json


def test_register_login_dashboard_flow(client):
    register = client.post("/api/auth/register", json={
        "fullName": "Test Candidate",
        "email": "test@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "highestQualification": "graduation",
        "skills": ["python", "react"],
        "preferredLocations": ["Remote - India"],
    })
    assert register.status_code == 201
    assert register.json["user"]["email"] == "test@example.com"

    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    assert "catalog" in dashboard.json
    assert "recommended" in dashboard.json
    assert "qualified" in dashboard.json
    assert "stretch" in dashboard.json
    assert "readyMatches" in dashboard.json
    assert "growthPicks" in dashboard.json


def test_roadmap_requires_unlock_order(client):
    register = client.post("/api/auth/register", json={
        "fullName": "Roadmap Candidate",
        "email": "roadmap@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "highestQualification": "graduation",
        "skills": ["python", "sql", "git", "aws"],
        "preferredLocations": ["Remote - India"],
    })
    assert register.status_code == 201

    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    stretch = dashboard.json["growthPicks"]
    assert stretch

    internship_id = stretch[0]["id"]
    skill = stretch[0]["missingSkills"][0]
    roadmap = client.get(f"/api/roadmap/{internship_id}?skill={skill}")
    assert roadmap.status_code == 200
    assert roadmap.json["skill"] == skill

    tracks = roadmap.json["roadmap"]["tracks"]
    locked_level = None
    for track in tracks:
        if len(track["levels"]) > 1:
            locked_level = track["levels"][1]
            break

    assert locked_level is not None
    assert locked_level["unlocked"] is False

    complete = client.post(f"/api/roadmap/{internship_id}/complete", json={"levelId": locked_level["id"], "skill": skill})
    assert complete.status_code == 400
    assert "previous topic" in complete.json["error"]


def test_single_skill_roadmap_completion_adds_only_that_skill(client):
    register = client.post("/api/auth/register", json={
        "fullName": "Completion Candidate",
        "email": "completion@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "highestQualification": "graduation",
        "skills": ["python", "sql", "git", "aws"],
        "preferredLocations": ["Bengaluru, Karnataka"],
    })
    assert register.status_code == 201

    dashboard = client.get("/api/dashboard")
    growth = dashboard.json["growthPicks"]
    target = next(item for item in growth if len(item["missingSkills"]) == 1)
    skill = target["missingSkills"][0]
    initial_skills = {"python", "sql", "git", "aws"}

    roadmap = client.get(f"/api/roadmap/{target['id']}?skill={skill}")
    assert roadmap.status_code == 200

    levels = roadmap.json["roadmap"]["tracks"][0]["levels"]
    for level in levels:
        complete = client.post(
            f"/api/roadmap/{target['id']}/complete",
            json={"levelId": level["id"], "skill": skill},
        )
        assert complete.status_code == 200

    assert complete.json["skillCompleted"] is True
    assert set(complete.json["skills"]) == initial_skills | {skill}
