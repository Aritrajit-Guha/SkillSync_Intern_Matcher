from flask import Blueprint, jsonify, request, session

from backend.database.repository import find_user_by_id, get_roadmap_progress, save_roadmap_progress, update_user
from backend.engine.career_engine import load_internships, score_internship_for_profile
from backend.engine.gemini_roadmap import build_levels_from_topics, generate_skill_topic_bundle

roadmap_bp = Blueprint("roadmap", __name__)


def _require_user():
    user = find_user_by_id(session.get("user_id"))
    if not user:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    return user, None


def _roadmap_doc(user_id, internship_id):
    existing = get_roadmap_progress(user_id, internship_id) or {}
    return {
        "user_id": user_id,
        "internship_id": internship_id,
        "skillRoadmaps": existing.get("skillRoadmaps", {}),
    }


def _save_skill_state(user_id, internship, skill, state):
    doc = _roadmap_doc(user_id, internship["id"])
    doc["skillRoadmaps"][skill] = state
    return save_roadmap_progress(doc)


def _levels_for_skill(user, internship, skill, force_refresh=False):
    doc = _roadmap_doc(user["id"], internship["id"])
    saved = doc["skillRoadmaps"].get(skill)
    if saved and saved.get("levels") and not force_refresh and not _should_retry_cached_fallback(saved):
        return (
            saved["levels"],
            saved.get("source", "cached"),
            saved.get("sourceDetail", ""),
            saved.get("rawPreview", ""),
        )
    topics, source, source_detail, raw_preview = generate_skill_topic_bundle(skill, internship=internship, user=user)
    return build_levels_from_topics(skill, topics), source, source_detail, raw_preview


def _should_retry_cached_fallback(saved):
    if saved.get("source") != "fallback":
        return False
    if saved.get("completedLevelIds"):
        return False
    detail = str(saved.get("sourceDetail", "")).lower()
    transient_markers = (
        "http_429",
        "quota",
        "exhausted",
        "resource_exhausted",
        "too many requests",
        "missing_api_key",
        "timeout",
        "url_error",
        "os_error",
    )
    return any(marker in detail for marker in transient_markers)


def _build_progress(user, internship, skill, force_refresh=False):
    doc = _roadmap_doc(user["id"], internship["id"])
    saved = {} if force_refresh else doc["skillRoadmaps"].get(skill, {})
    retrying_cached_fallback = bool(saved and _should_retry_cached_fallback(saved))
    base_levels, source, source_detail, raw_preview = _levels_for_skill(user, internship, skill, force_refresh=force_refresh)
    completed = set() if force_refresh else set(saved.get("completedLevelIds", []))
    levels = []
    for index, level in enumerate(base_levels):
        level_id = f"{internship['id']}::{skill}::{level['id']}"
        previous_id = f"{internship['id']}::{skill}::{base_levels[index - 1]['id']}" if index > 0 else None
        is_completed = level_id in completed
        unlocked = index == 0 or previous_id in completed
        levels.append({
            **level,
            "id": level_id,
            "completed": is_completed,
            "unlocked": unlocked,
        })
    track = {
        "skill": skill,
        "levels": levels,
        "completed": all(level["completed"] for level in levels),
    }
    state = {
        "skill": skill,
        "levels": base_levels,
        "completedLevelIds": list(completed),
        "source": source if retrying_cached_fallback else saved.get("source", source),
        "sourceDetail": source_detail if retrying_cached_fallback else saved.get("sourceDetail", source_detail),
        "rawPreview": raw_preview if retrying_cached_fallback else saved.get("rawPreview", raw_preview),
    }
    if force_refresh or retrying_cached_fallback or not saved.get("levels"):
        _save_skill_state(user["id"], internship, skill, state)
    return {
        "user_id": user["id"],
        "internship_id": internship["id"],
        "skill": skill,
        "completedLevelIds": list(completed),
        "tracks": [track],
        "source": state["source"],
        "sourceDetail": state["sourceDetail"],
        "rawPreview": state["rawPreview"],
    }


def _chatbot_reply(user, internship, roadmap, message):
    track = roadmap["tracks"][0]
    topics = ", ".join(level["topic"] for level in track["levels"])

    prompt = (message or "").lower()
    if any(keyword in prompt for keyword in ["order", "first", "start", "priority"]):
        reply = (
            f"For {internship['title']} at {internship['org']}, start with the first unlocked topic in {track['skill']}. "
            "Complete topics in order because each locked level depends on the previous one."
        )
    elif any(keyword in prompt for keyword in ["day", "week", "plan", "schedule"]):
        reply = (
            f"Use one topic per focused study block for {track['skill']}: {topics}."
        )
    else:
        reply = (
            f"Your current {track['skill']} syllabus is: {topics}. "
            "Mark each unlocked topic complete to open the next level."
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

    skill = (request.args.get("skill") or "").strip()
    if not skill:
        return jsonify({"error": "skill query parameter is required"}), 400

    scored = score_internship_for_profile(user, internship)
    if skill not in scored.get("missingSkills", []) and skill not in user.get("skills", []):
        return jsonify({
            "error": "Roadmap is only available for a missing skill on this internship"
        }), 400

    force_refresh = request.args.get("refresh") in {"1", "true", "yes"}
    progress = _build_progress(user, internship, skill, force_refresh=force_refresh)
    return jsonify({
        "internship": scored,
        "roadmap": progress,
        "skill": skill,
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

    skill = data.get("skill")
    if not skill and "::" in data["levelId"]:
        parts = data["levelId"].split("::")
        if len(parts) >= 3:
            skill = parts[1]
    if not skill:
        return jsonify({"error": "skill is required"}), 400

    progress = _build_progress(user, internship, skill)
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
    state = {
        "skill": skill,
        "levels": [
            {
                "id": level["id"].split("::")[-1],
                "label": level["label"],
                "topic": level["topic"],
            }
            for level in progress["tracks"][0]["levels"]
        ],
        "completedLevelIds": list(completed),
        "source": progress.get("source", "cached"),
        "sourceDetail": progress.get("sourceDetail", ""),
        "rawPreview": progress.get("rawPreview", ""),
    }
    _save_skill_state(user["id"], internship, skill, state)

    latest = _build_progress(user, internship, skill)
    updated_skills = set(user.get("skills", []))
    skill_completed = latest["tracks"][0]["completed"]
    if skill_completed:
        updated_skills.add(skill)
    if updated_skills != set(user.get("skills", [])):
        user = update_user(user["id"], {"skills": sorted(updated_skills)})

    return jsonify({
        "saved": True,
        "roadmap": latest,
        "skills": user.get("skills", []),
        "skill": skill,
        "skillCompleted": skill_completed,
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

    skill = (data.get("skill") or request.args.get("skill") or "").strip()
    if not skill:
        return jsonify({"error": "skill is required"}), 400
    roadmap = _build_progress(user, internship, skill)
    response = _chatbot_reply(user, internship, roadmap, message)
    return jsonify(response)
