from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog


async def log_action(db: AsyncSession, email: str, description: str, type: str) -> None:
    entry = ActivityLog(email=email, description=description, type=type)
    db.add(entry)
    await db.commit()


async def list_logs(
    db: AsyncSession, tab: str, page: int = 1, page_size: int = 20
) -> tuple[list[ActivityLog], int]:
    query = select(ActivityLog)
    count_query = select(func.count()).select_from(ActivityLog)

    if tab != "all":
        query = query.where(ActivityLog.type == tab)
        count_query = count_query.where(ActivityLog.type == tab)

    query = query.order_by(ActivityLog.timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    logs = list(result.scalars().all())

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    return logs, total