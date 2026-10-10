from datetime import datetime
from pydantic import BaseModel

from app.models.activity_log import ActivityType


class ActivityLogEntry(BaseModel):
    id: str
    email: str
    description: str
    type: ActivityType
    timestamp: datetime


class ActivityLogListResponse(BaseModel):
    logs: list[ActivityLogEntry]
    total: int