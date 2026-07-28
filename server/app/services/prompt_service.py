import nh3
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prompt_context import PromptContext


async def get_or_create_default(db: AsyncSession) -> PromptContext:
    result = await db.execute(select(PromptContext).limit(1))
    context = result.scalar_one_or_none()
    if context is None:
        context = PromptContext()
        db.add(context)
        await db.commit()
        await db.refresh(context)
    return context


async def update(
    db: AsyncSession, prefix: str, objectives: str, constraints: str, suffix: str
) -> PromptContext:
    context = await get_or_create_default(db)
    context.prefix = nh3.clean(prefix)
    context.objectives = nh3.clean(objectives)
    context.constraints = nh3.clean(constraints)
    context.suffix = nh3.clean(suffix)
    await db.commit()
    await db.refresh(context)
    return context