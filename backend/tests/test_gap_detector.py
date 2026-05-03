from backend.engine.gap_detector import classify_gap, detect_gaps, gap_percentage


def test_detect_gaps():
    assert detect_gaps(["python", "sql"], ["python"]) == ["sql"]


def test_classify_gap():
    assert classify_gap(0) == "eligible"
    assert classify_gap(2) == "near-miss"
    assert classify_gap(3) == "gap"


def test_gap_percentage():
    assert gap_percentage(["python", "sql"], ["python"]) == 0.5
