import datetime
import uuid

from advanced_alchemy.extensions.litestar import base
from advanced_alchemy.types import DateTimeUTC
from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class UserAthleteModel(base.DefaultBase):
    """A coaching relationship: ``user_id`` (the coach) coaches ``athlete_id``."""

    __tablename__ = "user_athletes"
    __table_args__ = (CheckConstraint("user_id <> athlete_id", name="not_self"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    athlete_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
