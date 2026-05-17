from io import BytesIO

from flask import Blueprint, jsonify, send_file, session, request

from backend.database.repository import find_user_by_id, list_applications_for_user, update_user
from backend.services.uploads import (
    find_document,
    local_document_path,
    open_stored_document,
    save_uploaded_document,
    sanitize_documents,
)

uploads_bp = Blueprint("uploads", __name__)


def _require_user():
    user = find_user_by_id(session.get("user_id"))
    if not user:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    return user, None


def _owned_document(user, file_id):
    records = user.get("uploadRecords", {})
    if isinstance(records, dict) and isinstance(records.get(file_id), dict):
        return records[file_id]
    document = find_document(user.get("documents", {}), file_id)
    if document:
        return document
    for application in list_applications_for_user(user["id"]):
        payload = application.get("payload", {})
        document = find_document(payload.get("documents", {}), file_id)
        if document:
            return document
    return None


@uploads_bp.route("/uploads", methods=["POST"])
def upload_document():
    user, error = _require_user()
    if error:
        return error

    kind = (request.form.get("kind") or "").strip()
    file_storage = request.files.get("file")
    try:
        document = save_uploaded_document(user["id"], kind, file_storage)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    upload_records = dict(user.get("uploadRecords", {}))
    upload_records[document["id"]] = document
    patch = {"uploadRecords": upload_records}
    persist_profile = request.form.get("persistProfile", "1") not in {"0", "false", "no"}
    if persist_profile:
        documents = dict(user.get("documents", {}))
        documents[kind] = document
        patch["documents"] = documents
    update_user(user["id"], patch)
    return jsonify({"document": sanitize_documents({kind: document})[kind]})


@uploads_bp.route("/uploads/<file_id>", methods=["GET"])
def serve_document(file_id):
    user, error = _require_user()
    if error:
        return error
    document = _owned_document(user, file_id)
    if not document:
        return jsonify({"error": "File not found"}), 404

    stored = open_stored_document(user["id"], document)
    if stored:
        return send_file(
            BytesIO(stored.read()),
            mimetype=document.get("contentType") or "application/octet-stream",
            download_name=document.get("originalName") or "document",
            as_attachment=False,
        )

    file_path = local_document_path(user["id"], document)
    if not file_path or not file_path.exists():
        return jsonify({"error": "File not found"}), 404
    return send_file(
        file_path,
        mimetype=document.get("contentType") or "application/octet-stream",
        download_name=document.get("originalName") or "document",
        as_attachment=False,
    )
