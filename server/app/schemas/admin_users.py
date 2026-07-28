from datetime import datetime

from pydantic import BaseModel


class AdminUserEntry(BaseModel):
    id: str
    email: str
    role: str
    generatedQuizzes: int
    createdAt: datetime


class AdminUserListResponse(BaseModel):
    users: list[AdminUserEntry]
    total: int


class DeleteUserResponse(BaseModel):
    message: str