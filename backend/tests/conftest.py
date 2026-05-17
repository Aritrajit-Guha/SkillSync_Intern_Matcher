import sys
from pathlib import Path

import pytest
from openpyxl import Workbook

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app import create_app
from backend.engine.internship_source import clear_internship_cache


HEADERS = [
    "company",
    "job_title",
    "location",
    "job_type",
    "experience",
    "skill_1",
    "skill_2",
    "skill_3",
    "skill_4",
    "skill_5",
    "perk_1",
    "perk_2",
    "perk_3",
    "stipend",
    "latitude",
    "longitude",
    "coordinates",
]

ROWS = [
    ["HighQuality Labs", "Machine Learning Intern", "Bengaluru", "Internship", "Fresher", "Python", "ML", "AWS", "SQL", "Git", "Certificate", "Mentorship", "PPO", 85000, 0.13, 0.94, "13.016600, 77.594600"],
    ["Close Average Co", "Python Support Intern", "Bengaluru", "Internship", "Fresher", "Python", "SQL", "Git", "Excel", "Comm", "Certificate", "", "", 12000, 0.13, 0.94, "12.971600, 77.594600"],
    ["Frontend Works", "Frontend Dev", "Gurugram", "Full Time", "0-1 Years", "React", "JS", "Figma", "Tailwind", "Git", "Certificate", "Gym", "Health Ins", 45000, 0.57, 0.94, "28.464615, 77.029919"],
    ["Cloud Forge", "DevOps Intern", "Remote", "Internship", "Entry-level", "Docker", "AWS", "Linux", "Python", "Terraform", "Certificate", "Work from Home", "Mentorship", 50000, 0.0, 0.0, ""],
    ["Data Desk", "Business Analyst Intern", "Noida", "Contract", "1-2 Years", "Data Analysis", "SQL", "Excel", "Power BI", "Problem Solving", "Certificate", "Flexible Hrs", "Mentorship", 35000, 0.58, 0.94, "28.570633, 77.327215"],
]


def write_internship_workbook(path):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Sheet1"
    sheet.append(HEADERS)
    for row in ROWS:
        sheet.append(row)
    workbook.save(path)


@pytest.fixture
def internship_xlsx(tmp_path):
    path = tmp_path / "internships.xlsx"
    write_internship_workbook(path)
    return path


@pytest.fixture(autouse=True)
def configured_internship_source(monkeypatch, internship_xlsx):
    monkeypatch.setenv("INTERNSHIP_SOURCE", "excel")
    monkeypatch.setenv("INTERNSHIP_EXCEL_PATH", str(internship_xlsx))
    monkeypatch.setenv("FORCE_FILE_STORE", "1")
    clear_internship_cache()
    yield
    clear_internship_cache()


@pytest.fixture
def client(tmp_path):
    app = create_app()
    app.config.update(TESTING=True, SECRET_KEY="test-secret")
    app.instance_path = str(tmp_path)
    with app.test_client() as test_client:
        yield test_client
