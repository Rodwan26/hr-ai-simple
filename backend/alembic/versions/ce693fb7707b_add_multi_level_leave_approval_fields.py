"""Add multi-level leave approval fields

Revision ID: ce693fb7707b
Revises: 8c0bdcb9d975
Create Date: 2026-02-08 22:07:26.140790

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce693fb7707b'
down_revision: Union[str, Sequence[str], None] = '8c0bdcb9d975'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.engine.reflection import Inspector

def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [c['name'] for c in inspector.get_columns('leave_requests')]
    
    if 'approval_level' not in columns:
        op.add_column('leave_requests', sa.Column('approval_level', sa.Integer(), default=1))
    if 'required_levels' not in columns:
        op.add_column('leave_requests', sa.Column('required_levels', sa.Integer(), default=1))
    if 'second_approver_id' not in columns:
        op.add_column('leave_requests', sa.Column('second_approver_id', sa.Integer(), nullable=True))
    if 'second_approved_at' not in columns:
        op.add_column('leave_requests', sa.Column('second_approved_at', sa.DateTime(timezone=True), nullable=True))
    
    with op.batch_alter_table('leave_requests', schema=None) as batch_op:
        batch_op.create_foreign_key('fk_leave_requests_second_approver', 'users', ['second_approver_id'], ['id'])




def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('leave_requests', schema=None) as batch_op:
        batch_op.drop_constraint('fk_leave_requests_second_approver', type_='foreignkey')
        batch_op.drop_column('second_approved_at')
        batch_op.drop_column('second_approver_id')
        batch_op.drop_column('required_levels')
        batch_op.drop_column('approval_level')


