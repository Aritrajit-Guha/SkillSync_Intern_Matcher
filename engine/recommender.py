"""
recommender.py — Top-level recommendation orchestrator.
Combines rule-based scoring with optional TF-IDF reranking.
"""
import json, os
from engine.scoring       import score_internship
from engine.gap_detector  import detect_gaps
from engine.roadmap_builder import build_roadmap

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/internships.json")

class Recommender:
    def __init__(self):
        self.internships = self._load()

    def _load(self):
        try:
            with open(DATA_PATH) as f:
                return json.load(f)
        except Exception:
            return []

    def recommend(self, profile: dict, top_n: int = 5) -> list:
        scored = []
        for intern in self.internships:
            score, missing = score_internship(intern, profile)
            gaps    = detect_gaps(intern["skills"], profile.get("skills", []))
            status  = ("eligible"  if len(missing) == 0 else
                       "near-miss" if len(missing) <= 2 else "gap")
            roadmap = build_roadmap(missing) if missing else []
            scored.append({
                **intern,
                "score":         score,
                "missingSkills": missing,
                "status":        status,
                "roadmap":       roadmap
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_n]