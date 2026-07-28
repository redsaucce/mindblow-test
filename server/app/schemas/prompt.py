from pydantic import BaseModel, Field


class PromptFields(BaseModel):
    prefix: str = Field(default="", max_length=10000)
    objectives: str = Field(default="", max_length=10000)
    constraints: str = Field(default="", max_length=10000)
    suffix: str = Field(default="", max_length=10000)


class UpdatePromptRequest(BaseModel):
    prefix: str = Field(max_length=10000)
    objectives: str = Field(max_length=10000)
    constraints: str = Field(max_length=10000)
    suffix: str = Field(max_length=10000)


class UpdatePromptResponse(BaseModel):
    message: str