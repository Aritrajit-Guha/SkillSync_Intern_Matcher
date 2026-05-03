import json
import os

from backend.engine.gap_detector import detect_gaps
from backend.engine.roadmap_builder import build_roadmap
from backend.engine.scoring import score_internship

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/internships.json")


class Recommender:
    def __init__(self):
        self.internships = self._load()

    def _load(self):
        try:
            with open(DATA_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def recommend(self, profile: dict, top_n: int = 5) -> list:
        scored = []
        for intern in self.internships:
            score, missing = score_internship(intern, profile)
            gaps = detect_gaps(intern["skills"], profile.get("skills", []))
            status = (
                "eligible" if len(missing) == 0
                else "near-miss" if len(missing) <= 2
                else "gap"
            )
            roadmap = build_roadmap(gaps) if gaps else []
            scored.append({
                **intern,
                "score": score,
                "missingSkills": missing,
                "status": status,
                "roadmap": roadmap,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_n]
