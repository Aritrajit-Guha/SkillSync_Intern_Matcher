from flask import Blueprint, jsonify, request

from backend.engine.career_engine import load_internships
from backend.engine.internship_source import internship_metadata

internships_bp = Blueprint("internships", __name__)


@internships_bp.route("/internships", methods=["GET"])
def get_internships():
    data = load_internships()
    sector = request.args.get("sector")
    state = request.args.get("state")
    if sector:
        data = [i for i in data if i.get("sector") == sector]
    if state:
        data = [i for i in data if i.get("state") in ("any", state) or state.lower() in i.get("location", "").lower()]
    return jsonify({"internships": data, "count": len(data)})


@internships_bp.route("/internship-metadata", methods=["GET"])
def get_internship_metadata():
    return jsonify(internship_metadata())


@internships_bp.route("/internships/<intern_id>", methods=["GET"])
def get_internship(intern_id):
    data = load_internships()
    item = next((i for i in data if i["id"] == intern_id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)
