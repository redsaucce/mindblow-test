from pydantic import BaseModel, Field


class SendAnnouncementRequest(BaseModel):
    title: str = Field(max_length=200)
    subject: str = Field(max_length=200)
    message: str = Field(max_length=5000)


class SendAnnouncementResponse(BaseModel):
    message: str