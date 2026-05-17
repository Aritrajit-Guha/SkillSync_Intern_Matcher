from pathlib import Path

import pytest

from backend.engine.internship_source import (
    clear_internship_cache,
    internship_metadata,
    load_internships,
)


PROVIDED_WORKBOOK = Path(r"D:\Dada Programs\New folder\merged_normalized_dataset.xlsx")


def test_excel_source_normalizes_fixture_rows():
    internships = load_internships(force_reload=True)
    first = internships[0]
    assert len(internships) == 5
    assert first["id"] == "highquality-labs-machine-learning-intern-bengaluru-karnataka"
    assert first["org"] == "HighQuality Labs"
    assert first["title"] == "Machine Learning Intern"
    assert first["skills"] == ["python", "machine-learning", "aws", "sql", "git"]
    assert first["coordinates"] == {"lat": 13.0166, "lng": 77.5946}
    assert first["education"] == []


def test_metadata_comes_from_current_source():
    metadata = internship_metadata()
    skill_values = {skill["value"] for skill in metadata["skills"]}
    assert metadata["source"] == "excel"
    assert metadata["count"] == 5
    assert "machine-learning" in skill_values
    assert "Bengaluru, Karnataka" in metadata["locations"]


def test_provided_dummy_workbook_shape(monkeypatch):
    if not PROVIDED_WORKBOOK.exists():
        pytest.skip("Provided local dummy workbook is not available on this machine.")
    monkeypatch.setenv("INTERNSHIP_EXCEL_PATH", str(PROVIDED_WORKBOOK))
    clear_internship_cache()
    internships = load_internships(force_reload=True)
    assert len(internships) == 650
    assert internships[0]["org"]
    assert internships[0]["skills"]
    assert internships[0]["coordinates"]["lat"] > 1
    assert internships[0]["coordinates"]["lng"] > 1
