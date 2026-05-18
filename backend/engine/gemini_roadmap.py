import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from backend.engine.internship_source import skill_label


DEFAULT_MODEL = "gemini-2.0-flash"
DEFAULT_MAX_OUTPUT_TOKENS = 1024
LOGGER = logging.getLogger(__name__)
FALLBACK_TOPICS = {
    "machine-learning": ["Python data workflow", "NumPy arrays", "Pandas dataframes", "Model training basics", "Evaluation metrics"],
    "python": ["Python syntax", "Data structures", "Functions and modules", "File and API handling", "Mini project practice"],
    "react": ["Components and props", "State and events", "Forms and validation", "API integration", "Reusable UI patterns"],
    "nodejs": ["Runtime fundamentals", "Modules and packages", "REST APIs", "Database integration", "Deployment basics"],
    "sql": ["Select queries", "Filtering and sorting", "Joins", "Aggregations", "Schema thinking"],
    "aws": ["Cloud fundamentals", "IAM basics", "Compute services", "Storage services", "Deployment workflow"],
    "docker": ["Container basics", "Dockerfiles", "Images and registries", "Compose workflow", "Debugging containers"],
}


def _fallback_topics(skill):
    if skill in FALLBACK_TOPICS:
        return FALLBACK_TOPICS[skill]
    label = skill_label(skill)
    return [
        f"{label} fundamentals",
        f"Core {label} workflow",
        f"Hands-on {label} practice",
        f"{label} project patterns",
        f"{label} interview readiness",
    ]


def parse_topic_response(text):
    if not text:
        return []
    cleaned = str(text).strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL | re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start == -1 or end == -1 or end <= start:
            return _quoted_topics_from_text(cleaned)
        try:
            data = json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            return _quoted_topics_from_text(cleaned)
    if isinstance(data, str):
        return parse_topic_response(data)
    data = _topic_candidates(data)
    if not data:
        return []
    topics = []
    for item in data:
        if isinstance(item, str):
            topic = item.strip()
        elif isinstance(item, dict):
            topic = _topic_from_dict(item)
        else:
            topic = ""
        if topic and topic not in topics:
            topics.append(topic[:120])
    return topics[:8]


def _quoted_topics_from_text(text):
    topics = []
    for match in re.finditer(r'"(?:\\.|[^"\\])*"', text):
        after = text[match.end():].lstrip()
        if after.startswith(":"):
            continue
        try:
            topic = json.loads(match.group(0)).strip()
        except (json.JSONDecodeError, AttributeError):
            continue
        if _looks_like_topic(topic) and topic not in topics:
            topics.append(topic[:120])
    for line in text.splitlines():
        match = re.search(r'"([^"\\]{4,120})$', line.strip())
        if not match:
            continue
        topic = match.group(1).strip().rstrip(",")
        if _looks_like_topic(topic) and topic not in topics:
            topics.append(topic[:120])
    return topics[:8]


def _looks_like_topic(topic):
    words = topic.split()
    if not 2 <= len(words) <= 12:
        return False
    if len(topic) > 120:
        return False
    blocked_fragments = ("http://", "https://", "{", "}", "[", "]")
    return not any(fragment in topic for fragment in blocked_fragments)


def _topic_from_dict(item):
    for key in (
        "topic",
        "title",
        "name",
        "heading",
        "text",
        "topicTitle",
        "topic_title",
        "label",
    ):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    for value in item.values():
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _topic_candidates(data):
    if isinstance(data, list):
        return data
    if not isinstance(data, dict):
        return []

    for key in ("topics", "syllabus", "levels", "roadmap", "items", "steps"):
        value = data.get(key)
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            nested = _topic_candidates(value)
            if nested:
                return nested

    for value in data.values():
        if isinstance(value, list):
            nested = _topic_candidates(value)
            if nested:
                return nested
        if isinstance(value, dict):
            nested = _topic_candidates(value)
            if nested:
                return nested
    string_values = [value.strip() for value in data.values() if isinstance(value, str) and value.strip()]
    if string_values:
        return string_values
    return []


def _extract_text(payload):
    parts = []
    for candidate in payload.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            text = part.get("text")
            if text:
                parts.append(text)
    return "\n".join(parts)


def _env_int(name, default):
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _default_thinking_budget(model):
    model_name = model.lower()
    if "2.5" not in model_name:
        return None
    if "pro" in model_name:
        return 128
    return 0


def _generation_config(model):
    config = {
        "temperature": 0.2,
        "maxOutputTokens": max(256, _env_int("GEMINI_MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS)),
        "responseMimeType": "application/json",
    }
    default_budget = _default_thinking_budget(model)
    if default_budget is not None:
        config["thinkingConfig"] = {
            "thinkingBudget": _env_int("GEMINI_THINKING_BUDGET", default_budget),
        }
    return config


def _request_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return "", "missing_api_key", ""
    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{urllib.parse.quote(model)}:generateContent?key={urllib.parse.quote(api_key)}"
    )
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": _generation_config(model),
    }).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            response_body = response.read().decode("utf-8")
            payload = json.loads(response_body)
            text = _extract_text(payload)
            finish_reasons = [
                candidate.get("finishReason")
                for candidate in payload.get("candidates", [])
                if candidate.get("finishReason")
            ]
            reason = f"finish_{finish_reasons[0].lower()}" if finish_reasons else ""
            raw_payload = json.dumps(payload, ensure_ascii=False, indent=2)
            return text, reason if text else reason or "empty_gemini_response", raw_payload
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        reason = f"http_{error.code}: {body}"
        LOGGER.warning("Gemini roadmap request failed: %s", reason)
        return "", reason, body
    except urllib.error.URLError as error:
        reason = f"url_error: {error.reason}"
        LOGGER.warning("Gemini roadmap request failed: %s", reason)
        return "", reason, ""
    except TimeoutError:
        LOGGER.warning("Gemini roadmap request timed out")
        return "", "timeout", ""
    except json.JSONDecodeError as error:
        reason = f"invalid_gemini_json: {error}"
        LOGGER.warning("Gemini roadmap response was not JSON: %s", reason)
        return "", reason, ""
    except OSError as error:
        reason = f"os_error: {error}"
        LOGGER.warning("Gemini roadmap request failed: %s", reason)
        return "", reason, ""


def generate_skill_topic_bundle(skill, internship=None, user=None):
    label = skill_label(skill)
    internship = internship or {}
    user = user or {}
    prompt = (
        "Return only a JSON array of 5 to 7 short topic titles. "
        "No markdown, no links, no resources, no descriptions. "
        f"The learner needs the missing skill: {label}. "
        f"Target internship: {internship.get('title', 'Internship')} at {internship.get('org', 'an organization')}. "
        f"Known skills: {', '.join(user.get('skills', [])) or 'none listed'}. "
        "Order the topics as a modern practical syllabus from first prerequisite to final readiness."
    )
    text, reason, raw_preview = _request_gemini(prompt)
    topics = parse_topic_response(text)
    if topics:
        completed_topics = _complete_topic_list(skill, topics)
        return completed_topics, "gemini", "" if len(topics) >= 5 else "partial_gemini_response", raw_preview
    fallback_reason = reason or "malformed_or_empty_topics"
    if raw_preview:
        LOGGER.info("Using fallback roadmap topics for %s: %s; raw=%s", skill, fallback_reason, raw_preview[:500])
    else:
        LOGGER.info("Using fallback roadmap topics for %s: %s", skill, fallback_reason)
    return _fallback_topics(skill), "fallback", fallback_reason, raw_preview


def _complete_topic_list(skill, topics):
    completed = list(topics)
    for topic in _fallback_topics(skill):
        if len(completed) >= 5:
            break
        if topic not in completed:
            completed.append(topic)
    return completed[:8]


def generate_skill_topics(skill, internship=None, user=None):
    topics, _source, _detail, _raw_preview = generate_skill_topic_bundle(skill, internship=internship, user=user)
    return topics


def build_levels_from_topics(skill, topics):
    return [
        {
            "id": f"{skill}-topic-{index + 1}",
            "label": f"Level {index + 1}",
            "topic": topic,
        }
        for index, topic in enumerate(topics)
    ]
