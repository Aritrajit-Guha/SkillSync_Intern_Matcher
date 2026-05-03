import json
import os

COURSES_PATH = os.path.join(os.path.dirname(__file__), "../data/courses.json")


def _load_courses():
    try:
        with open(COURSES_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def build_roadmap(missing_skills: list) -> list:
    courses_db = _load_courses()
    roadmap = []
    for skill in missing_skills:
        courses = courses_db.get(skill, [])
        if courses:
            roadmap.append({"skill": skill, "courses": courses})
    return roadmap


def estimate_completion_weeks(missing_skills: list) -> int:
    courses_db = _load_courses()
    total = 0
    for skill in missing_skills:
        for course in courses_db.get(skill, []):
            duration = course.get("duration", "")
            weeks = int(duration.split()[0]) if duration and duration[0].isdigit() else 2
            total += weeks
    return total
