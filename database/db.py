"""
db.py — MongoDB connection management using PyMongo.
Replaces the original SQLite implementation.
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

_client: MongoClient | None = None


def get_client() -> MongoClient:
    """Return a cached MongoClient, creating one if needed."""
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    """Return the main database handle."""
    db_name = os.getenv("MONGODB_DB", "pmis")
    return get_client()[db_name]


def get_collection(name: str):
    """Shortcut — return a named collection from the main DB."""
    return get_db()[name]


def ping():
    """Health-check: returns True if MongoDB is reachable."""
    try:
        get_client().admin.command("ping")
        return True
    except ConnectionFailure:
        return False


def init_db(app=None):
    """
    Create indexes on first run.
    Call once at app startup (compatible with Flask app-context pattern).
    """
    db = get_db()

    # internships
    db.internships.create_index("id", unique=True)
    db.internships.create_index("sector")
    db.internships.create_index("state")

    # courses
    db.courses.create_index("skill_id")

    # progress
    db.progress.create_index("user_id", unique=True)

    # user_profiles
    db.user_profiles.create_index("user_id", unique=True)

    print("✅ MongoDB indexes ensured.")


def close_db(e=None):
    """Optionally close the client (usually not needed in long-running apps)."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
