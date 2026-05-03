import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

from dotenv import load_dotenv

from backend.database.db import get_collection

load_dotenv()

DATA = Path(__file__).resolve().parents[1] / "internships.json"


def seed():
    with open(DATA, encoding="utf-8") as f:
        internships = json.load(f)

    col = get_collection("internships")
    upserted = 0
    for item in internships:
        result = col.update_one(
            {"id": item["id"]},
            {"$set": item},
            upsert=True,
        )
        if result.upserted_id:
            upserted += 1

    print(f"Seeded {len(internships)} internships ({upserted} new) into MongoDB.")


if __name__ == "__main__":
    seed()
