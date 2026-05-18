from backend.engine.career_engine import score_internship_for_profile


def score_internship(intern: dict, profile: dict) -> tuple[int, list]:
    scored = score_internship_for_profile(profile, intern)
    return scored["score"], scored["missingSkills"]
