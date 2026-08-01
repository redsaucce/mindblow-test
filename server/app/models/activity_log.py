import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ActivityType(str, enum.Enum):
    REGISTERED = "registered"
    SIGNED_IN = "signed_in"
    GENERATED = "generated"
    DOWNLOADED = "downloaded"
    QUIZ_DELETED = "quiz_deleted"
    USER_DELETED = "user_deleted"


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[ActivityType] = mapped_column(
        SAEnum(ActivityType, name="activity_type", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
        index=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )