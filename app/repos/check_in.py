import datetime
import uuid
from typing import Any

from app.models.check_in import CheckInModel, utcnow
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class CheckInRepository:
    def __init__(self, db_session: AsyncSession) -> None:
        self._session = db_session

    async def list(
        self,
        user_id: uuid.UUID,
        start: datetime.datetime,
        end: datetime.datetime,
    ) -> list[CheckInModel]:
        stmt = (
            select(CheckInModel)
            .where(
                CheckInModel.user_id == user_id,
                CheckInModel.checked_in_at >= start,
                CheckInModel.checked_in_at < end,
            )
            .order_by(CheckInModel.checked_in_at.desc(), CheckInModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get(
        self, user_id: uuid.UUID, check_in_id: uuid.UUID
    ) -> CheckInModel | None:
        check_in = await self._session.get(CheckInModel, check_in_id)
        if check_in is None or check_in.user_id != user_id:
            return None
        return check_in

    async def create(
        self,
        user_id: uuid.UUID,
        *,
        checked_in_at: datetime.datetime,
        tz: str,
        comments_general: str | None = None,
        comments_training: str | None = None,
        comments_cheats: str | None = None,
    ) -> CheckInModel:
        now = utcnow()
        check_in = CheckInModel(
            user_id=user_id,
            checked_in_at=checked_in_at,
            tz=tz,
            comments_general=comments_general,
            comments_training=comments_training,
            comments_cheats=comments_cheats,
            created_at=now,
            updated_at=now,
        )
        self._session.add(check_in)
        await self._session.flush()
        return check_in

    async def update(
        self, user_id: uuid.UUID, check_in_id: uuid.UUID, fields: dict[str, Any]
    ) -> CheckInModel | None:
        check_in = await self.get(user_id, check_in_id)
        if check_in is None:
            return None
        for name, value in fields.items():
            setattr(check_in, name, value)
        await self._session.flush()
        return check_in

    async def delete(self, user_id: uuid.UUID, check_in_id: uuid.UUID) -> bool:
        check_in = await self.get(user_id, check_in_id)
        if check_in is None:
            return False
        await self._session.delete(check_in)
        await self._session.flush()
        return True
