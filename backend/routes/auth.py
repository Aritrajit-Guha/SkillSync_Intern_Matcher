import uuid

from flask import Blueprint, jsonify, request, session

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/session", methods=["POST"])
def create_session():
    user_id = session.get("user_id")
    is_new = user_id is None
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id
    body = request.get_json(silent=True) or {}
    return jsonify({"user_id": body.get("user_id", user_id), "new": is_new})


@auth_bp.route("/session", methods=["GET"])
def get_session():
    user_id = session.get("user_id", str(uuid.uuid4()))
    return jsonify({"user_id": user_id})
