from datetime import datetime
from typing import Literal

from pydantic import BaseModel

QuizType = Literal["multiple_choice", "identification", "true_false"]


class QuestionResponse(BaseModel):
    """A generated question, including its answer. Used only while generating."""

    number: int
    text: str
    type: QuizType
    options: list[str] | None = None
    answer: str


class QuestionPublic(BaseModel):
    """A question as shown to the user. The answer is never included; it's checked on the server."""

    number: int
    text: str
    type: QuizType
    options: list[str] | None = None


class QuizResponse(BaseModel):
    id: str
    title: str
    questionCount: int
    quizType: QuizType
    createdAt: datetime
    direction: str | None = None
    questions: list[QuestionPublic] | None = None


class QuizListResponse(BaseModel):
    quizzes: list[QuizResponse]


class DeleteQuizResponse(BaseModel):
    message: str


class CheckAnswer(BaseModel):
    number: int
    answer: str = ""


class CheckQuizRequest(BaseModel):
    answers: list[CheckAnswer]


class QuestionResult(BaseModel):
    number: int
    type: QuizType
    userAnswer: str
    correctAnswer: str
    correct: bool


class CheckQuizResponse(BaseModel):
    total: int
    correct: int
    percentage: int
    results: list[QuestionResult]