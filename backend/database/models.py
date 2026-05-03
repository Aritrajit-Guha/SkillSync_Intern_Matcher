"""
models.py — Python dataclass representations of DB models.
MongoDB stores documents as dicts; these dataclasses serve as typed
view-models / DTOs for the engine layer.
"""
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Internship:
    id:          str
    title:       str
    org:         str
    sector:      str
    state:       str
    skills:      List[str]
    education:   List[str]
    stipend:     str
    duration:    str
    location:    str
    seats:       int
    description: Optional[str] = ""

    @staticmethod
    def from_doc(doc: dict) -> "Internship":
        return Internship(
            id=doc["id"],
            title=doc["title"],
            org=doc["org"],
            sector=doc.get("sector", ""),
            state=doc.get("state", "any"),
            skills=doc.get("skills", []),
            education=doc.get("education", []),
            stipend=doc.get("stipend", ""),
            duration=doc.get("duration", ""),
            location=doc.get("location", ""),
            seats=doc.get("seats", 0),
            description=doc.get("description", ""),
        )

    def to_doc(self) -> dict:
        return self.__dict__.copy()


@dataclass
class Course:
    skill_id:  str
    title:     str
    platform:  str
    duration:  str
    url:       str
    icon:      str = "📘"

    @staticmethod
    def from_doc(doc: dict) -> "Course":
        return Course(
            skill_id=doc["skill_id"],
            title=doc["title"],
            platform=doc.get("platform", ""),
            duration=doc.get("duration", ""),
            url=doc.get("url", ""),
            icon=doc.get("icon", "📘"),
        )


@dataclass
class Progress:
    user_id:            str
    xp:                 int               = 0
    completed_courses:  List[str]         = field(default_factory=list)
    activities:         List[dict]        = field(default_factory=list)

    @staticmethod
    def from_doc(doc: dict) -> "Progress":
        return Progress(
            user_id=doc["user_id"],
            xp=doc.get("xp", 0),
            completed_courses=doc.get("completed_courses", []),
            activities=doc.get("activities", []),
        )

    def to_doc(self) -> dict:
        return self.__dict__.copy()


@dataclass
class UserProfile:
    user_id:   str
    state:     str
    education: str
    stream:    str
    skills:    List[str] = field(default_factory=list)
    sectors:   List[str] = field(default_factory=list)

    @staticmethod
    def from_doc(doc: dict) -> "UserProfile":
        return UserProfile(
            user_id=doc["user_id"],
            state=doc.get("state", ""),
            education=doc.get("education", ""),
            stream=doc.get("stream", ""),
            skills=doc.get("skills", []),
            sectors=doc.get("sectors", []),
        )

    def to_doc(self) -> dict:
        return self.__dict__.copy()
