from datetime import datetime
from typing import Literal

from pydantic import BaseModel

QuizType = Literal["multiple_choice", "identification", "true_false"]


class QuestionResponse(BaseModel):
    number: int
    text: str
    type: QuizType
    options: list[str] | None = None
    answer: str


class QuizResponse(BaseModel):
    id: str
    title: str
    questionCount: int
    quizType: QuizType
    createdAt: datetime
    direction: str | None = None
    questions: list[QuestionResponse] | None = None


class QuizListResponse(BaseModel):
    quizzes: list[QuizResponse]


class DeleteQuizResponse(BaseModel):
    message: str