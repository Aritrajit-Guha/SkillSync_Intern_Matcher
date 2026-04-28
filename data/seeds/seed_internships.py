"""seed_internships.py — Populate MongoDB with internship records."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from dotenv import load_dotenv
load_dotenv()

from database.db import get_collection

DATA = os.path.join(os.path.dirname(__file__), "../internships.json")

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

    print(f"✅ Seeded {len(internships)} internships ({upserted} new) into MongoDB.")

if __name__ == "__main__":
    seed()