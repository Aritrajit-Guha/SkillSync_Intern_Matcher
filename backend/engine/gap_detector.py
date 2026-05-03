"""
gap_detector.py — Detects skill gaps between required and candidate skills.
"""

def detect_gaps(required: list, have: list) -> list:
    """Returns list of missing skills."""
    have_set = set(have)
    return [s for s in required if s not in have_set]

def classify_gap(missing_count: int) -> str:
    """Classifies gap severity."""
    if missing_count == 0:
        return "eligible"
    elif missing_count <= 2:
        return "near-miss"
    else:
        return "gap"

def gap_percentage(required: list, have: list) -> float:
    """Returns what fraction of required skills are missing."""
    if not required:
        return 0.0
    gaps = detect_gaps(required, have)
    return len(gaps) / len(required)