import json
import math
import os
from copy import deepcopy


DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/internships.json")

LOCATION_COORDS = {
    "Ahmedabad, Gujarat": {"lat": 23.0225, "lng": 72.5714},
    "Bengaluru, Karnataka": {"lat": 12.9716, "lng": 77.5946},
    "Bhubaneswar, Odisha": {"lat": 20.2961, "lng": 85.8245},
    "Chandigarh": {"lat": 30.7333, "lng": 76.7794},
    "Chennai, Tamil Nadu": {"lat": 13.0827, "lng": 80.2707},
    "Coimbatore, Tamil Nadu": {"lat": 11.0168, "lng": 76.9558},
    "Gurugram, Haryana": {"lat": 28.4595, "lng": 77.0266},
    "Hyderabad, Telangana": {"lat": 17.385, "lng": 78.4867},
    "Indore, Madhya Pradesh": {"lat": 22.7196, "lng": 75.8577},
    "Jaipur, Rajasthan": {"lat": 26.9124, "lng": 75.7873},
    "Kochi, Kerala": {"lat": 9.9312, "lng": 76.2673},
    "Kolkata, West Bengal": {"lat": 22.5726, "lng": 88.3639},
    "Lucknow, Uttar Pradesh": {"lat": 26.8467, "lng": 80.9462},
    "Mumbai, Maharashtra": {"lat": 19.076, "lng": 72.8777},
    "Mysuru, Karnataka": {"lat": 12.2958, "lng": 76.6394},
    "New Delhi, Delhi": {"lat": 28.6139, "lng": 77.209},
    "Noida, Uttar Pradesh": {"lat": 28.5355, "lng": 77.391},
    "Pune, Maharashtra": {"lat": 18.5204, "lng": 73.8567},
    "Remote - India": {"lat": 20.5937, "lng": 78.9629},
    "Thiruvananthapuram, Kerala": {"lat": 8.5241, "lng": 76.9366},
}

ROADMAP_TOPICS = {
    "python": ["Syntax and core data structures", "REST APIs and backend patterns", "Debugging and mini project"],
    "javascript": ["Language fundamentals and ES6", "Async workflows and APIs", "Interactive app logic"],
    "react": ["Components and props", "State management and forms", "Build a responsive interface"],
    "nodejs": ["Runtime and modules", "Express APIs and middleware", "Database-connected backend"],
    "django": ["Models and routing", "Auth and forms", "CRUD app architecture"],
    "flask": ["Routes and request handling", "Blueprints and validation", "API project build"],
    "fastapi": ["Typed endpoints", "Validation and async patterns", "Production-style API structure"],
    "sql": ["Queries and filtering", "Joins and aggregations", "Schema thinking and practice"],
    "mongodb": ["Documents and collections", "CRUD patterns", "Data modeling basics"],
    "aws": ["Cloud foundations", "Deploying services", "Storage and compute workflows"],
    "docker": ["Images and containers", "Compose and local environments", "Packaging a project"],
    "git": ["Branching and commits", "Pull requests and reviews", "Conflict resolution"],
    "typescript": ["Types and interfaces", "Typed components and APIs", "Refactoring for safety"],
    "machine-learning": ["Data prep and features", "Model training basics", "Evaluation and iteration"],
    "data-analysis": ["Cleaning and exploration", "Visual trends and insights", "Case-study storytelling"],
    "pandas": ["Series and DataFrames", "Filtering and grouping", "Messy dataset workflows"],
    "numpy": ["Arrays and indexing", "Vectorized operations", "Numerical problem solving"],
    "html-css": ["Semantic structure", "Responsive layouts", "Polished UI styling"],
    "java": ["OOP and collections", "Backend fundamentals", "Project structure and debugging"],
    "cpp": ["Syntax and memory basics", "STL and problem solving", "Implementation practice"],
    "figma": ["Design frames and hierarchy", "Components and design systems", "Developer handoff"],
    "ui-ux": ["Research and user flows", "Wireframes and interaction design", "Usability review"],
    "spring-boot": ["Project setup", "REST services", "Layered architecture"],
    "express": ["Routing and middleware", "Validation and controllers", "Backend mini service"],
    "linux": ["Terminal navigation", "Files and permissions", "Dev workflow commands"],
    "jira": ["Boards and tickets", "Sprint planning", "Team workflow hygiene"],
    "problem-solving": ["Break down the problem", "Design a step-by-step approach", "Communicate tradeoffs clearly"],
    "tensorflow": ["Tensors and models", "Training pipelines", "Experiment tracking"],
}

QUALIFICATION_ORDER = {
    "class10": 1,
    "class12": 2,
    "diploma": 3,
    "graduation": 4,
    "postgrad": 5,
}


def load_internships():
    try:
        with open(DATA_PATH, encoding="utf-8") as handle:
            items = json.load(handle)
    except Exception:
        items = []
    enriched = []
    for item in items:
        normalized = deepcopy(item)
        normalized["coordinates"] = LOCATION_COORDS.get(item.get("location"), LOCATION_COORDS.get("Remote - India"))
        enriched.append(normalized)
    return enriched


def salary_to_number(stipend):
    digits = "".join(ch for ch in str(stipend) if ch.isdigit())
    return int(digits) if digits else 0


def haversine_km(source, target):
    if not source or not target:
        return None
    lat1, lng1 = math.radians(source["lat"]), math.radians(source["lng"])
    lat2, lng2 = math.radians(target["lat"]), math.radians(target["lng"])
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    return round(6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def education_matches(profile, internship):
    candidate = profile.get("highestQualification", profile.get("education", ""))
    candidate_rank = QUALIFICATION_ORDER.get(candidate, 0)
    accepted = internship.get("education", [])
    return any(candidate_rank >= QUALIFICATION_ORDER.get(item, 0) for item in accepted) if accepted else True


def build_levels(skill_key):
    topics = ROADMAP_TOPICS.get(
        skill_key,
        ["Foundations", "Guided practice", "Project checkpoint"],
    )
    return [
        {
            "id": f"{skill_key}-level-{index + 1}",
            "label": f"Level {index + 1}",
            "topic": topic,
        }
        for index, topic in enumerate(topics)
    ]


def score_internship_for_profile(profile, internship):
    user_skills = set(profile.get("skills", []))
    internship_skills = internship.get("skills", [])
    matched = [skill for skill in internship_skills if skill in user_skills]
    missing = [skill for skill in internship_skills if skill not in user_skills]
    skill_score = (len(matched) / len(internship_skills) * 55) if internship_skills else 0

    preferred_locations = [item.lower() for item in profile.get("preferredLocations", [])]
    internship_location = f"{internship.get('location', '')} {internship.get('state', '')}".lower()
    location_score = 12
    if preferred_locations:
        location_score = 22 if any(pref in internship_location or "remote" in internship_location for pref in preferred_locations) else 4

    qualification_score = 15 if education_matches(profile, internship) else 0
    salary_score = min(salary_to_number(internship.get("stipend")) / 2000, 8)
    experience = internship.get("experience", "")
    experience_score = 10 if experience in {"Fresher", "Entry-level", "0-1 Years", "0-6 Months"} else 5

    distance_km = haversine_km(profile.get("coordinates"), internship.get("coordinates"))
    if distance_km is None:
        distance_score = 4
    elif distance_km <= 20:
        distance_score = 12
    elif distance_km <= 40:
        distance_score = 10
    elif distance_km <= 150:
        distance_score = 7
    elif "remote" in internship_location:
        distance_score = 10
    else:
        distance_score = 2

    # ML-friendly weighted hybrid score baseline.
    raw_score = skill_score + location_score + qualification_score + salary_score + experience_score + distance_score

    # Opportunity boost: if a role is only 1-2 skills away and location is reasonably close,
    # don't let strict preferred-location matching hide a better internship.
    opportunity_boost = 0
    if 1 <= len(missing) <= 2 and distance_km is not None and distance_km <= 25:
        opportunity_boost = 5

    score = round(min(raw_score + opportunity_boost, 100))
    return {
        **deepcopy(internship),
        "matchedSkills": matched,
        "missingSkills": missing,
        "score": score,
        "scoreBreakdown": {
            "skill": round(skill_score, 2),
            "location": round(location_score, 2),
            "qualification": round(qualification_score, 2),
            "salary": round(salary_score, 2),
            "experience": round(experience_score, 2),
            "distance": round(distance_score, 2),
            "opportunityBoost": round(opportunity_boost, 2),
        },
        "isQualified": len(missing) == 0 and education_matches(profile, internship),
        "distanceKm": distance_km,
    }


def bucket_recommendations(profile, internships, limit=5):
    scored = [score_internship_for_profile(profile, item) for item in internships]
    catalog = [item for item in scored if education_matches(profile, item)]
    recommended = list(catalog)
    qualified = [item for item in scored if item["isQualified"]]
    stretch = [item for item in scored if 1 <= len(item["missingSkills"]) <= 2 and education_matches(profile, item)]
    catalog.sort(key=lambda item: (item["title"].lower(), -item["score"], item["org"].lower()))
    recommended.sort(key=lambda item: (item["score"], -len(item["missingSkills"])), reverse=True)
    qualified.sort(key=lambda item: item["score"], reverse=True)
    stretch.sort(key=lambda item: (item["score"], -len(item["missingSkills"])), reverse=True)
    return {
        "catalog": catalog,
        "recommended": recommended[:limit],
        "qualified": qualified[:limit],
        "stretch": stretch[:limit],
    }
