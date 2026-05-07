import uuid

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from backend.database.repository import create_user, find_user_by_email, find_user_by_id, update_user

auth_bp = Blueprint("auth", __name__)


def _public_user(user):
    if not user:
        return None
    clean = dict(user)
    clean.pop("password_hash", None)
    return clean


def _require_body():
    data = request.get_json(silent=True)
    if not data:
        return None, (jsonify({"error": "Invalid JSON body"}), 400)
    return data, None


@auth_bp.route("/session", methods=["POST"])
def create_session():
    user_id = session.get("user_id")
    is_new = user_id is None
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id
    return jsonify({"user_id": user_id, "new": is_new})


@auth_bp.route("/session", methods=["GET"])
def get_session():
    user = find_user_by_id(session.get("user_id"))
    return jsonify({"user_id": session.get("user_id"), "authenticated": bool(user), "user": _public_user(user)})


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data, error = _require_body()
    if error:
        return error

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if find_user_by_email(email):
        return jsonify({"error": "An account already exists for this email"}), 409

    user = create_user({
        "email": email,
        "password_hash": generate_password_hash(password),
        "fullName": data.get("fullName", ""),
        "phone": data.get("phone", ""),
        "photo": data.get("photo", ""),
        "highestQualification": data.get("highestQualification", ""),
        "secondary": data.get("secondary", {}),
        "higherSecondary": data.get("higherSecondary", {}),
        "graduation": data.get("graduation", {}),
        "postGraduation": data.get("postGraduation", {}),
        "skills": data.get("skills", []),
        "preferredLocations": data.get("preferredLocations", []),
        "address": data.get("address", ""),
        "coordinates": data.get("coordinates"),
        "theme": data.get("theme", "dark"),
        "language": data.get("language", "en"),
    })
    session["user_id"] = user["id"]
    return jsonify({"user": _public_user(user), "authenticated": True}), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data, error = _require_body()
    if error:
        return error

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = find_user_by_email(email)
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user["id"]
    return jsonify({"user": _public_user(user), "authenticated": True})


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"loggedOut": True})


@auth_bp.route("/auth/me", methods=["GET"])
def me():
    user = find_user_by_id(session.get("user_id"))
    if not user:
        return jsonify({"authenticated": False, "user": None}), 200
    return jsonify({"authenticated": True, "user": _public_user(user)})


@auth_bp.route("/auth/settings", methods=["PATCH"])
def update_settings():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    data, error = _require_body()
    if error:
        return error
    user = update_user(user_id, {
        "theme": data.get("theme", "dark"),
        "language": data.get("language", "en"),
    })
    return jsonify({"user": _public_user(user)})
