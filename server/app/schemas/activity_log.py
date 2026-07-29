from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ActivityType = Literal[
    "registered",
    "generated",
    "downloaded",
    "quiz_deleted",
    "user_deleted",
]


class ActivityLogEntry(BaseModel):
    id: str
    email: str
    description: str
    type: ActivityType
    timestamp: datetime


class ActivityLogListResponse(BaseModel):
    logs: list[ActivityLogEntry]
    total: int