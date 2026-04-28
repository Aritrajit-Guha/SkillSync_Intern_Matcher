"""
routes/progress.py — POST /api/progress, GET /api/progress/<user_id>
"""
from flask import Blueprint, request, jsonify
from database.db import get_db

progress_bp = Blueprint("progress", __name__)

@progress_bp.route("/progress", methods=["POST"])
def save_progress():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    user_id  = data.get("user_id", "anonymous")
    xp       = data.get("xp", 0)
    courses  = data.get("completedCourses", [])
    activities = data.get("activities", [])

    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO progress (user_id, xp, courses_json, activities_json) VALUES (?,?,?,?)",
        (user_id, xp, str(courses), str(activities))
    )
    db.commit()
    return jsonify({"saved": True, "user_id": user_id})

@progress_bp.route("/progress/<user_id>", methods=["GET"])
def get_progress(user_id):
    db  = get_db()
    row = db.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        return jsonify({"user_id": user_id, "xp": 0, "courses": [], "activities": []}), 200
    return jsonify({
        "user_id":    row["user_id"],
        "xp":         row["xp"],
        "courses":    eval(row["courses_json"]),
        "activities": eval(row["activities_json"])
    })