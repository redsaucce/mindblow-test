import time
from collections import deque

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import GenerationRateLimitedError, IncompleteAnswersError, QuizNotFoundError
from app.models.activity_log import ActivityType
from app.models.quiz_data import Quiz, QuizFormat as ModelQuizFormat
from app.models.quiz_question import QuizQuestion
from app.services import ai_service, document_service, retrieval_service
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

    # Drop users whose recent generations have all expired, so the store doesn't grow forever.
    for uid in list(_per_user_timestamps):
        queue = _per_user_timestamps[uid]
        while queue and queue[0] < window_start:
            queue.popleft()
        if not queue:
            del _per_user_timestamps[uid]

    user_queue = _per_user_timestamps.setdefault(user_id, deque())

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
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.question_order)
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
        type=ActivityType.QUIZ_DELETED,
    )


async def generate_quiz(
    db: AsyncSession,
    user_id: str,
    user_email: str,
    files: list[UploadFile],
    quiz_type: str,
    question_count: int,
) -> Quiz:
    raw_text, file_names = await document_service.extract_text_from_files(files)
    cleaned_text = document_service.clean_extracted_text(raw_text)

    # Checked after the upload is read, so an invalid file doesn't use up a slot.
    _check_rate_limits(user_id)

    # Semantic deduplication: chunk the
    # cleaned text, embed each chunk, and collapse near-duplicates before
    # the full text is handed to the main generation prompt. This only
    # removes genuine repetition (restated/paraphrased content) — nothing
    # is selected out for "relevance," so the deduplicated text still
    # covers the whole document, same as today.
    raw_chunks = retrieval_service.chunk_text(cleaned_text)
    embedded_chunks = await retrieval_service.embed_chunks(raw_chunks)
    deduplicated_chunks = retrieval_service.deduplicate_chunks(embedded_chunks)
    deduplicated_text = "\n\n".join(chunk.text for chunk in deduplicated_chunks)

    prompt_context = await get_or_create_default(db)

    generated = await ai_service.generate_quiz(
        extracted_text=deduplicated_text,
        quiz_type=quiz_type,
        question_count=question_count,
        prompt_context=prompt_context,
    )

    title = generated.title.strip()
    if not title:
        title = ", ".join(name.rsplit(".", 1)[0] for name in file_names) or "Untitled Quiz"
    title = title[:50]

    quiz = Quiz(
        user_id=user_id,
        title=title,
        direction=generated.direction,
        question_count=question_count,
        quiz_type=ModelQuizFormat(getattr(quiz_type, "value", quiz_type)),
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
                question_order=q.number,
                question_type=q.type,
            )
        )

    await db.commit()
    await db.refresh(quiz)

    await log_action(
        db,
        email=user_email,
        description=(
            f'Generated quiz "{title}"'
            + (f" from {len(file_names)} files" if len(file_names) > 1 else "")
        ),
        type=ActivityType.GENERATED,
    )

    return quiz


SECTION_TYPES = ["multiple_choice", "true_false", "identification"]


def _normalise_identification(text: str) -> str:
    """Case-insensitive, with leading and trailing spaces removed and runs of spaces collapsed."""
    return " ".join(text.split()).lower()


def _is_correct(quiz_type: str, user_answer: str, correct_answer: str) -> bool:
    if quiz_type == "identification":
        return _normalise_identification(user_answer) == _normalise_identification(correct_answer)
    # Multiple choice and true/false answers are stored exactly as the options or "True"/"False".
    return user_answer.strip() == correct_answer.strip()


async def check_quiz_answers(
    db: AsyncSession, user_id: str, quiz_id: str, answers: list[tuple[int, str]]
) -> dict:
    """Grades the user's answers against the stored answer key. Every question must be answered."""
    quiz, questions = await get_quiz_with_questions(db, user_id, quiz_id)
    quiz_type = getattr(quiz.quiz_type, "value", quiz.quiz_type)

    given = {number: answer for number, answer in answers}
    for q in questions:
        if not given.get(q.question_order, "").strip():
            raise IncompleteAnswersError()

    results = []
    for q in questions:
        user_answer = given[q.question_order]
        # Each question is graded by its own type. Mixed quizzes need this; older quizzes
        # have no question type, so the quiz's type applies.
        q_type = q.question_type or quiz_type
        results.append(
            {
                "number": q.question_order,
                "type": q_type,
                "userAnswer": user_answer,
                "correctAnswer": q.correct_answer,
                "correct": _is_correct(q_type, user_answer, q.correct_answer),
            }
        )

    correct = sum(1 for r in results if r["correct"])
    total = len(results)

    sections = []
    for section_type in SECTION_TYPES:
        in_section = [r for r in results if r["type"] == section_type]
        if in_section:
            sections.append(
                {
                    "type": section_type,
                    "total": len(in_section),
                    "correct": sum(1 for r in in_section if r["correct"]),
                }
            )

    return {
        "total": total,
        "correct": correct,
        "percentage": round(correct * 100 / total) if total else 0,
        "results": results,
        "sections": sections,
    }