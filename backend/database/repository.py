import json
import os
import uuid
from copy import deepcopy
from datetime import datetime, timezone

from flask import current_app
from pymongo.errors import PyMongoError

from backend.database.db import get_db, ping


DEFAULT_STORE = {
    "users": [],
    "applications": [],
    "roadmaps": [],
}
_USE_MONGO_CACHE = None


def _utc_now():
    return datetime.now(timezone.utc).isoformat()


def _store_path():
    os.makedirs(current_app.instance_path, exist_ok=True)
    return os.path.join(current_app.instance_path, "app_store.json")


def _read_file_store():
    path = _store_path()
    if not os.path.exists(path):
        return deepcopy(DEFAULT_STORE)
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
            return {**deepcopy(DEFAULT_STORE), **data}
    except (OSError, json.JSONDecodeError):
        return deepcopy(DEFAULT_STORE)


def _write_file_store(data):
    with open(_store_path(), "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)


def use_mongo():
    global _USE_MONGO_CACHE
    if os.getenv("FORCE_FILE_STORE", "0") == "1":
        return False
    if _USE_MONGO_CACHE is not None:
        return _USE_MONGO_CACHE
    try:
        _USE_MONGO_CACHE = ping()
    except Exception:
        _USE_MONGO_CACHE = False
    return _USE_MONGO_CACHE


def _sanitize_mongo_doc(doc):
    if not doc:
        return None
    clean = dict(doc)
    clean.pop("_id", None)
    return clean


def storage_mode():
    return "mongodb" if use_mongo() else "file"


def ensure_collections():
    if not use_mongo():
        return
    db = get_db()
    db.users.create_index("email", unique=True)
    db.users.create_index("id", unique=True)
    db.applications.create_index([("user_id", 1), ("internship_id", 1)], unique=True)
    db.roadmaps.create_index([("user_id", 1), ("internship_id", 1)], unique=True)
    db.uploads.files.create_index("metadata.appFileId", unique=True)
    db.uploads.files.create_index("metadata.userId")


def list_users():
    if use_mongo():
        return [_sanitize_mongo_doc(item) for item in get_db().users.find()]
    return _read_file_store()["users"]


def find_user_by_id(user_id):
    if not user_id:
        return None
    if use_mongo():
        return _sanitize_mongo_doc(get_db().users.find_one({"id": user_id}))
    return next((user for user in _read_file_store()["users"] if user["id"] == user_id), None)


def find_user_by_email(email):
    if not email:
        return None
    normalized = email.strip().lower()
    if use_mongo():
        return _sanitize_mongo_doc(get_db().users.find_one({"email": normalized}))
    return next((user for user in _read_file_store()["users"] if user["email"] == normalized), None)


def create_user(user_doc):
    doc = deepcopy(user_doc)
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["email"] = doc["email"].strip().lower()
    doc["created_at"] = doc.get("created_at") or _utc_now()
    doc["updated_at"] = _utc_now()
    if use_mongo():
        get_db().users.insert_one(doc)
        return _sanitize_mongo_doc(doc)
    store = _read_file_store()
    store["users"].append(doc)
    _write_file_store(store)
    return doc


def update_user(user_id, patch):
    existing = find_user_by_id(user_id)
    if not existing:
        return None
    updated = {**existing, **deepcopy(patch), "updated_at": _utc_now()}
    if "email" in updated:
        updated["email"] = updated["email"].strip().lower()
    if use_mongo():
        get_db().users.update_one({"id": user_id}, {"$set": updated}, upsert=False)
        return _sanitize_mongo_doc(updated)
    store = _read_file_store()
    store["users"] = [updated if item["id"] == user_id else item for item in store["users"]]
    _write_file_store(store)
    return updated


def list_applications_for_user(user_id):
    if use_mongo():
        return [_sanitize_mongo_doc(item) for item in get_db().applications.find({"user_id": user_id})]
    return [item for item in _read_file_store()["applications"] if item["user_id"] == user_id]


def save_application(application_doc):
    doc = deepcopy(application_doc)
    doc["applied_at"] = doc.get("applied_at") or _utc_now()
    if use_mongo():
        get_db().applications.update_one(
            {"user_id": doc["user_id"], "internship_id": doc["internship_id"]},
            {"$set": doc},
            upsert=True,
        )
        return _sanitize_mongo_doc(doc)
    store = _read_file_store()
    remaining = [
        item for item in store["applications"]
        if not (item["user_id"] == doc["user_id"] and item["internship_id"] == doc["internship_id"])
    ]
    remaining.append(doc)
    store["applications"] = remaining
    _write_file_store(store)
    return doc


def get_roadmap_progress(user_id, internship_id):
    if use_mongo():
        return _sanitize_mongo_doc(
            get_db().roadmaps.find_one({"user_id": user_id, "internship_id": internship_id})
        )
    return next(
        (
            item for item in _read_file_store()["roadmaps"]
            if item["user_id"] == user_id and item["internship_id"] == internship_id
        ),
        None,
    )


def save_roadmap_progress(progress_doc):
    doc = deepcopy(progress_doc)
    doc["updated_at"] = _utc_now()
    if use_mongo():
        get_db().roadmaps.update_one(
            {"user_id": doc["user_id"], "internship_id": doc["internship_id"]},
            {"$set": doc},
            upsert=True,
        )
        return _sanitize_mongo_doc(doc)
    store = _read_file_store()
    remaining = [
        item for item in store["roadmaps"]
        if not (item["user_id"] == doc["user_id"] and item["internship_id"] == doc["internship_id"])
    ]
    remaining.append(doc)
    store["roadmaps"] = remaining
    _write_file_store(store)
    return doc


def safe_call(default, callback):
    try:
        return callback()
    except PyMongoError:
        return default
