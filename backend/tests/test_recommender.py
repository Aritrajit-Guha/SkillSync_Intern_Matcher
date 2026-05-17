from backend.engine.recommender import Recommender
from backend.engine.career_engine import bucket_recommendations, get_ranker, load_internships


def test_recommender_returns_ranked_results():
    profile = {
        "state": "Remote",
        "education": "graduation",
        "stream": "engineering",
        "skills": ["python", "javascript", "git"],
        "sectors": ["engineering"],
    }
    results = Recommender().recommend(profile, top_n=3)
    assert len(results) == 3
    assert all("score" in item for item in results)
    assert results == sorted(results, key=lambda item: item["score"], reverse=True)


def test_ml_quality_can_beat_slightly_closer_average_role():
    profile = {
        "highestQualification": "graduation",
        "skills": ["python", "machine-learning", "aws", "sql", "git"],
        "coordinates": {"lat": 12.9716, "lng": 77.5946},
    }
    recommendations = bucket_recommendations(profile, load_internships(), limit=5)["recommended"]
    assert recommendations[0]["org"] == "HighQuality Labs"
    assert recommendations[0]["distanceKm"] > 0
    assert recommendations[0]["qualityScore"] > recommendations[1]["qualityScore"]


def test_missing_skills_are_kept_for_roadmaps():
    profile = {
        "highestQualification": "graduation",
        "skills": ["python", "sql", "git", "aws"],
        "preferredLocations": ["Bengaluru, Karnataka"],
    }
    recommendations = bucket_recommendations(profile, load_internships(), limit=5)
    assert recommendations["growthPicks"]
    assert recommendations["growthPicks"][0]["missingSkills"]
    assert all(1 <= len(item["missingSkills"]) <= 2 for item in recommendations["growthPicks"])


def test_ready_and_growth_buckets_are_split_by_skill_gap():
    profile = {
        "highestQualification": "graduation",
        "skills": ["python", "machine-learning", "aws", "sql", "git"],
        "preferredLocations": ["Bengaluru, Karnataka"],
    }
    recommendations = bucket_recommendations(profile, load_internships(), limit=5)
    assert recommendations["readyMatches"]
    assert all(not item["missingSkills"] for item in recommendations["readyMatches"])
    assert all(1 <= len(item["missingSkills"]) <= 2 for item in recommendations["growthPicks"])


def test_preferences_change_ranking_without_hard_filtering():
    base_profile = {
        "highestQualification": "graduation",
        "skills": ["python", "sql", "git"],
        "preferredLocations": ["Bengaluru, Karnataka"],
    }
    remote_profile = {
        **base_profile,
        "desiredLocation": "Remote",
        "jobType": "Internship",
        "stipendPreference": "Paid stipend",
        "experiencePreference": "Fresher",
    }
    local_results = bucket_recommendations(base_profile, load_internships(), limit=5)["growthPicks"]
    remote_results = bucket_recommendations(remote_profile, load_internships(), limit=5)["growthPicks"]
    assert local_results
    assert remote_results
    assert {item["id"] for item in remote_results}
    assert all(item["jobType"] for item in remote_results)


def test_ranker_refits_when_dataset_changes():
    ranker = get_ranker()
    first = load_internships(force_reload=True)
    ranker.rank({"skills": ["python"]}, first)
    first_signature = ranker.signature
    changed = first + [{
        **first[0],
        "id": "fresh-source-row",
        "stipendAmount": 90000,
        "skills": ["python", "react"],
    }]
    ranker.rank({"skills": ["python"]}, changed)
    assert ranker.signature != first_signature
