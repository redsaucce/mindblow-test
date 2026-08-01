"""add relationships, enums, constraints, token hashing, singleton

Revision ID: 1bc69d631881
Revises: f277522211d3
Create Date: 2026-08-01 20:42:05.993913

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1bc69d631881'
down_revision: Union[str, Sequence[str], None] = 'f277522211d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # --- activity_log.type: VARCHAR -> enum, cast existing values ---
    op.execute("DELETE FROM activity_log WHERE type = 'announcement_sent'")
    # alter_column with type_=sa.Enum(...) does NOT create the Postgres enum
    # type for us — it assumes it already exists. Create it explicitly first.
    activity_type_enum = sa.Enum(
        'registered', 'signed_in', 'generated', 'downloaded', 'quiz_deleted', 'user_deleted',
        name='activity_type',
    )
    activity_type_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column(
        'activity_log', 'type',
        existing_type=sa.VARCHAR(),
        type_=activity_type_enum,
        existing_nullable=False,
        postgresql_using='type::activity_type',
    )

    # --- magic_link_tokens: Path B — wipe existing rows, then add NOT NULL columns ---
    # Existing magic link tokens are short-lived (a few minutes) and inherently
    # disposable — deleting them just means any in-flight, unclicked link
    # becomes invalid and the user has to request a new one. Nothing of
    # lasting value is lost.
    op.execute("DELETE FROM magic_link_tokens")
    op.add_column('magic_link_tokens', sa.Column('user_id', sa.UUID(), nullable=False))
    op.add_column('magic_link_tokens', sa.Column('token_hash', sa.String(), nullable=False))
    op.add_column('magic_link_tokens', sa.Column('created_at', sa.DateTime(timezone=True), nullable=False))
    op.drop_index(op.f('ix_magic_link_tokens_email'), table_name='magic_link_tokens')
    op.drop_index(op.f('ix_magic_link_tokens_token'), table_name='magic_link_tokens')
    op.create_index(op.f('ix_magic_link_tokens_token_hash'), 'magic_link_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_magic_link_tokens_user_id'), 'magic_link_tokens', ['user_id'], unique=False)
    op.create_foreign_key(None, 'magic_link_tokens', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.drop_column('magic_link_tokens', 'email')
    op.drop_column('magic_link_tokens', 'token')

    # --- prompt_context: singleton enforcement ---
    op.add_column('prompt_context', sa.Column('singleton_key', sa.Integer(), nullable=False, server_default='1'))
    op.create_unique_constraint(None, 'prompt_context', ['singleton_key'])
    # server_default only needed to satisfy NOT NULL on the existing singleton
    # row during this migration; the model's application-side default=1
    # covers all future inserts, so drop the server default afterward to
    # avoid a second, redundant source of truth.
    op.alter_column('prompt_context', 'singleton_key', server_default=None)

    # --- quiz_question: rename order -> question_order, backfill required (real quiz content) ---
    op.add_column('quiz_question', sa.Column('question_order', sa.Integer(), nullable=True))
    op.execute('UPDATE quiz_question SET question_order = "order"')
    op.alter_column('quiz_question', 'question_order', nullable=False)
    op.create_unique_constraint('uq_quiz_question_quiz_id_order', 'quiz_question', ['quiz_id', 'question_order'])
    op.create_check_constraint('ck_quiz_question_order_positive', 'quiz_question', 'question_order > 0')
    op.drop_column('quiz_question', 'order')

    # --- quizzes: VARCHAR -> enum, cast existing values, plus positivity check ---
    quiz_type_enum = sa.Enum(
        'multiple_choice', 'identification', 'true_false',
        name='quiz_type',
    )
    quiz_type_enum.create(op.get_bind(), checkfirst=True)
    op.alter_column(
        'quizzes', 'quiz_type',
        existing_type=sa.VARCHAR(),
        type_=quiz_type_enum,
        existing_nullable=False,
        postgresql_using='quiz_type::quiz_type',
    )
    op.create_check_constraint('ck_quizzes_question_count_positive', 'quizzes', 'question_count > 0')

    # --- refresh_tokens: Path B — wipe existing rows (forces re-login), then add NOT NULL column ---
    # Existing refresh tokens can't be un-reversed into a hash without the
    # plaintext being logged somewhere first, which defeats the point.
    # Wiping forces every active session to re-authenticate via magic link
    # on next refresh attempt — a one-time inconvenience, not a data loss.
    op.execute("DELETE FROM refresh_tokens")
    op.add_column('refresh_tokens', sa.Column('token_hash', sa.String(), nullable=False))
    op.drop_index(op.f('ix_refresh_tokens_token'), table_name='refresh_tokens')
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.drop_column('refresh_tokens', 'token')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('refresh_tokens', sa.Column('token', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.create_index(op.f('ix_refresh_tokens_token'), 'refresh_tokens', ['token'], unique=True)
    op.drop_column('refresh_tokens', 'token_hash')
    # NOTE: downgrade cannot restore wiped refresh_tokens/magic_link_tokens
    # rows or the original plaintext token values — Path B is a one-way trip
    # for that data. 'token' is left nullable=True here (unlike the original
    # autogenerate output) since there's nothing to backfill it with.

    op.drop_constraint('ck_quizzes_question_count_positive', 'quizzes', type_='check')
    quiz_type_enum = sa.Enum(
        'multiple_choice', 'identification', 'true_false',
        name='quiz_type',
    )
    op.alter_column(
        'quizzes', 'quiz_type',
        existing_type=quiz_type_enum,
        type_=sa.VARCHAR(),
        existing_nullable=False,
    )
    # Now that no column references it, drop the Postgres enum type itself.
    quiz_type_enum.drop(op.get_bind(), checkfirst=True)

    op.add_column('quiz_question', sa.Column('order', sa.INTEGER(), autoincrement=False, nullable=True))
    op.execute('UPDATE quiz_question SET "order" = question_order')
    op.alter_column('quiz_question', 'order', nullable=False)
    op.drop_constraint('ck_quiz_question_order_positive', 'quiz_question', type_='check')
    op.drop_constraint('uq_quiz_question_quiz_id_order', 'quiz_question', type_='unique')
    op.drop_column('quiz_question', 'question_order')

    op.drop_constraint(None, 'prompt_context', type_='unique')
    op.drop_column('prompt_context', 'singleton_key')

    op.add_column('magic_link_tokens', sa.Column('token', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('magic_link_tokens', sa.Column('email', sa.VARCHAR(), autoincrement=False, nullable=True))
    # NOTE: token/email cannot be backfilled here — the underlying rows were
    # deleted in upgrade() (Path B). Left nullable=True since there's no
    # source data to satisfy a NOT NULL constraint on downgrade.
    op.drop_constraint(None, 'magic_link_tokens', type_='foreignkey')
    op.drop_index(op.f('ix_magic_link_tokens_user_id'), table_name='magic_link_tokens')
    op.drop_index(op.f('ix_magic_link_tokens_token_hash'), table_name='magic_link_tokens')
    op.create_index(op.f('ix_magic_link_tokens_token'), 'magic_link_tokens', ['token'], unique=True)
    op.create_index(op.f('ix_magic_link_tokens_email'), 'magic_link_tokens', ['email'], unique=False)
    op.drop_column('magic_link_tokens', 'created_at')
    op.drop_column('magic_link_tokens', 'token_hash')
    op.drop_column('magic_link_tokens', 'user_id')

    activity_type_enum = sa.Enum(
        'registered', 'signed_in', 'generated', 'downloaded', 'quiz_deleted', 'user_deleted',
        name='activity_type',
    )
    op.alter_column(
        'activity_log', 'type',
        existing_type=activity_type_enum,
        type_=sa.VARCHAR(),
        existing_nullable=False,
    )
    # Now that no column references it, drop the Postgres enum type itself.
    activity_type_enum.drop(op.get_bind(), checkfirst=True)
