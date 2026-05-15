from copy import deepcopy

from flask import Blueprint, jsonify, request, session

from backend.database.repository import find_user_by_id, get_roadmap_progress, save_roadmap_progress, update_user
from backend.engine.career_engine import build_levels, load_internships, score_internship_for_profile

roadmap_bp = Blueprint("roadmap", __name__)


def _require_user():
    user = find_user_by_id(session.get("user_id"))
    if not user:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    return user, None


def _build_progress(user_id, internship):
    existing = get_roadmap_progress(user_id, internship["id"]) or {}
    completed = set(existing.get("completedLevelIds", []))
    missing_skills = score_internship_for_profile(find_user_by_id(user_id), internship)["missingSkills"]
    skill_tracks = []
    for skill in missing_skills:
        levels = []
        base_levels = build_levels(skill)
        for index, level in enumerate(base_levels):
            level_id = f"{internship['id']}::{level['id']}"
            is_completed = level_id in completed
            unlocked = index == 0 or f"{internship['id']}::{base_levels[index - 1]['id']}" in completed
            levels.append({
                **level,
                "id": level_id,
                "completed": is_completed,
                "unlocked": unlocked,
            })
        skill_tracks.append({
            "skill": skill,
            "levels": levels,
            "completed": all(level["completed"] for level in levels),
        })
    return {
        "user_id": user_id,
        "internship_id": internship["id"],
        "completedLevelIds": list(completed),
        "tracks": skill_tracks,
    }


def _chatbot_reply(user, internship, roadmap, message):
    scored = score_internship_for_profile(user, internship)
    missing_skills = scored["missingSkills"]
    if not missing_skills:
        return {
            "reply": (
                f"You already qualify for {internship['title']} at {internship['org']}. "
                "Your next move is to polish your resume summary, prepare role-specific interview answers, "
                "and apply directly."
            ),
            "suggestions": [
                "Give me an interview preparation checklist",
                "Show a final application strategy",
            ],
        }

    track_summaries = []
    for track in roadmap["tracks"]:
        topics = ", ".join(level["topic"] for level in track["levels"])
        track_summaries.append(f"{track['skill']}: {topics}")

    prompt = (message or "").lower()
    if any(keyword in prompt for keyword in ["order", "first", "start", "priority"]):
        reply = (
            f"For {internship['title']} at {internship['org']}, start with {missing_skills[0]} first because it unlocks the most immediate gap. "
            f"Then move through the remaining skills in this order: {', '.join(missing_skills)}. "
            "Treat each skill as a separate mission and only move ahead after finishing the previous one."
        )
    elif any(keyword in prompt for keyword in ["day", "week", "plan", "schedule"]):
        reply = (
            f"Here is a simple roadmap plan for {internship['title']}: "
            + " ".join(
                f"Week {index + 1}: focus on {track['skill']} through {', '.join(level['topic'] for level in track['levels'])}."
                for index, track in enumerate(roadmap["tracks"])
            )
        )
    else:
        reply = (
            f"To become eligible for {internship['title']} at {internship['org']}, focus only on these missing skills: "
            f"{', '.join(missing_skills)}. "
            "Your roadmap topics are: "
            + " | ".join(track_summaries)
            + ". Complete each skill track level by level, and your profile will update automatically as you clear them."
        )

    return {
        "reply": reply,
        "suggestions": [
            "What should I learn first?",
            "Make me a weekly roadmap",
            "Explain this roadmap in simple words",
        ],
    }


@roadmap_bp.route("/roadmap/<internship_id>", methods=["GET"])
def get_roadmap(internship_id):
    user, error = _require_user()
    if error:
        return error
    internships = load_internships()
    internship = next((item for item in internships if item["id"] == internship_id), None)
    if not internship:
        return jsonify({"error": "Internship not found"}), 404

    scored = score_internship_for_profile(user, internship)
    if len(scored.get("missingSkills", [])) == 0:
        return jsonify({
            "error": "Roadmap is only available for internships with missing skills"
        }), 400

    progress = _build_progress(user["id"], internship)
    return jsonify({
        "internship": internship,
        "roadmap": progress,
    })


@roadmap_bp.route("/roadmap/<internship_id>/complete", methods=["POST"])
def complete_roadmap_level(internship_id):
    user, error = _require_user()
    if error:
        return error
    data = request.get_json(silent=True)
    if not data or not data.get("levelId"):
        return jsonify({"error": "levelId is required"}), 400

    internships = load_internships()
    internship = next((item for item in internships if item["id"] == internship_id), None)
    if not internship:
        return jsonify({"error": "Internship not found"}), 404

    progress = _build_progress(user["id"], internship)
    target_level = next(
        (
            level
            for track in progress["tracks"]
            for level in track["levels"]
            if level["id"] == data["levelId"]
        ),
        None,
    )
    if not target_level:
        return jsonify({"error": "Roadmap level not found"}), 404
    if target_level["completed"]:
        return jsonify({
            "saved": True,
            "roadmap": progress,
            "skills": user.get("skills", []),
        })
    if not target_level["unlocked"]:
        return jsonify({"error": "Complete the previous topic first"}), 400

    completed = set(progress["completedLevelIds"])
    completed.add(data["levelId"])
    progress["completedLevelIds"] = list(completed)
    saved = save_roadmap_progress(progress)

    latest = _build_progress(user["id"], internship)
    updated_skills = set(user.get("skills", []))
    for track in latest["tracks"]:
        if track["completed"]:
            updated_skills.add(track["skill"])
    if updated_skills != set(user.get("skills", [])):
        user = update_user(user["id"], {"skills": sorted(updated_skills)})

    return jsonify({
        "saved": True,
        "roadmap": _build_progress(user["id"], internship),
        "skills": user.get("skills", []),
    })


@roadmap_bp.route("/roadmap/<internship_id>/chat", methods=["POST"])
def chat_roadmap(internship_id):
    user, error = _require_user()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    internships = load_internships()
    internship = next((item for item in internships if item["id"] == internship_id), None)
    if not internship:
        return jsonify({"error": "Internship not found"}), 404

    roadmap = _build_progress(user["id"], internship)
    response = _chatbot_reply(user, internship, roadmap, message)
    return jsonify(response)
