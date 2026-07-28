import time
from collections import deque

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import GenerationRateLimitedError, QuizNotFoundError
from app.models.quiz_data import Quiz
from app.models.quiz_question import QuizQuestion
from app.schemas.quiz import QuizType
from app.services import ai_service, document_service
from app.services.activity_log_service import log_action
from app.services.prompt_service import get_or_create_default

APP_WIDE_LIMIT_PER_MINUTE = 5
PER_USER_LIMIT_PER_MINUTE = 2

_app_wide_timestamps: deque[float] = deque()
_per_user_timestamps: dict[str, deque[float]] = {}


def _check_rate_limits(user_id: str) -> None:
    now = time.monotonic()
    window_start = now - 60

    while _app_wide_timestamps and _app_wide_timestamps[0] < window_start:
        _app_wide_timestamps.popleft()

    user_queue = _per_user_timestamps.setdefault(user_id, deque())
    while user_queue and user_queue[0] < window_start:
        user_queue.popleft()

    if len(_app_wide_timestamps) >= APP_WIDE_LIMIT_PER_MINUTE:
        raise GenerationRateLimitedError()
    if len(user_queue) >= PER_USER_LIMIT_PER_MINUTE:
        raise GenerationRateLimitedError()

    _app_wide_timestamps.append(now)
    user_queue.append(now)


async def list_quizzes(db: AsyncSession, user_id: str) -> list[Quiz]:
    result = await db.execute(
        select(Quiz).where(Quiz.user_id == user_id).order_by(Quiz.created_at.desc())
    )
    return list(result.scalars().all())


async def get_quiz(db: AsyncSession, user_id: str, quiz_id: str) -> Quiz:
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user_id)
    )
    quiz = result.scalar_one_or_none()
    if quiz is None:
        raise QuizNotFoundError()
    return quiz


async def get_quiz_with_questions(
    db: AsyncSession, user_id: str, quiz_id: str
) -> tuple[Quiz, list[QuizQuestion]]:
    quiz = await get_quiz(db, user_id, quiz_id)
    result = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.order)
    )
    questions = list(result.scalars().all())
    return quiz, questions


async def delete_quiz(db: AsyncSession, user_id: str, user_email: str, quiz_id: str) -> None:
    quiz = await get_quiz(db, user_id, quiz_id)
    title = quiz.title

    await db.delete(quiz)
    await db.commit()

    await log_action(
        db,
        email=user_email,
        description=f'Deleted quiz "{title}"',
        type="quiz_deleted",
    )


async def generate_quiz(
    db: AsyncSession,
    user_id: str,
    user_email: str,
    file: UploadFile,
    quiz_type: QuizType,
    question_count: int,
) -> Quiz:
    _check_rate_limits(user_id)

    raw_text = await document_service.extract_text(file)
    cleaned_text = document_service.clean_extracted_text(raw_text)

    prompt_context = await get_or_create_default(db)

    generated = await ai_service.generate_quiz(
        extracted_text=cleaned_text,
        quiz_type=quiz_type,
        question_count=question_count,
        prompt_context=prompt_context,
    )

    title = generated.title.strip()
    if not title:
        filename = file.filename or "Untitled Quiz"
        title = filename.rsplit(".", 1)[0]
    title = title[:50]

    quiz = Quiz(
        user_id=user_id,
        title=title,
        direction=generated.direction,
        question_count=question_count,
        quiz_type=quiz_type,
    )
    db.add(quiz)
    await db.flush()

    for q in generated.questions:
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question_text=q.text,
                options=q.options,
                correct_answer=q.answer,
                order=q.number,
            )
        )

    await db.commit()
    await db.refresh(quiz)

    await log_action(
        db,
        email=user_email,
        description=f'Generated quiz "{title}"',
        type="generated",
    )

    return quiz