"""
tfidf_model.py — Optional TF-IDF reranker using internship descriptions.
Falls back gracefully if scikit-learn is not available.
"""
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

import json, os

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/internships.json")

class TFIDFReranker:
    def __init__(self):
        self.vectorizer   = None
        self.tfidf_matrix = None
        self.internships  = []
        if SKLEARN_AVAILABLE:
            self._fit()

    def _fit(self):
        try:
            with open(DATA_PATH) as f:
                self.internships = json.load(f)
            docs = [
                f"{i.get('title','')} {i.get('org','')} {i.get('sector','')} {' '.join(i.get('skills',[]))}"
                for i in self.internships
            ]
            self.vectorizer   = TfidfVectorizer(stop_words="english")
            self.tfidf_matrix = self.vectorizer.fit_transform(docs)
        except Exception:
            pass

    def rerank(self, profile: dict, candidates: list) -> list:
        """Rerank candidates using TF-IDF cosine similarity on profile text."""
        if not SKLEARN_AVAILABLE or self.vectorizer is None:
            return candidates

        query = " ".join([
            profile.get("stream", ""),
            " ".join(profile.get("skills", [])),
            " ".join(profile.get("sectors", []))
        ])
        try:
            qvec   = self.vectorizer.transform([query])
            scores = cosine_similarity(qvec, self.tfidf_matrix).flatten()
            id_to_score = {self.internships[i]["id"]: float(scores[i]) for i in range(len(self.internships))}
            for c in candidates:
                c["tfidf_score"] = id_to_score.get(c["id"], 0)
            candidates.sort(key=lambda x: x.get("score",0)*0.7 + x.get("tfidf_score",0)*30, reverse=True)
        except Exception:
            pass
        return candidates