import hashlib
import math
from copy import deepcopy

from backend.engine.internship_source import (
    load_internships,
    normalize_skill,
    source_fingerprint,
    stipend_to_number,
)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


QUALIFICATION_ORDER = {
    "class10": 1,
    "class12": 2,
    "diploma": 3,
    "graduation": 4,
    "postgrad": 5,
}


def salary_to_number(stipend):
    return stipend_to_number(stipend)


def haversine_km(source, target):
    if not source or not target:
        return None
    lat1, lng1 = math.radians(float(source["lat"])), math.radians(float(source["lng"]))
    lat2, lng2 = math.radians(float(target["lat"])), math.radians(float(target["lng"]))
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
    return round(6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def education_matches(profile, internship):
    accepted = internship.get("education", [])
    if not accepted:
        return True
    candidate = profile.get("highestQualification", profile.get("education", ""))
    candidate_rank = QUALIFICATION_ORDER.get(candidate, 0)
    return any(candidate_rank >= QUALIFICATION_ORDER.get(item, 0) for item in accepted)


def _dataset_signature(internships):
    digest = hashlib.sha1(
        "|".join(
            f"{item.get('id')}:{item.get('stipendAmount')}:{','.join(item.get('skills', []))}"
            for item in internships
        ).encode("utf-8")
    ).hexdigest()
    return f"{source_fingerprint()}:{digest}"


def _document_for(internship):
    return " ".join([
        internship.get("title", ""),
        internship.get("org", ""),
        internship.get("sector", ""),
        internship.get("location", ""),
        internship.get("jobType", ""),
        internship.get("experience", ""),
        " ".join(internship.get("skills", [])),
        " ".join(internship.get("perks", [])),
    ])


def _normalize_profile(profile):
    normalized = dict(profile or {})
    normalized["skills"] = [
        normalize_skill(skill)
        for skill in normalized.get("skills", [])
        if normalize_skill(skill)
    ]
    if "preferredLocations" not in normalized and normalized.get("state"):
        normalized["preferredLocations"] = [normalized["state"]]
    normalized["sectors"] = [
        str(sector).strip().lower()
        for sector in normalized.get("sectors", [])
        if str(sector).strip()
    ]
    return normalized


def _query_for(profile):
    parts = []
    parts.extend(profile.get("skills", []))
    parts.extend(profile.get("sectors", []))
    parts.append(profile.get("domain", ""))
    parts.append(profile.get("stream", ""))
    parts.append(profile.get("highestQualification", profile.get("education", "")))
    parts.extend(profile.get("preferredLocations", []))
    if profile.get("desiredLocation"):
        parts.append(profile["desiredLocation"])
    if profile.get("jobType"):
        parts.append(profile["jobType"])
    return " ".join(str(part) for part in parts if part)


def _profile_coordinates(profile, internships):
    desired_location = str(profile.get("desiredLocation", "")).lower()
    if desired_location and "remote" not in desired_location:
        for internship in internships:
            location = internship.get("location", "").lower()
            state = internship.get("state", "").lower()
            if desired_location in location or desired_location in state or location.split(",")[0] in desired_location:
                return internship.get("coordinates")

    coordinates = profile.get("coordinates")
    if isinstance(coordinates, dict) and coordinates.get("lat") is not None and coordinates.get("lng") is not None:
        return coordinates

    preferred_locations = [str(item).lower() for item in profile.get("preferredLocations", []) if item]
    if not preferred_locations:
        return None
    if any("remote" in location for location in preferred_locations):
        return None

    for preferred in preferred_locations:
        for internship in internships:
            location = internship.get("location", "").lower()
            state = internship.get("state", "").lower()
            if preferred in location or preferred in state or location.split(",")[0] in preferred:
                return internship.get("coordinates")
    return None


def _distance_utility(distance_km, internship):
    location = f"{internship.get('location', '')} {internship.get('state', '')}".lower()
    if "remote" in location:
        return 0.86
    if distance_km is None:
        return 0.58
    return max(0.05, math.exp(-distance_km / 75))


def _experience_utility(experience):
    text = str(experience or "").lower()
    if any(token in text for token in ["fresher", "entry", "0-6", "0-1", "2026", "2027"]):
        return 1
    if "1-2" in text:
        return 0.74
    return 0.62


def _text_match_utility(preference, value):
    pref = str(preference or "").strip().lower()
    actual = str(value or "").strip().lower()
    if not pref or pref in {"any", "all"}:
        return 0.65
    if pref == actual or pref in actual or actual in pref:
        return 1
    return 0.2


def _stipend_preference_utility(preference, internship):
    pref = str(preference or "any").strip().lower()
    if pref in {"", "any"}:
        return 0.65
    amount = salary_to_number(internship.get("stipendAmount", internship.get("stipend")))
    stipend_text = str(internship.get("stipend", "")).lower()
    is_paid = amount > 0 and "performance" not in stipend_text and "free" not in stipend_text
    if pref in {"paid", "paid stipend", "stipend"}:
        return 1 if is_paid else 0.08
    if pref in {"free", "free/performance-based", "performance", "performance based"}:
        return 1 if not is_paid else 0.42
    return 0.65


def _experience_preference_utility(profile, internship):
    pref = str(profile.get("experiencePreference", "any")).strip().lower()
    if pref in {"", "any"}:
        return 0.65
    text = str(internship.get("experience", "")).lower()
    fresher_role = any(token in text for token in ["fresher", "entry", "0-6", "0-1", "2026", "2027"])
    if pref in {"fresher", "freshers", "entry-level"}:
        return 1 if fresher_role else 0.25
    if pref in {"experienced", "experience"}:
        amount = float(profile.get("experienceAmount") or 0)
        if amount <= 0:
            return 0.65 if fresher_role else 0.75
        if "1-2" in text and amount >= 1:
            return 1
        return 0.45 if fresher_role else 0.72
    return 0.65


class ContentBasedInternshipRanker:
    def __init__(self):
        self.signature = None
        self.vectorizer = None
        self.matrix = None
        self.internships = []
        self.stipend_min = 0
        self.stipend_max = 0
        self.fit_count = 0

    def _fit(self, internships):
        self.signature = _dataset_signature(internships)
        self.internships = deepcopy(internships)
        stipends = [salary_to_number(item.get("stipendAmount", item.get("stipend"))) for item in internships]
        positive_stipends = [value for value in stipends if value > 0]
        self.stipend_min = min(positive_stipends) if positive_stipends else 0
        self.stipend_max = max(positive_stipends) if positive_stipends else 0
        self.vectorizer = None
        self.matrix = None
        self.fit_count += 1

        if not SKLEARN_AVAILABLE or not internships:
            return
        docs = [_document_for(item) for item in internships]
        try:
            self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            self.matrix = self.vectorizer.fit_transform(docs)
        except ValueError:
            self.vectorizer = None
            self.matrix = None

    def _ensure_fit(self, internships):
        signature = _dataset_signature(internships)
        if self.signature != signature:
            self._fit(internships)

    def _similarities(self, profile):
        if self.vectorizer is None or self.matrix is None:
            return [0.0 for _ in self.internships]
        query = _query_for(profile)
        if not query.strip():
            return [0.0 for _ in self.internships]
        try:
            query_vector = self.vectorizer.transform([query])
            return cosine_similarity(query_vector, self.matrix).flatten().tolist()
        except Exception:
            return [0.0 for _ in self.internships]

    def _stipend_utility(self, internship):
        amount = salary_to_number(internship.get("stipendAmount", internship.get("stipend")))
        if amount <= 0:
            return 0.28
        if self.stipend_max <= self.stipend_min:
            return 0.7
        return (amount - self.stipend_min) / (self.stipend_max - self.stipend_min)

    def rank(self, profile, internships):
        normalized_profile = _normalize_profile(profile)
        self._ensure_fit(internships)
        similarities = self._similarities(normalized_profile)
        user_skills = set(normalized_profile.get("skills", []))
        profile_coordinates = _profile_coordinates(normalized_profile, internships)

        ranked = []
        for index, internship in enumerate(internships):
            internship_skills = internship.get("skills", [])
            matched = [skill for skill in internship_skills if skill in user_skills]
            missing = [skill for skill in internship_skills if skill not in user_skills]
            skill_coverage = len(matched) / len(internship_skills) if internship_skills else 0.4
            ml_score = float(similarities[index]) if index < len(similarities) else 0
            stipend_utility = self._stipend_utility(internship)
            perk_utility = min(len(internship.get("perks", [])) / 3, 1)
            experience_utility = _experience_utility(internship.get("experience"))
            quality_score = (stipend_utility * 0.58) + (perk_utility * 0.25) + (experience_utility * 0.17)
            distance_km = haversine_km(profile_coordinates, internship.get("coordinates"))
            distance_score = _distance_utility(distance_km, internship)
            qualification_score = 1 if education_matches(normalized_profile, internship) else 0
            domain_score = _text_match_utility(
                normalized_profile.get("domain") or normalized_profile.get("sector"),
                internship.get("sector"),
            )
            job_type_score = _text_match_utility(normalized_profile.get("jobType"), internship.get("jobType"))
            stipend_preference_score = _stipend_preference_utility(normalized_profile.get("stipendPreference"), internship)
            experience_preference_score = _experience_preference_utility(normalized_profile, internship)
            preference_score = (
                (domain_score * 0.34)
                + (job_type_score * 0.22)
                + (stipend_preference_score * 0.22)
                + (experience_preference_score * 0.22)
            )

            blended = (
                (ml_score * 0.30)
                + (skill_coverage * 0.20)
                + (quality_score * 0.19)
                + (distance_score * 0.14)
                + (preference_score * 0.12)
                + (qualification_score * 0.05)
            )
            score = round(max(0, min(blended * 100, 100)))
            status = "eligible" if not missing and qualification_score else "near-miss" if len(missing) <= 2 else "gap"

            ranked.append({
                **deepcopy(internship),
                "matchedSkills": matched,
                "missingSkills": missing,
                "score": score,
                "mlScore": round(ml_score * 100, 2),
                "qualityScore": round(quality_score * 100, 2),
                "distanceKm": distance_km,
                "isQualified": not missing and bool(qualification_score),
                "status": status,
                "scoreBreakdown": {
                    "skill": round(skill_coverage * 100, 2),
                    "ml": round(ml_score * 100, 2),
                    "quality": round(quality_score * 100, 2),
                    "location": round(distance_score * 20, 2),
                    "distance": round(distance_score * 12, 2),
                    "qualification": round(qualification_score * 15, 2),
                    "domainPreference": round(domain_score * 100, 2),
                    "jobTypePreference": round(job_type_score * 100, 2),
                    "stipendPreference": round(stipend_preference_score * 100, 2),
                    "experiencePreference": round(experience_preference_score * 100, 2),
                    "opportunityBoost": 0,
                },
            })

        ranked.sort(key=lambda item: item["score"], reverse=True)
        return ranked


_RANKER = ContentBasedInternshipRanker()


def get_ranker():
    return _RANKER


def score_internship_for_profile(profile, internship):
    return _RANKER.rank(profile, [internship])[0]


def bucket_recommendations(profile, internships, limit=5):
    scored = _RANKER.rank(profile, internships)
    catalog = scored
    recommended = catalog[:limit]
    ready_matches = [item for item in scored if item["isQualified"]][:limit]
    growth_picks = [
        item
        for item in scored
        if 1 <= len(item.get("missingSkills", [])) <= 2 and education_matches(profile or {}, item)
    ][:limit]
    return {
        "catalog": catalog,
        "recommended": recommended,
        "qualified": ready_matches,
        "stretch": growth_picks,
        "readyMatches": ready_matches,
        "growthPicks": growth_picks,
    }
