from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CannotDeleteSelfError, UserNotFoundError
from app.models.quiz_data import Quiz
from app.models.user_data import User


async def list_users(db: AsyncSession, page: int = 1, page_size: int = 20) -> tuple[list[dict], int]:
    query = (
        select(
            User.id,
            User.email,
            User.role,
            User.created_at,
            func.count(Quiz.id).label("generated_quizzes"),
        )
        .outerjoin(Quiz, Quiz.user_id == User.id)
        .group_by(User.id)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.all()

    total_result = await db.execute(select(func.count()).select_from(User))
    total = total_result.scalar_one()

    users = [
        {
            "id": str(row.id),
            "email": row.email,
            "role": row.role,
            "generatedQuizzes": row.generated_quizzes,
            "createdAt": row.created_at,
        }
        for row in rows
    ]
    return users, total


async def delete_user(db: AsyncSession, current_user_id: str, target_user_id: str, current_user_email: str) -> None:
    from app.services.activity_log_service import log_action

    if current_user_id == target_user_id:
        raise CannotDeleteSelfError()

    result = await db.execute(select(User).where(User.id == target_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError()

    deleted_email = user.email
    await db.delete(user)
    await db.commit()

    await log_action(
        db,
        email=current_user_email,
        description=f"Deleted user {deleted_email}",
        type="user_deleted",
    )