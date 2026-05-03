from flask import Blueprint, jsonify, request

from backend.config import Config
from backend.engine.recommender import Recommender

recommend_bp = Blueprint("recommend", __name__)
_recommender = Recommender()


@recommend_bp.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    profile = {
        "state": data.get("state", ""),
        "education": data.get("education", ""),
        "stream": data.get("stream", ""),
        "skills": data.get("skills", []),
        "sectors": data.get("sectors", []),
    }

    results = _recommender.recommend(profile, top_n=Config.RECOMMENDATION_TOP_N)
    return jsonify({"results": results, "count": len(results)})
