import json
from io import BytesIO

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


def _file(name, content=b"sample"):
    return BytesIO(content), name


def test_multipart_register_requires_aadhaar_and_visible_documents(client):
    profile = {
        "fullName": "Document Candidate",
        "email": "docs@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "aadhaarNumber": "123456789012",
        "highestQualification": "graduation",
        "skills": ["python", "react"],
        "preferredLocations": ["Remote - India"],
        "secondary": {"board": "CBSE", "school": "A", "percentage": "91"},
        "higherSecondary": {"board": "CBSE", "school": "B", "percentage": "88"},
        "graduation": {"degree": "BTech", "college": "C", "cgpa": "8.4"},
        "socialLinks": {"github": "https://github.com/example", "linkedin": "https://linkedin.com/in/example"},
    }
    response = client.post(
        "/api/auth/register",
        data={
            "profile": json.dumps(profile),
            "resume": _file("resume.pdf"),
            "secondary": _file("class10.pdf"),
            "higherSecondary": _file("class12.png"),
            "graduation": _file("graduation.jpg"),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 201
    user = response.json["user"]
    assert user["aadhaarMasked"] == "XXXX XXXX 9012"
    assert user["documents"]["resume"]["originalName"] == "resume.pdf"
    assert user["documents"]["graduation"]["url"].startswith("/api/uploads/")

    file_response = client.get(user["documents"]["resume"]["url"])
    assert file_response.status_code == 200


def test_multipart_register_rejects_invalid_aadhaar_and_missing_uploads(client):
    profile = {
        "fullName": "Invalid Candidate",
        "email": "invalid@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "aadhaarNumber": "123",
        "highestQualification": "class12",
        "skills": ["python"],
        "preferredLocations": ["Remote - India"],
    }
    response = client.post(
        "/api/auth/register",
        data={"profile": json.dumps(profile), "resume": _file("resume.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert "Aadhaar" in response.json["error"]

    profile["aadhaarNumber"] = "123456789012"
    response = client.post(
        "/api/auth/register",
        data={"profile": json.dumps(profile), "resume": _file("resume.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert "secondary upload is required" in response.json["error"]


def test_upload_route_rejects_unauthenticated_users(client):
    response = client.post(
        "/api/uploads",
        data={"kind": "resume", "file": _file("resume.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 401


def test_profile_update_persists_social_links_and_documents(client):
    register = client.post("/api/auth/register", json={
        "fullName": "Profile Candidate",
        "email": "profile@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "highestQualification": "graduation",
        "skills": ["python"],
        "preferredLocations": ["Remote - India"],
    })
    assert register.status_code == 201

    upload = client.post(
        "/api/uploads",
        data={"kind": "resume", "file": _file("profile-resume.pdf")},
        content_type="multipart/form-data",
    )
    assert upload.status_code == 200
    document = upload.json["document"]

    update = client.patch("/api/profile", json={
        "aadhaarNumber": "999988887777",
        "socialLinks": {"github": "https://github.com/profile", "linkedin": "https://linkedin.com/in/profile"},
        "documents": {"resume": document},
    })
    assert update.status_code == 200
    assert update.json["profile"]["aadhaarMasked"] == "XXXX XXXX 7777"
    assert update.json["profile"]["socialLinks"]["github"].endswith("/profile")
    assert update.json["profile"]["documents"]["resume"]["originalName"] == "profile-resume.pdf"


def test_upload_can_store_file_metadata_for_mongodb(client, monkeypatch):
    from backend.services import uploads

    register = client.post("/api/auth/register", json={
        "fullName": "Mongo Upload Candidate",
        "email": "mongo-upload@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "highestQualification": "graduation",
        "skills": ["python"],
        "preferredLocations": ["Remote - India"],
    })
    assert register.status_code == 201

    monkeypatch.setattr(uploads, "_should_use_mongo_storage", lambda: True)
    monkeypatch.setattr(uploads, "_save_to_gridfs", lambda *args: "665f1a000000000000000000")
    upload = client.post(
        "/api/uploads",
        data={"kind": "resume", "file": _file("mongo-resume.pdf")},
        content_type="multipart/form-data",
    )
    assert upload.status_code == 200
    document = upload.json["document"]
    assert document["originalName"] == "mongo-resume.pdf"
    assert document["url"].startswith("/api/uploads/")

    profile = client.get("/api/profile")
    stored = profile.json["profile"]["documents"]["resume"]
    assert stored["originalName"] == "mongo-resume.pdf"
    from backend.database.repository import find_user_by_email

    private_user = find_user_by_email("mongo-upload@example.com")
    private_doc = private_user["documents"]["resume"]
    assert private_doc["storageBackend"] == "mongodb"
    assert private_doc["gridFsId"] == "665f1a000000000000000000"


def test_application_stores_profile_snapshot(client):
    register = client.post("/api/auth/register", json={
        "fullName": "Apply Candidate",
        "email": "apply@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "aadhaarNumber": "111122223333",
        "highestQualification": "graduation",
        "skills": ["python", "react", "sql", "git", "aws"],
        "preferredLocations": ["Remote - India"],
        "socialLinks": {"github": "https://github.com/apply", "linkedin": "https://linkedin.com/in/apply"},
    })
    assert register.status_code == 201
    dashboard = client.get("/api/dashboard")
    internship = dashboard.json["catalog"][0]

    apply = client.post("/api/applications", json={
        "internshipId": internship["id"],
        "fullName": "Edited Apply Candidate",
        "aadhaarNumber": "111122223333",
        "socialLinks": {"github": "https://github.com/apply", "linkedin": "https://linkedin.com/in/apply"},
        "documents": {"resume": {"id": "doc-1", "kind": "resume", "originalName": "resume.pdf", "url": "/api/uploads/doc-1"}},
        "skills": ["python", "react"],
        "coverNote": "I am a strong fit.",
    })
    assert apply.status_code == 201
    payload = apply.json["application"]["payload"]
    assert payload["fullName"] == "Edited Apply Candidate"
    assert payload["aadhaarNumber"] == "111122223333"
    assert payload["socialLinks"]["github"].endswith("/apply")
    assert payload["documents"]["resume"]["originalName"] == "resume.pdf"


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


def test_roadmap_retries_cached_quota_fallback(client, monkeypatch):
    from backend.engine import gemini_roadmap

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(
        gemini_roadmap,
        "_request_gemini",
        lambda _prompt: ("", "http_429: RESOURCE_EXHAUSTED", "quota"),
    )
    register = client.post("/api/auth/register", json={
        "fullName": "Quota Candidate",
        "email": "quota@example.com",
        "password": "secret123",
        "phone": "9999999999",
        "highestQualification": "graduation",
        "skills": ["python", "sql", "git", "aws"],
        "preferredLocations": ["Remote - India"],
    })
    assert register.status_code == 201

    growth = client.get("/api/dashboard").json["growthPicks"]
    target = growth[0]
    skill = target["missingSkills"][0]
    first = client.get(f"/api/roadmap/{target['id']}?skill={skill}")
    assert first.status_code == 200
    assert first.json["roadmap"]["source"] == "fallback"

    monkeypatch.setattr(
        gemini_roadmap,
        "_request_gemini",
        lambda _prompt: ('["Fresh Gemini Topic", "Practice Project"]', "", "{}"),
    )
    second = client.get(f"/api/roadmap/{target['id']}?skill={skill}")
    assert second.status_code == 200
    assert second.json["roadmap"]["source"] == "gemini"
    assert second.json["roadmap"]["tracks"][0]["levels"][0]["topic"] == "Fresh Gemini Topic"


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
