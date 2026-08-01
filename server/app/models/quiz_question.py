import uuid

from sqlalchemy import CheckConstraint, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_question"
    __table_args__ = (
        UniqueConstraint("quiz_id", "question_order", name="uq_quiz_question_quiz_id_order"),
        CheckConstraint("question_order > 0", name="ck_quiz_question_order_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_text: Mapped[str] = mapped_column(String, nullable=False)
    options: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    correct_answer: Mapped[str] = mapped_column(String, nullable=False)
    # Renamed from `order` — a reserved SQL keyword that risked breaking any
    # raw SQL written against this table without careful quoting.
    question_order: Mapped[int] = mapped_column(Integer, nullable=False)