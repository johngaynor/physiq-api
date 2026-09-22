import datetime
import uuid
import zoneinfo
from typing import Annotated, Any

import msgspec
from app.models.check_in import CheckInModel
from msgspec import UNSET, UnsetType

AwareDatetime = Annotated[datetime.datetime, msgspec.Meta(tz=True)]
"""A datetime that must carry an offset; a naive value is rejected at decode."""


def validate_tz(value: str) -> str:
    """Return ``value`` if it names a zone in the system tz database."""
    try:
        zoneinfo.ZoneInfo(value)
    except (zoneinfo.ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError(f"Unknown time zone {value!r}") from exc
    return value


class CheckInRead(msgspec.Struct):
    """A check-in as returned to clients.

    ``local_date`` is derived, not stored: ``checked_in_at`` rendered in ``tz``.
    It is what a client groups by to draw a day.
    """

    id: uuid.UUID
    user_id: uuid.UUID
    checked_in_at: datetime.datetime
    tz: str
    local_date: datetime.date
    comments_general: str | None
    comments_training: str | None
    comments_cheats: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    @classmethod
    def from_model(cls, check_in: CheckInModel) -> "CheckInRead":
        local = check_in.checked_in_at.astimezone(zoneinfo.ZoneInfo(check_in.tz))
        return cls(
            id=check_in.id,
            user_id=check_in.user_id,
            checked_in_at=check_in.checked_in_at,
            tz=check_in.tz,
            local_date=local.date(),
            comments_general=check_in.comments_general,
            comments_training=check_in.comments_training,
            comments_cheats=check_in.comments_cheats,
            created_at=check_in.created_at,
            updated_at=check_in.updated_at,
        )


class CheckInCreate(msgspec.Struct):
    """Body for ``POST /athlete/check-ins``."""

    checked_in_at: AwareDatetime
    tz: str
    comments_general: str | None = None
    comments_training: str | None = None
    comments_cheats: str | None = None

    def __post_init__(self) -> None:
        validate_tz(self.tz)


class CheckInUpdate(msgspec.Struct):
    """Body for ``PATCH /athlete/check-ins/{id}``.

    A field left out is untouched; an explicit ``null`` clears a comment.
    """

    checked_in_at: AwareDatetime | UnsetType = UNSET
    tz: str | UnsetType = UNSET
    comments_general: str | None | UnsetType = UNSET
    comments_training: str | None | UnsetType = UNSET
    comments_cheats: str | None | UnsetType = UNSET

    def __post_init__(self) -> None:
        if self.tz is not UNSET:
            validate_tz(self.tz)

    def changes(self) -> dict[str, Any]:
        """The fields that were present in the request, by column name."""
        return {
            name: value
            for name in self.__struct_fields__
            if (value := getattr(self, name)) is not UNSET
        }
