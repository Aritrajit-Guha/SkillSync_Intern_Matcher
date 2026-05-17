from backend.engine import gemini_roadmap


def test_parse_topic_response_accepts_json_arrays():
    text = '```json\n["Pandas dataframes", {"topic": "Model evaluation"}, "Deployment basics"]\n```'
    assert gemini_roadmap.parse_topic_response(text) == [
        "Pandas dataframes",
        "Model evaluation",
        "Deployment basics",
    ]


def test_parse_topic_response_accepts_common_object_wrappers():
    assert gemini_roadmap.parse_topic_response('{"topics": ["UX research", {"title": "Wireframing"}]}') == [
        "UX research",
        "Wireframing",
    ]
    assert gemini_roadmap.parse_topic_response('{"levels": [{"topic": "Design systems"}]}') == [
        "Design systems",
    ]
    assert gemini_roadmap.parse_topic_response('{"uiUxRoadmap": {"steps": [{"name": "Usability testing"}]}}') == [
        "Usability testing",
    ]
    assert gemini_roadmap.parse_topic_response('[{"topicTitle": "Interaction design"}, {"Topic 2": "Design critique"}]') == [
        "Interaction design",
        "Design critique",
    ]
    assert gemini_roadmap.parse_topic_response('{"topic1": "Information architecture", "topic2": "Figma prototyping"}') == [
        "Information architecture",
        "Figma prototyping",
    ]


def test_parse_topic_response_salvages_partial_json_array():
    partial = '[\n  "User-Centered Design Principles",\n  "Wireframing and User Flows",'
    assert gemini_roadmap.parse_topic_response(partial) == [
        "User-Centered Design Principles",
        "Wireframing and User Flows",
    ]
    clipped = '[\n  "UI/UX Design Principles'
    assert gemini_roadmap.parse_topic_response(clipped) == [
        "UI/UX Design Principles",
    ]
    assert gemini_roadmap.parse_topic_response("not-json") == []


def test_generation_config_disables_thinking_for_25_flash(monkeypatch):
    monkeypatch.delenv("GEMINI_MAX_OUTPUT_TOKENS", raising=False)
    monkeypatch.delenv("GEMINI_THINKING_BUDGET", raising=False)
    config = gemini_roadmap._generation_config("gemini-2.5-flash")
    assert config["maxOutputTokens"] == 1024
    assert config["thinkingConfig"]["thinkingBudget"] == 0


def test_generation_config_respects_thinking_budget_override(monkeypatch):
    monkeypatch.setenv("GEMINI_MAX_OUTPUT_TOKENS", "2048")
    monkeypatch.setenv("GEMINI_THINKING_BUDGET", "256")
    config = gemini_roadmap._generation_config("gemini-2.5-flash")
    assert config["maxOutputTokens"] == 2048
    assert config["thinkingConfig"]["thinkingBudget"] == 256


def test_generate_skill_topics_falls_back_without_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    topics, source, detail, raw_preview = gemini_roadmap.generate_skill_topic_bundle("python")
    assert source == "fallback"
    assert detail == "missing_api_key"
    assert raw_preview == ""
    assert topics
    assert all(isinstance(topic, str) for topic in topics)


def test_generate_skill_topics_falls_back_on_malformed_response(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini_roadmap, "_request_gemini", lambda _prompt: ("not-json", "", "not-json"))
    topics, source, detail, raw_preview = gemini_roadmap.generate_skill_topic_bundle("react")
    assert source == "fallback"
    assert detail == "malformed_or_empty_topics"
    assert raw_preview == "not-json"
    assert topics[0] == "Components and props"


def test_generate_skill_topics_pads_partial_gemini_response(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    raw = '[\n  "User-Centered Design Principles",'
    monkeypatch.setattr(gemini_roadmap, "_request_gemini", lambda _prompt: (raw, "", raw))
    topics, source, detail, raw_preview = gemini_roadmap.generate_skill_topic_bundle("ui-ux")
    assert source == "gemini"
    assert detail == "partial_gemini_response"
    assert raw_preview == raw
    assert topics[0] == "User-Centered Design Principles"
    assert len(topics) >= 5
