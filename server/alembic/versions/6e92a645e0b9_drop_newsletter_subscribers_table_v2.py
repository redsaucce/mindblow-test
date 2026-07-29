"""drop newsletter_subscribers table v2

Revision ID: 6e92a645e0b9
Revises: 3db7413635bc
Create Date: 2026-07-29 15:36:24.411674

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6e92a645e0b9'
down_revision: Union[str, Sequence[str], None] = '3db7413635bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('newsletter_subscribers')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        'newsletter_subscribers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('subscribed_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('email'),
    )
    op.create_index(op.f('ix_newsletter_subscribers_email'), 'newsletter_subscribers', ['email'], unique=False)