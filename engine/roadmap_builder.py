"""
roadmap_builder.py — Builds a personalized learning roadmap from skill gaps.
"""
import json, os

COURSES_PATH = os.path.join(os.path.dirname(__file__), "../data/courses.json")

def _load_courses():
    try:
        with open(COURSES_PATH) as f:
            return json.load(f)
    except Exception:
        return {}

def build_roadmap(missing_skills: list) -> list:
    """
    Given a list of missing skill IDs, returns ordered learning steps.
    Each step: { skill, courses: [...] }
    """
    courses_db = _load_courses()
    roadmap = []
    for skill in missing_skills:
        courses = courses_db.get(skill, [])
        if courses:
            roadmap.append({"skill": skill, "courses": courses})
    return roadmap

def estimate_completion_weeks(missing_skills: list) -> int:
    """Rough estimate of total weeks to complete all gap courses."""
    courses_db = _load_courses()
    total = 0
    for skill in missing_skills:
        for course in courses_db.get(skill, []):
            dur = course.get("duration", "")
            weeks = int(dur.split()[0]) if dur and dur[0].isdigit() else 2
            total += weeks
    return total