import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, String, Integer, DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class QuizType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    IDENTIFICATION = "identification"
    TRUE_FALSE = "true_false"


class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = (
        CheckConstraint("question_count > 0", name="ck_quizzes_question_count_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    direction: Mapped[str | None] = mapped_column(String, nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    quiz_type: Mapped[QuizType] = mapped_column(
        SAEnum(QuizType, name="quiz_type", values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )