from backend.engine.roadmap_builder import build_roadmap, estimate_completion_weeks


def test_build_roadmap_for_known_skill():
    roadmap = build_roadmap(["python"])
    assert roadmap
    assert roadmap[0]["skill"] == "python"
    assert roadmap[0]["courses"]


def test_estimate_completion_weeks():
    assert estimate_completion_weeks(["python"]) >= 1
