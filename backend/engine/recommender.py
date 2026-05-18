from backend.engine.career_engine import bucket_recommendations, load_internships


class Recommender:
    def __init__(self, internships=None):
        self.internships = internships if internships is not None else load_internships()

    def recommend(self, profile: dict, top_n: int = 5) -> list:
        return bucket_recommendations(profile, self.internships, limit=top_n)["recommended"]
