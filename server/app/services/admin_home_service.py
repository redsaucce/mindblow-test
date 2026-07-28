from datetime import datetime, timezone

from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.newsletter_subscriber import NewsletterSubscriber
from app.models.quiz_data import Quiz
from app.models.user_data import User

QUIZ_TYPE_LABELS = {
    "multiple_choice": "Multiple Choice",
    "true_false": "True or False",
    "identification": "Identification",
}


def _month_bounds(reference: datetime) -> tuple[datetime, datetime, datetime, datetime]:
    """Returns (this_month_start, this_month_end, last_month_start, last_month_end), all UTC."""
    this_month_start = reference.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month_start = this_month_start + relativedelta(months=1)
    last_month_start = this_month_start - relativedelta(months=1)
    return this_month_start, next_month_start, last_month_start, this_month_start


async def _count_in_range(db: AsyncSession, model, start: datetime, end: datetime, date_column) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(model)
        .where(date_column >= start, date_column < end)
    )
    return result.scalar_one()


async def _stat_pair(db: AsyncSession, model, date_column) -> dict[str, int | None]:
    now = datetime.now(timezone.utc)
    this_start, this_end, last_start, last_end = _month_bounds(now)

    current = await _count_in_range(db, model, this_start, this_end, date_column)
    previous_count = await _count_in_range(db, model, last_start, last_end, date_column)

    total_result = await db.execute(select(func.count()).select_from(model))
    total_ever = total_result.scalar_one()
    has_history_before_this_month = total_ever > current

    previous = previous_count if has_history_before_this_month else None
    return {"current": current, "previous": previous}


async def _line_chart(db: AsyncSession) -> list[dict]:
    month_bucket = func.date_trunc("month", Quiz.created_at)
    result = await db.execute(
        select(
            month_bucket.label("month_bucket"),
            func.count().label("quizzes"),
        )
        .group_by(month_bucket)
        .order_by(month_bucket)
    )
    return [
        {"month": row.month_bucket.strftime("%b"), "quizzes": row.quizzes}
        for row in result.all()
    ]


async def _donut_chart(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Quiz.quiz_type, func.count().label("value")).group_by(Quiz.quiz_type)
    )
    return [
        {"name": QUIZ_TYPE_LABELS.get(row.quiz_type, row.quiz_type), "value": row.value}
        for row in result.all()
    ]


async def get_stats(db: AsyncSession) -> dict:
    total_users = await _stat_pair(db, User, User.created_at)
    quizzes_generated = await _stat_pair(db, Quiz, Quiz.created_at)
    newsletter_subscribers = await _stat_pair(db, NewsletterSubscriber, NewsletterSubscriber.subscribed_at)

    return {
        "totalUsers": total_users,
        "quizzesGenerated": quizzes_generated,
        "downloadedQuizzes": {"current": 0, "previous": None},
        "newsletterSubscribers": newsletter_subscribers,
        "lineChart": await _line_chart(db),
        "donutChart": await _donut_chart(db),
    }