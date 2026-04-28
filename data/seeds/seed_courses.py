"""seed_courses.py — Populate MongoDB with course records."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from dotenv import load_dotenv
load_dotenv()

from database.db import get_collection

DATA = os.path.join(os.path.dirname(__file__), "../courses.json")

def seed():
    with open(DATA, encoding="utf-8") as f:
        all_courses = json.load(f)

    col = get_collection("courses")
    count = 0
    for skill_id, courses in all_courses.items():
        for c in courses:
            doc = {
                "skill_id": skill_id,
                "title":    c["title"],
                "platform": c.get("platform", ""),
                "duration": c.get("duration", ""),
                "url":      c.get("url", ""),
                "icon":     c.get("icon", "📘"),
            }
            col.update_one(
                {"skill_id": skill_id, "title": c["title"]},
                {"$set": doc},
                upsert=True,
            )
            count += 1

    print(f"✅ Seeded {count} courses across {len(all_courses)} skills into MongoDB.")

if __name__ == "__main__":
    seed()