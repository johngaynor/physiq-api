import datetime
import uuid

from advanced_alchemy.extensions.litestar import base
from advanced_alchemy.types import DateTimeUTC
from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class CheckInModel(base.UUIDBase):
    """One athlete check-in at a point in time.

    ``checked_in_at`` is the athlete's stated instant and ``tz`` the IANA zone
    they were in, so the calendar day is recoverable. Nothing limits how many
    check-ins a user may have on one day.
    """

    __tablename__ = "check_ins"
    __table_args__ = (
        Index("ix_check_ins_user_id_checked_in_at", "user_id", "checked_in_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    checked_in_at: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True), nullable=False
    )
    tz: Mapped[str] = mapped_column(Text, nullable=False)
    comments_general: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments_training: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments_cheats: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTimeUTC(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
