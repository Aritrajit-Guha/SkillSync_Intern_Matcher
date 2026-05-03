from backend.engine.recommender import Recommender


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
