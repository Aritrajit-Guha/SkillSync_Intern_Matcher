import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

from dotenv import load_dotenv

from backend.database.db import get_collection

load_dotenv()

DATA = Path(__file__).resolve().parents[1] / "courses.json"


def seed():
    with open(DATA, encoding="utf-8") as f:
        all_courses = json.load(f)

    col = get_collection("courses")
    count = 0
    for skill_id, courses in all_courses.items():
        for course in courses:
            doc = {
                "skill_id": skill_id,
                "title": course["title"],
                "platform": course.get("platform", ""),
                "duration": course.get("duration", ""),
                "url": course.get("url", ""),
                "icon": course.get("icon", "book"),
            }
            col.update_one(
                {"skill_id": skill_id, "title": course["title"]},
                {"$set": doc},
                upsert=True,
            )
            count += 1

    print(f"Seeded {count} courses across {len(all_courses)} skills into MongoDB.")


if __name__ == "__main__":
    seed()
