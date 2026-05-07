import json
from pathlib import Path

from backend.engine.career_engine import LOCATION_COORDS


DATA_PATH = Path(__file__).resolve().parents[1] / "internships.json"


def main():
    internships = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    enriched = []
    for item in internships:
        enriched.append({
            **item,
            "coordinates": LOCATION_COORDS.get(item.get("location"), LOCATION_COORDS.get("Remote - India")),
        })
    DATA_PATH.write_text(json.dumps(enriched, indent=2), encoding="utf-8")
    print(f"Enriched {len(enriched)} internships with coordinates")


if __name__ == "__main__":
    main()
