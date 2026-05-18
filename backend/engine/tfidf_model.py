from backend.engine.career_engine import get_ranker


class TFIDFReranker:
    def rerank(self, profile: dict, candidates: list) -> list:
        return get_ranker().rank(profile, candidates)
