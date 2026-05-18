from flask import Blueprint, jsonify, request, session

from backend.database.repository import find_user_by_id, update_user
from backend.services.uploads import sanitize_user, validate_aadhaar

profile_bp = Blueprint("profile", __name__)


def _public_user(user):
    return sanitize_user(user)


def _merge_documents(existing, incoming):
    if not isinstance(incoming, dict):
        return existing or {}
    merged = dict(existing or {})
    for kind, document in incoming.items():
        if not isinstance(document, dict):
            continue
        current = merged.get(kind, {})
        if current.get("id") and current.get("id") == document.get("id"):
            merged[kind] = {**current, **document}
        else:
            merged[kind] = document
    return merged


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
    user = find_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    allowed = {
        "fullName",
        "phone",
        "photo",
        "aadhaarNumber",
        "socialLinks",
        "documents",
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
    if data.get("aadhaarNumber") and not validate_aadhaar(data.get("aadhaarNumber")):
        return jsonify({"error": "A valid 12-digit Aadhaar number is required"}), 400
    patch = {key: value for key, value in data.items() if key in allowed}
    if "documents" in patch:
        patch["documents"] = _merge_documents(user.get("documents", {}), patch["documents"])
    user = update_user(user_id, patch)
    return jsonify({"profile": _public_user(user)})
