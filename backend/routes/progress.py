import json
import os

from flask import Blueprint, current_app, jsonify, request

progress_bp = Blueprint("progress", __name__)


def _store_path():
    os.makedirs(current_app.instance_path, exist_ok=True)
    return os.path.join(current_app.instance_path, "progress.json")


def _read_store():
    path = _store_path()
    if not os.path.exists(path):
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def _write_store(data):
    with open(_store_path(), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@progress_bp.route("/progress", methods=["POST"])
def save_progress():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    user_id = data.get("user_id", "anonymous")
    xp = int(data.get("xp", 0) or 0)
    courses = data.get("completedCourses", [])
    activities = data.get("activities", [])

    store = _read_store()
    store[user_id] = {
        "user_id": user_id,
        "xp": xp,
        "completedCourses": courses,
        "courses": courses,
        "activities": activities,
    }
    _write_store(store)
    return jsonify({"saved": True, "user_id": user_id})


@progress_bp.route("/progress/<user_id>", methods=["GET"])
def get_progress(user_id):
    store = _read_store()
    return jsonify(store.get(user_id, {
        "user_id": user_id,
        "xp": 0,
        "completedCourses": [],
        "courses": [],
        "activities": [],
    })), 200
