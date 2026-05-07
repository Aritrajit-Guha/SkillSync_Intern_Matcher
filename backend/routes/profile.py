from flask import Blueprint, jsonify, request, session

from backend.database.repository import find_user_by_id, update_user

profile_bp = Blueprint("profile", __name__)


def _public_user(user):
    if not user:
        return None
    clean = dict(user)
    clean.pop("password_hash", None)
    return clean


@profile_bp.route("/profile", methods=["GET"])
def get_profile():
    user = find_user_by_id(session.get("user_id"))
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"profile": _public_user(user)})


@profile_bp.route("/profile", methods=["PATCH"])
def update_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    allowed = {
        "fullName",
        "phone",
        "photo",
        "highestQualification",
        "secondary",
        "higherSecondary",
        "diploma",
        "graduation",
        "postGraduation",
        "skills",
        "preferredLocations",
        "address",
        "coordinates",
    }
    patch = {key: value for key, value in data.items() if key in allowed}
    user = update_user(user_id, patch)
    return jsonify({"profile": _public_user(user)})
