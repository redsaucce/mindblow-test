"""add revoked_tokens table and role enum

Revision ID: 5449c7571575
Revises: b040a4761472
Create Date: 2026-07-31 10:24:04.650749

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5449c7571575'
down_revision: Union[str, Sequence[str], None] = 'b040a4761472'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # create the Postgres enum type first
    user_role = postgresql.ENUM('user', 'admin', name='user_role')
    user_role.create(op.get_bind(), checkfirst=True)

    # cast existing VARCHAR values into the new enum type explicitly —
    # Postgres cannot do this implicitly
    op.execute(
        "ALTER TABLE users "
        "ALTER COLUMN role TYPE user_role "
        "USING role::user_role"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'users', 'role',
        type_=sa.VARCHAR(),
        postgresql_using='role::text',
    )
    postgresql.ENUM(name='user_role').drop(op.get_bind(), checkfirst=True)