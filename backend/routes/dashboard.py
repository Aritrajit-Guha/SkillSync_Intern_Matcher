from flask import Blueprint, jsonify, request, session

from backend.database.repository import (
    find_user_by_id,
    list_applications_for_user,
    save_application,
)
from backend.engine.career_engine import bucket_recommendations, load_internships

dashboard_bp = Blueprint("dashboard", __name__)


def _public_user(user):
    if not user:
        return None
    clean = dict(user)
    clean.pop("password_hash", None)
    return clean


def _require_user():
    user = find_user_by_id(session.get("user_id"))
    if not user:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    return user, None


def _profile_with_preferences(user, preferences=None):
    profile = dict(user or {})
    preferences = preferences or {}
    for key in (
        "domain",
        "desiredLocation",
        "jobType",
        "stipendPreference",
        "experiencePreference",
        "experienceAmount",
    ):
        if preferences.get(key) not in (None, ""):
            profile[key] = preferences[key]
    if profile.get("desiredLocation"):
        profile["preferredLocations"] = [profile["desiredLocation"]]
    return profile


@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    user, error = _require_user()
    if error:
        return error

    internships = load_internships()
    recommendations = bucket_recommendations(user, internships)
    applications = list_applications_for_user(user["id"])
    return jsonify({
        "profile": _public_user(user),
        "catalog": recommendations["catalog"],
        "recommended": recommendations["recommended"],
        "qualified": recommendations["qualified"],
        "stretch": recommendations["stretch"],
        "readyMatches": recommendations["readyMatches"],
        "growthPicks": recommendations["growthPicks"],
        "applications": applications,
    })


@dashboard_bp.route("/recommendations/refresh", methods=["POST"])
def refresh_recommendations():
    user, error = _require_user()
    if error:
        return error
    preferences = request.get_json(silent=True) or {}
    internships = load_internships()
    recommendations = bucket_recommendations(_profile_with_preferences(user, preferences), internships)
    applications = list_applications_for_user(user["id"])
    return jsonify({
        "profile": _public_user(user),
        "catalog": recommendations["catalog"],
        "recommended": recommendations["recommended"],
        "qualified": recommendations["qualified"],
        "stretch": recommendations["stretch"],
        "readyMatches": recommendations["readyMatches"],
        "growthPicks": recommendations["growthPicks"],
        "applications": applications,
        "preferences": preferences,
    })


@dashboard_bp.route("/applications", methods=["POST"])
def apply_for_internship():
    user, error = _require_user()
    if error:
        return error
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    internship_id = data.get("internshipId")
    internships = load_internships()
    internship = next((item for item in internships if item["id"] == internship_id), None)
    if not internship:
        return jsonify({"error": "Internship not found"}), 404

    application = save_application({
        "user_id": user["id"],
        "internship_id": internship_id,
        "internship_title": internship.get("title"),
        "organization": internship.get("org"),
        "status": "submitted",
        "payload": {
            "fullName": data.get("fullName", user.get("fullName", "")),
            "email": user.get("email", ""),
            "githubProfile": data.get("githubProfile", ""),
            "phone": data.get("phone", user.get("phone", "")),
            "resumeName": data.get("resumeName", ""),
            "resumeText": data.get("resumeText", ""),
            "coverNote": data.get("coverNote", ""),
        },
    })
    return jsonify({"application": application, "submitted": True}), 201
