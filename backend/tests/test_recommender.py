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
        "skills": ["python"],
        "preferredLocations": ["Bengaluru, Karnataka"],
    }
    recommendations = bucket_recommendations(profile, load_internships(), limit=5)
    assert recommendations["stretch"]
    assert recommendations["stretch"][0]["missingSkills"]


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
