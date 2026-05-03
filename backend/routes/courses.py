import json
import os

from flask import Blueprint, jsonify

courses_bp = Blueprint("courses", __name__)
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/courses.json")


def _load_courses():
    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


@courses_bp.route("/courses", methods=["GET"])
def all_courses():
    return jsonify(_load_courses())


@courses_bp.route("/courses/<skill_id>", methods=["GET"])
def courses_for_skill(skill_id):
    data = _load_courses()
    courses = data.get(skill_id, [])
    if not courses:
        return jsonify({"error": f"No courses found for skill '{skill_id}'"}), 404
    return jsonify({"skill": skill_id, "courses": courses})
