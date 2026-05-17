import math
import os
import re
from copy import deepcopy
from pathlib import Path

import pandas as pd


DEFAULT_SOURCE = "excel"
SKILL_COLUMNS = [f"skill_{index}" for index in range(1, 6)]
PERK_COLUMNS = [f"perk_{index}" for index in range(1, 4)]

CITY_STATE = {
    "ahmedabad": "Gujarat",
    "bengaluru": "Karnataka",
    "bangalore": "Karnataka",
    "bhubaneswar": "Odisha",
    "chandigarh": "Chandigarh",
    "chennai": "Tamil Nadu",
    "coimbatore": "Tamil Nadu",
    "gurugram": "Haryana",
    "hyderabad": "Telangana",
    "indore": "Madhya Pradesh",
    "jaipur": "Rajasthan",
    "kochi": "Kerala",
    "kolkata": "West Bengal",
    "lucknow": "Uttar Pradesh",
    "mumbai": "Maharashtra",
    "mysore": "Karnataka",
    "mysuru": "Karnataka",
    "new delhi": "Delhi",
    "noida": "Uttar Pradesh",
    "pune": "Maharashtra",
    "remote": "any",
    "thiruvananthapuram": "Kerala",
}

SKILL_ALIASES = {
    ".net": "dotnet",
    "aws": "aws",
    "c++": "cpp",
    "c#": "csharp",
    "css3": "css",
    "deep lear": "deep-learning",
    "ds algos": "data-structures-algorithms",
    "html/css": "html-css",
    "js": "javascript",
    "jira": "jira",
    "manual tes": "manual-testing",
    "ml": "machine-learning",
    "ml ops": "mlops",
    "node": "nodejs",
    "node.js": "nodejs",
    "problem solv": "problem-solving",
    "problem solving": "problem-solving",
    "scikit": "scikit-learn",
    "spring": "spring-boot",
    "ts": "typescript",
    "ui": "ui-design",
    "ui/ux": "ui-ux",
}

PREFERRED_LABELS = {
    "aws": "AWS",
    "cpp": "C++",
    "csharp": "C#",
    "css": "CSS3",
    "data-structures-algorithms": "DS Algos",
    "dotnet": ".NET",
    "html-css": "HTML/CSS",
    "javascript": "JavaScript",
    "jira": "Jira",
    "machine-learning": "Machine Learning",
    "mlops": "ML Ops",
    "nodejs": "Node.js",
    "problem-solving": "Problem Solving",
    "scikit-learn": "Scikit-learn",
    "spring-boot": "Spring Boot",
    "typescript": "TypeScript",
    "ui-ux": "UI/UX",
}

SECTOR_HINTS = [
    ("data-ai", {"machine-learning", "deep-learning", "tensorflow", "pytorch", "nlp", "data-analysis", "analytics", "statistics", "pandas", "numpy", "tableau", "power-bi"}),
    ("frontend", {"react", "nextjs", "vuejs", "angular", "javascript", "typescript", "tailwind", "figma", "html-css", "css"}),
    ("backend", {"python", "java", "nodejs", "go", "django", "flask", "fastapi", "spring-boot", "express", "redis", "postgresql", "mysql", "mongodb"}),
    ("mobile", {"android", "kotlin", "swift", "flutter", "dart", "react-native", "firebase", "retrofit"}),
    ("cloud-devops", {"aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "linux", "ansible", "monitoring"}),
    ("cybersecurity", {"security", "netsec", "firewall", "siem", "vulnerability", "forensics", "web-sec", "vpn", "tls"}),
    ("design", {"figma", "ui-ux", "ui-design", "adobe-xd", "sketch", "motion-des", "design-sys"}),
    ("business", {"product", "product-ops", "marketing", "sourcing", "supply-chain", "logistics", "excel"}),
]

_CACHE = {
    "fingerprint": None,
    "items": [],
    "skill_labels": {},
    "locations": [],
    "source": DEFAULT_SOURCE,
}


def _clean(value):
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).strip()


def slugify(value):
    text = _clean(value).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[/_]+", "-", text)
    text = re.sub(r"[^a-z0-9+#. -]+", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "item"


def normalize_skill(value):
    raw = _clean(value)
    if not raw:
        return ""
    lowered = raw.lower().strip()
    if lowered in SKILL_ALIASES:
        return SKILL_ALIASES[lowered]
    return slugify(raw).replace(".", "")


def skill_label(skill, original=None):
    if skill in PREFERRED_LABELS:
        return PREFERRED_LABELS[skill]
    if original:
        return _clean(original)
    return skill.replace("-", " ").title()


def normalize_skills(row):
    skills = []
    labels = {}
    for column in SKILL_COLUMNS:
        original = _clean(row.get(column))
        skill = normalize_skill(original)
        if skill and skill not in skills:
            skills.append(skill)
            labels[skill] = skill_label(skill, original)
    return skills, labels


def normalize_perks(row):
    return [_clean(row.get(column)) for column in PERK_COLUMNS if _clean(row.get(column))]


def stipend_to_number(stipend):
    if isinstance(stipend, (int, float)) and not math.isnan(float(stipend)):
        return int(stipend)
    digits = "".join(ch for ch in _clean(stipend) if ch.isdigit())
    return int(digits) if digits else 0


def format_stipend(stipend):
    amount = stipend_to_number(stipend)
    if amount:
        return f"{amount:,} INR/month"
    return _clean(stipend) or "Performance Based"


def parse_coordinates(row):
    raw = _clean(row.get("coordinates"))
    if raw:
        parts = [part.strip() for part in raw.split(",")]
        if len(parts) == 2:
            try:
                return {"lat": float(parts[0]), "lng": float(parts[1])}
            except ValueError:
                pass

    try:
        lat = float(row.get("latitude"))
        lng = float(row.get("longitude"))
    except (TypeError, ValueError):
        return None
    if abs(lat) <= 1 and abs(lng) <= 1:
        return None
    return {"lat": lat, "lng": lng}


def infer_state(location):
    text = _clean(location)
    if "," in text:
        state = text.split(",")[-1].strip()
        return state or "any"
    lowered = text.lower()
    for city, state in CITY_STATE.items():
        if city in lowered:
            return state
    return "any" if "remote" in lowered else ""


def normalize_location(location):
    text = _clean(location)
    state = infer_state(text)
    if not text:
        return "Remote - India"
    if "," in text or state in {"", "any", "Chandigarh"}:
        return "Remote - India" if text.lower() == "remote" else text
    return f"{text}, {state}"


def infer_sector(title, skills):
    haystack = {normalize_skill(part) for part in re.split(r"[\s,/]+", _clean(title))}
    haystack.update(skills)
    lowered_title = _clean(title).lower()
    if "android" in lowered_title or "mobile" in lowered_title:
        return "mobile"
    if "frontend" in lowered_title or "front end" in lowered_title:
        return "frontend"
    if "backend" in lowered_title or "back end" in lowered_title:
        return "backend"
    if "analyst" in lowered_title or "analytics" in lowered_title:
        return "data-ai"
    for sector, hints in SECTOR_HINTS:
        if haystack & hints:
            return sector
    return "engineering"


def _excel_path():
    value = os.getenv("INTERNSHIP_EXCEL_PATH", "").strip()
    return Path(value) if value else None


def active_source():
    return os.getenv("INTERNSHIP_SOURCE", DEFAULT_SOURCE).strip().lower() or DEFAULT_SOURCE


def source_fingerprint():
    source = active_source()
    if source == "excel":
        path = _excel_path()
        if not path:
            return "excel:missing-path"
        try:
            stat = path.stat()
            return f"excel:{path.resolve()}:{stat.st_mtime_ns}:{stat.st_size}"
        except OSError:
            return f"excel:{path}:missing"
    if source == "govt_api":
        return f"govt_api:{os.getenv('GOVT_INTERNSHIP_API_URL', '').strip()}"
    return f"{source}:unsupported"


def _normalize_records(rows):
    seen_ids = {}
    items = []
    skill_labels = {}
    locations = set()

    for index, row in enumerate(rows):
        title = _clean(row.get("job_title"))
        org = _clean(row.get("company"))
        if not title or not org:
            continue

        skills, labels = normalize_skills(row)
        skill_labels.update(labels)
        raw_location = _clean(row.get("location"))
        location = normalize_location(raw_location)
        state = infer_state(location)
        coordinates = parse_coordinates(row)
        base_id = slugify(f"{org}-{title}-{location}")
        duplicate_count = seen_ids.get(base_id, 0) + 1
        seen_ids[base_id] = duplicate_count
        internship_id = base_id if duplicate_count == 1 else f"{base_id}-{duplicate_count}"
        sector = infer_sector(title, skills)
        locations.add(location)

        items.append({
            "id": internship_id,
            "icon": "PM",
            "title": title,
            "org": org,
            "sector": sector,
            "state": state,
            "skills": skills,
            "education": [],
            "stipend": format_stipend(row.get("stipend")),
            "stipendAmount": stipend_to_number(row.get("stipend")),
            "duration": "Internship",
            "location": location,
            "seats": 1,
            "desc": f"{title} opportunity at {org} requiring {', '.join(skill_label(skill, labels.get(skill)) for skill in skills[:5])}.",
            "jobType": _clean(row.get("job_type")) or "Internship",
            "experience": _clean(row.get("experience")) or "Entry-level",
            "perks": normalize_perks(row),
            "coordinates": coordinates,
            "source": active_source(),
            "sourceRow": index + 2,
        })

    return items, skill_labels, sorted(locations)


def _load_excel(path):
    if not path or not path.exists():
        return [], {}, []
    frame = pd.read_excel(path)
    records = frame.to_dict(orient="records")
    return _normalize_records(records)


def _load_govt_api():
    # Future adapter hook: API-specific fetching should normalize into the same
    # record shape returned by _normalize_records.
    return [], {}, []


def clear_internship_cache():
    _CACHE.update({
        "fingerprint": None,
        "items": [],
        "skill_labels": {},
        "locations": [],
        "source": active_source(),
    })


def load_internships(force_reload=False):
    fingerprint = source_fingerprint()
    if not force_reload and _CACHE["fingerprint"] == fingerprint:
        return deepcopy(_CACHE["items"])

    source = active_source()
    if source == "excel":
        items, labels, locations = _load_excel(_excel_path())
    elif source == "govt_api":
        items, labels, locations = _load_govt_api()
    else:
        items, labels, locations = [], {}, []

    _CACHE.update({
        "fingerprint": fingerprint,
        "items": items,
        "skill_labels": labels,
        "locations": locations,
        "source": source,
    })
    return deepcopy(items)


def internship_metadata():
    items = load_internships()
    labels = _CACHE["skill_labels"]
    skills = [
        {"value": value, "label": labels.get(value, skill_label(value))}
        for value in sorted({skill for item in items for skill in item.get("skills", [])})
    ]
    return {
        "skills": skills,
        "locations": list(_CACHE["locations"]),
        "source": _CACHE["source"],
        "count": len(items),
    }
