import datetime
import uuid

from app.repos.check_in import CheckInRepository
from app.schemas.check_in import CheckInCreate, CheckInRead, CheckInUpdate
from litestar.di import NamedDependency
from litestar.exceptions import NotFoundException
from sqlalchemy.ext.asyncio import AsyncSession

DEFAULT_WINDOW = datetime.timedelta(days=30)
"""How far back an unbounded list reaches."""

DEFAULT_LOOKAHEAD = datetime.timedelta(days=1)
"""How far past now it reaches, so an entry dated later today is not hidden."""


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class CheckInService:
    """Reads and writes the calling user's own check-ins."""

    def __init__(self, db_session: AsyncSession) -> None:
        self._repo = CheckInRepository(db_session)

    async def list(
        self,
        user_id: uuid.UUID,
        start: datetime.datetime | None = None,
        end: datetime.datetime | None = None,
    ) -> list[CheckInRead]:
        now = _now()
        check_ins = await self._repo.list(
            user_id, start or now - DEFAULT_WINDOW, end or now + DEFAULT_LOOKAHEAD
        )
        return [CheckInRead.from_model(c) for c in check_ins]

    async def get(self, user_id: uuid.UUID, check_in_id: uuid.UUID) -> CheckInRead:
        check_in = await self._repo.get(user_id, check_in_id)
        if check_in is None:
            raise NotFoundException(detail=f"Check-in {check_in_id} not found")
        return CheckInRead.from_model(check_in)

    async def create(self, user_id: uuid.UUID, request: CheckInCreate) -> CheckInRead:
        check_in = await self._repo.create(
            user_id,
            checked_in_at=request.checked_in_at,
            tz=request.tz,
            comments_general=request.comments_general,
            comments_training=request.comments_training,
            comments_cheats=request.comments_cheats,
        )
        return CheckInRead.from_model(check_in)

    async def update(
        self, user_id: uuid.UUID, check_in_id: uuid.UUID, request: CheckInUpdate
    ) -> CheckInRead:
        check_in = await self._repo.update(user_id, check_in_id, request.changes())
        if check_in is None:
            raise NotFoundException(detail=f"Check-in {check_in_id} not found")
        return CheckInRead.from_model(check_in)

    async def delete(self, user_id: uuid.UUID, check_in_id: uuid.UUID) -> None:
        if not await self._repo.delete(user_id, check_in_id):
            raise NotFoundException(detail=f"Check-in {check_in_id} not found")


async def provide_check_in_service(
    db_session: NamedDependency[AsyncSession],
) -> CheckInService:
    return CheckInService(db_session)
