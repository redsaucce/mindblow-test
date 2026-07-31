from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin, verify_csrf
from app.models.user_data import User
from app.schemas.prompt import PromptFields, UpdatePromptRequest, UpdatePromptResponse
from app.services.prompt_service import get_or_create_default, update

router = APIRouter()


@router.get("", response_model=PromptFields)
async def get_prompt(
    admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    context = await get_or_create_default(db)
    return PromptFields(
        prefix=context.prefix,
        objectives=context.objectives,
        constraints=context.constraints,
        suffix=context.suffix,
    )


@router.put("", response_model=UpdatePromptResponse, dependencies=[Depends(verify_csrf)])
async def update_prompt(
    payload: UpdatePromptRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await update(db, payload.prefix, payload.objectives, payload.constraints, payload.suffix)
    return UpdatePromptResponse(message="Prompt saved.")