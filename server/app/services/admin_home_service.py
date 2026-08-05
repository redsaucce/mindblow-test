from datetime import datetime, timedelta, timezone

from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quiz_data import Quiz, QuizType
from app.models.user_data import User

QUIZ_TYPE_LABELS = {
    QuizType.MULTIPLE_CHOICE: "Multiple Choice",
    QuizType.TRUE_FALSE: "True or False",
    QuizType.IDENTIFICATION: "Identification",
}


def _month_bounds(reference: datetime) -> tuple[datetime, datetime, datetime, datetime]:
    """Returns (this_month_start, this_month_end, last_month_start, last_month_end), all UTC."""
    this_month_start = reference.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month_start = this_month_start + relativedelta(months=1)
    last_month_start = this_month_start - relativedelta(months=1)
    return this_month_start, next_month_start, last_month_start, this_month_start


async def _stat_pair(db: AsyncSession, model, date_column) -> dict[str, int | None]:
    """Cumulative all-time count (current) vs. the cumulative count as of
    the start of this month (previous) — i.e. "total users right now" vs.
    "total users at the end of last month," not "users created this month."
    The stat cards (e.g. "TOTAL USERS") are meant to show running totals,
    so `current` must include every row ever created, not just this
    month's."""
    now = datetime.now(timezone.utc)
    this_start, _, _, _ = _month_bounds(now)

    total_result = await db.execute(select(func.count()).select_from(model))
    current = total_result.scalar_one()

    previous_result = await db.execute(
        select(func.count()).select_from(model).where(date_column < this_start)
    )
    previous_total = previous_result.scalar_one()

    # No rows existed before this month → nothing meaningful to compare
    # against yet (the frontend also treats previous=0 as "no trend").
    previous = previous_total if previous_total > 0 else None
    return {"current": current, "previous": previous}


async def _avg_in_range(db: AsyncSession, start: datetime, end: datetime) -> float | None:
    result = await db.execute(
        select(func.avg(Quiz.question_count)).where(
            Quiz.created_at >= start, Quiz.created_at < end
        )
    )
    avg = result.scalar_one()
    return float(avg) if avg is not None else None


async def _avg_questions_per_quiz(db: AsyncSession) -> dict[str, int | None]:
    """Average question_count across quizzes, current month vs last month.

    Rounded to the nearest whole question for display — a "12.4 questions"
    stat card reads oddly, and the underlying value is a count of discrete
    items anyway. Rounding happens here rather than on the frontend so the
    trend math and the displayed value use the same rounded figure.
    """
    now = datetime.now(timezone.utc)
    this_start, this_end, last_start, last_end = _month_bounds(now)

    current_avg = await _avg_in_range(db, this_start, this_end)
    previous_avg = await _avg_in_range(db, last_start, last_end)

    current = round(current_avg) if current_avg is not None else 0
    previous = round(previous_avg) if previous_avg is not None else None
    return {"current": current, "previous": previous}


async def _line_chart(db: AsyncSession, granularity: str = "day") -> list[dict]:
    """Buckets Quiz.created_at into a chart series, windowed per granularity:
      - day:   rolling last 14 days, bucketed by day
      - week:  rolling last 8 weeks, bucketed by week
      - month: rolling last 12 months, bucketed by month (default)
      - year:  all-time, from the earliest quiz to now, bucketed by year

    Rolling windows (day/week/month) keep the chart readable regardless of
    what day/week/month it currently is, rather than e.g. only showing
    partial data for "weeks so far this calendar month."
    """
    now = datetime.now(timezone.utc)

    trunc_unit, window_start, date_format = {
        "day": ("day", now - timedelta(days=14), "%b %d"),
        "week": ("week", now - timedelta(weeks=8), "%b %d"),
        "month": ("month", now - relativedelta(months=12), "%b %Y"),
        "year": ("year", None, "%Y"),
    }.get(granularity, ("month", now - relativedelta(months=12), "%b %Y"))

    bucket = func.date_trunc(trunc_unit, Quiz.created_at)
    query = select(bucket.label("bucket"), func.count().label("quizzes"))

    if window_start is not None:
        query = query.where(Quiz.created_at >= window_start)

    query = query.group_by(bucket).order_by(bucket)

    result = await db.execute(query)
    return [
        {"month": row.bucket.strftime(date_format), "quizzes": row.quizzes}
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


async def get_stats(db: AsyncSession, granularity: str = "day") -> dict:
    total_users = await _stat_pair(db, User, User.created_at)
    quizzes_generated = await _stat_pair(db, Quiz, Quiz.created_at)
    avg_questions_per_quiz = await _avg_questions_per_quiz(db)

    return {
        "totalUsers": total_users,
        "quizzesGenerated": quizzes_generated,
        "avgQuestionsPerQuiz": avg_questions_per_quiz,
        "lineChart": await _line_chart(db, granularity=granularity),
        "donutChart": await _donut_chart(db),
    }