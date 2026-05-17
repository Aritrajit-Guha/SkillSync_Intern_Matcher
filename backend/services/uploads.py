import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import current_app
from bson import ObjectId
from gridfs import GridFS
from gridfs.errors import NoFile
from werkzeug.utils import secure_filename

from backend.database.db import get_db
from backend.database.repository import use_mongo


MAX_UPLOAD_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    "resume": {"pdf", "doc", "docx"},
    "secondary": {"pdf", "jpg", "jpeg", "png"},
    "higherSecondary": {"pdf", "jpg", "jpeg", "png"},
    "diploma": {"pdf", "jpg", "jpeg", "png"},
    "graduation": {"pdf", "jpg", "jpeg", "png"},
    "postGraduation": {"pdf", "jpg", "jpeg", "png"},
}


def visible_document_kinds(highest_qualification):
    rank = {
        "class10": 1,
        "class12": 2,
        "diploma": 3,
        "graduation": 4,
        "postgrad": 5,
    }.get(highest_qualification or "", 0)
    kinds = ["resume"]
    if rank >= 1:
        kinds.append("secondary")
    if rank >= 2:
        kinds.append("higherSecondary")
    if highest_qualification == "diploma":
        kinds.append("diploma")
    if rank >= 4:
        kinds.append("graduation")
    if rank >= 5:
        kinds.append("postGraduation")
    return kinds


def masked_aadhaar(value):
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    if len(digits) < 4:
        return ""
    return f"XXXX XXXX {digits[-4:]}"


def validate_aadhaar(value):
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    return len(digits) == 12


def sanitize_documents(documents):
    if not isinstance(documents, dict):
        return {}
    clean = {}
    for kind, doc in documents.items():
        if not isinstance(doc, dict):
            continue
        clean[kind] = {
            key: doc.get(key)
            for key in ("id", "kind", "originalName", "contentType", "size", "uploadedAt", "url")
            if doc.get(key) not in (None, "")
        }
    return clean


def sanitize_user(user):
    if not user:
        return None
    clean = dict(user)
    clean.pop("password_hash", None)
    clean.pop("uploadRecords", None)
    clean["documents"] = sanitize_documents(clean.get("documents", {}))
    clean["aadhaarMasked"] = masked_aadhaar(clean.get("aadhaarNumber", ""))
    return clean


def _upload_root(user_id):
    root = Path(current_app.instance_path) / "uploads" / secure_filename(user_id)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _extension(filename):
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def validate_file(kind, file_storage):
    if kind not in ALLOWED_EXTENSIONS:
        return f"Unsupported document kind: {kind}"
    if not file_storage or not file_storage.filename:
        return "No file selected"
    extension = _extension(file_storage.filename)
    if extension not in ALLOWED_EXTENSIONS[kind]:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS[kind]))
        return f"{kind} must be one of: {allowed}"

    stream = file_storage.stream
    position = stream.tell()
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(position)
    if size > MAX_UPLOAD_SIZE:
        return "File size must be 5 MB or less"
    return ""


def save_uploaded_document(user_id, kind, file_storage):
    error = validate_file(kind, file_storage)
    if error:
        raise ValueError(error)

    original_name = secure_filename(file_storage.filename)
    extension = _extension(original_name)
    file_id = str(uuid.uuid4())
    content_type = file_storage.mimetype or "application/octet-stream"
    uploaded_at = datetime.now(timezone.utc).isoformat()
    size = _file_size(file_storage)
    if _should_use_mongo_storage():
        grid_id = _save_to_gridfs(user_id, kind, file_id, original_name, content_type, file_storage)
        storage = {
            "storageBackend": "mongodb",
            "gridFsId": str(grid_id),
        }
    else:
        stored_name = f"{file_id}.{extension}"
        target = _upload_root(user_id) / stored_name
        file_storage.save(target)
        storage = {
            "storageBackend": "local",
            "storedName": stored_name,
        }
    return {
        "id": file_id,
        "kind": kind,
        "originalName": original_name,
        "contentType": content_type,
        "size": size,
        "uploadedAt": uploaded_at,
        "url": f"/api/uploads/{file_id}",
        **storage,
    }


def find_document(documents, file_id):
    if not isinstance(documents, dict):
        return None
    for doc in documents.values():
        if isinstance(doc, dict) and doc.get("id") == file_id:
            return doc
    return None


def _should_use_mongo_storage():
    mode = os.getenv("UPLOAD_STORAGE", "auto").strip().lower()
    if mode in {"mongodb", "mongo", "gridfs", "db"}:
        return True
    if mode in {"local", "filesystem", "file"}:
        return False
    return use_mongo()


def _file_size(file_storage):
    stream = file_storage.stream
    position = stream.tell()
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(position)
    return size


def _save_to_gridfs(user_id, kind, file_id, original_name, content_type, file_storage):
    file_storage.stream.seek(0)
    fs = GridFS(get_db(), collection="uploads")
    grid_id = fs.put(
        file_storage.stream,
        filename=original_name,
        content_type=content_type,
        metadata={
            "appFileId": file_id,
            "userId": user_id,
            "kind": kind,
            "uploadedAt": datetime.now(timezone.utc).isoformat(),
        },
    )
    file_storage.stream.seek(0)
    return grid_id


def open_stored_document(user_id, document):
    backend = document.get("storageBackend", "local")
    if backend == "mongodb":
        grid_id = document.get("gridFsId")
        if not grid_id:
            return None
        try:
            grid_out = GridFS(get_db(), collection="uploads").get(ObjectId(grid_id))
        except (NoFile, ValueError):
            return None
        metadata = getattr(grid_out, "metadata", {}) or {}
        if metadata.get("userId") != user_id:
            return None
        return grid_out
    return None


def local_document_path(user_id, document):
    if document.get("storageBackend", "local") != "local":
        return None
    stored_name = document.get("storedName")
    if not stored_name:
        return None
    return Path(current_app.instance_path) / "uploads" / user_id / stored_name
