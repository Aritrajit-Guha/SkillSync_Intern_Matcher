from backend.engine.rule_engine import apply_rules


def score_internship(intern: dict, profile: dict) -> tuple[int, list]:
    score = 0
    missing = []

    score += apply_rules(intern, profile)

    required = intern.get("skills", [])
    have = set(profile.get("skills", []))
    if required:
        weight = 40 / len(required)
        for skill in required:
            if skill in have:
                score += weight
            else:
                missing.append(skill)

    return round(min(score, 100)), missing
