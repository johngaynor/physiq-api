import datetime
import uuid

from advanced_alchemy.extensions.litestar import base
from advanced_alchemy.types import DateTimeUTC
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class UserRoleModel(base.DefaultBase):
    """Assignment of a role to a user."""

    __tablename__ = "user_roles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    granted_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
