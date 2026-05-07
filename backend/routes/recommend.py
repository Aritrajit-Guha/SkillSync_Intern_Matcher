from flask import Blueprint, jsonify, request

from backend.config import Config
from backend.engine.career_engine import bucket_recommendations, load_internships, score_internship_for_profile

recommend_bp = Blueprint("recommend", __name__)


@recommend_bp.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    internships = load_internships()
    normalized = {
        "preferredLocations": [data.get("state", "")] if data.get("state") else [],
        "highestQualification": data.get("highestQualification", data.get("education", "")),
        "skills": data.get("skills", []),
        "coordinates": data.get("coordinates"),
    }
    scored = [score_internship_for_profile(normalized, item) for item in internships]
    scored.sort(key=lambda item: item["score"], reverse=True)
    return jsonify({"results": scored[:Config.RECOMMENDATION_TOP_N], "count": len(scored[:Config.RECOMMENDATION_TOP_N])})


@recommend_bp.route("/recommendations", methods=["POST"])
def recommendations():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400
    return jsonify(bucket_recommendations(data, load_internships()))
