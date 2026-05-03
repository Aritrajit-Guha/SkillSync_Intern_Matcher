"""
rule_engine.py — Human-readable business rules for eligibility.
"""

RULES = [
    {
        "id":          "education_match",
        "weight":      30,
        "description": "Candidate education must match internship requirement",
        "evaluate":    lambda intern, profile: intern["education"] and profile.get("education") in intern["education"]
    },
    {
        "id":          "sector_preference",
        "weight":      20,
        "description": "Candidate's preferred sector matches internship sector",
        "evaluate":    lambda intern, profile: intern.get("sector") in profile.get("sectors", [])
    },
    {
        "id":          "location_preference",
        "weight":      10,
        "description": "Internship is pan-India or matches candidate state",
        "evaluate":    lambda intern, profile: intern.get("state") == "any" or intern.get("state") == profile.get("state")
    }
]

def apply_rules(intern: dict, profile: dict) -> int:
    """Returns bonus score from rule engine (0–60)."""
    total = 0
    for rule in RULES:
        try:
            if rule["evaluate"](intern, profile):
                total += rule["weight"]
        except Exception:
            pass
    return total