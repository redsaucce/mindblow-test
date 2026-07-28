from fastapi import APIRouter, Depends, Form, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user_data import User
from app.schemas.quiz import DeleteQuizResponse, QuizListResponse, QuizResponse, QuizType
from app.services.document_export_service import export_quiz, export_quizzes_zip
from app.services.quiz_service import (
    delete_quiz,
    generate_quiz,
    get_quiz_with_questions,
    list_quizzes,
)

router = APIRouter()


@router.get("", response_model=QuizListResponse)
async def get_quizzes(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    quizzes = await list_quizzes(db, str(user.id))
    return QuizListResponse(
        quizzes=[
            QuizResponse(
                id=str(q.id),
                title=q.title,
                questionCount=q.question_count,
                quizType=q.quiz_type,
                createdAt=q.created_at,
            )
            for q in quizzes
        ]
    )


@router.post("", response_model=QuizResponse)
async def create_quiz(
    file: UploadFile,
    quizType: QuizType = Form(...),
    questionCount: int = Form(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quiz = await generate_quiz(
        db,
        user_id=str(user.id),
        user_email=user.email,
        file=file,
        quiz_type=quizType,
        question_count=questionCount,
    )
    return QuizResponse(
        id=str(quiz.id),
        title=quiz.title,
        questionCount=quiz.question_count,
        quizType=quiz.quiz_type,
        createdAt=quiz.created_at,
        direction=quiz.direction,
    )


@router.get("/download")
async def download_quizzes(
    ids: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quiz_ids = ids.split(",")

    if len(quiz_ids) == 1:
        quiz, questions = await get_quiz_with_questions(db, str(user.id), quiz_ids[0])
        docx_bytes = export_quiz(quiz, questions)
        return StreamingResponse(
            iter([docx_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{quiz.title}.docx"'},
        )

    quizzes_with_questions = [
        await get_quiz_with_questions(db, str(user.id), qid) for qid in quiz_ids
    ]
    zip_bytes, failed_titles = export_quizzes_zip(quizzes_with_questions)

    headers = {"Content-Disposition": 'attachment; filename="quizzes.zip"'}
    if failed_titles:
        headers["X-Failed-Titles"] = ",".join(failed_titles)
        headers["Access-Control-Expose-Headers"] = "X-Failed-Titles"

    return StreamingResponse(
        iter([zip_bytes]),
        media_type="application/zip",
        headers=headers,
    )

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_by_id(
    quiz_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quiz, questions = await get_quiz_with_questions(db, str(user.id), quiz_id)
    return QuizResponse(
        id=str(quiz.id),
        title=quiz.title,
        questionCount=quiz.question_count,
        quizType=quiz.quiz_type,
        createdAt=quiz.created_at,
        direction=quiz.direction,
        questions=[
            {
                "number": q.order,
                "text": q.question_text,
                "type": quiz.quiz_type,
                "options": q.options,
                "answer": q.correct_answer,
            }
            for q in questions
        ],
    )


@router.delete("/{quiz_id}", response_model=DeleteQuizResponse)
async def delete_quiz_by_id(
    quiz_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_quiz(db, str(user.id), user.email, quiz_id)
    return DeleteQuizResponse(message="Quiz deleted.")