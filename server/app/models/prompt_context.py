import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PromptContext(Base):
    """Singleton table — exactly one row is ever expected to exist. Enforced
    via `singleton_key`, a column that always holds the same fixed value and
    is declared unique, so a second INSERT can never succeed at the database
    level, closing the race in prompt_service.get_or_create_default where two
    concurrent requests could otherwise both see no row and both insert one."""

    __tablename__ = "prompt_context"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    singleton_key: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, default=1)
    prefix: Mapped[str] = mapped_column(String, nullable=False, default="")
    objectives: Mapped[str] = mapped_column(String, nullable=False, default="")
    constraints: Mapped[str] = mapped_column(String, nullable=False, default="")
    suffix: Mapped[str] = mapped_column(String, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )