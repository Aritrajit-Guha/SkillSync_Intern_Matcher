"""
routes/auth.py — Lightweight anonymous session management.
"""
import uuid
from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/session", methods=["POST"])
def create_session():
    """Create or retrieve an anonymous user session."""
    user_id = session.get("user_id")
    if not user_id:
        user_id = str(uuid.uuid4())
        session["user_id"] = user_id
    return jsonify({"user_id": user_id, "new": "user_id" not in request.json if request.json else True})

@auth_bp.route("/session", methods=["GET"])
def get_session():
    user_id = session.get("user_id", str(uuid.uuid4()))
    return jsonify({"user_id": user_id})