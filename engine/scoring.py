"""
scoring.py — Core scoring function combining rules + skill overlap.
"""
from engine.rule_engine import apply_rules

def score_internship(intern: dict, profile: dict) -> tuple[int, list]:
    """
    Returns (score: int, missing_skills: list).
    Score is 0–100.
    """
    score   = 0
    missing = []

    # Rule-based component (up to 60 pts)
    score += apply_rules(intern, profile)

    # Skill overlap (up to 40 pts)
    required = intern.get("skills", [])
    have     = set(profile.get("skills", []))
    if required:
        weight = 40 / len(required)
        for skill in required:
            if skill in have:
                score += weight
            else:
                missing.append(skill)

    return round(min(score, 100)), missing