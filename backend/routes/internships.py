import json
import os

from flask import Blueprint, jsonify, request

internships_bp = Blueprint("internships", __name__)
_DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/internships.json")


def _load():
    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


@internships_bp.route("/internships", methods=["GET"])
def get_internships():
    data = _load()
    sector = request.args.get("sector")
    state = request.args.get("state")
    if sector:
        data = [i for i in data if i.get("sector") == sector]
    if state:
        data = [i for i in data if i.get("state") in ("any", state)]
    return jsonify({"internships": data, "count": len(data)})


@internships_bp.route("/internships/<intern_id>", methods=["GET"])
def get_internship(intern_id):
    data = _load()
    item = next((i for i in data if i["id"] == intern_id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)
