import uuid

from app.repos.role import RoleRepository
from app.repos.user import UserRepository
from app.schemas.user import AthleteSummary, UserDetail, UserSummary
from litestar.di import NamedDependency
from litestar.exceptions import NotFoundException, ValidationException
from sqlalchemy.ext.asyncio import AsyncSession


class UserService:
    def __init__(self, db_session: AsyncSession) -> None:
        self._repo = UserRepository(db_session)
        self._roles = RoleRepository(db_session)

    async def get_all(self) -> list[UserSummary]:
        users = await self._repo.get_all()
        return [
            UserSummary.from_model(u, await self._repo.list_roles(u.id)) for u in users
        ]

    async def get(self, user_id: uuid.UUID) -> UserDetail:
        user = await self._repo.get_by_id(user_id)
        if user is None:
            raise NotFoundException(detail=f"User {user_id} not found")
        return UserDetail.from_model(user, await self._repo.list_roles(user.id))

    async def assign_role(
        self, user_id: uuid.UUID, role_id: uuid.UUID, *, granted_by: uuid.UUID
    ) -> None:
        await self._ensure_user_and_role(user_id, role_id)
        await self._repo.assign_role(user_id, role_id, granted_by=granted_by)

    async def revoke_role(self, user_id: uuid.UUID, role_id: uuid.UUID) -> None:
        await self._ensure_user_and_role(user_id, role_id)
        if not await self._repo.revoke_role(user_id, role_id):
            raise NotFoundException(
                detail=f"User {user_id} does not hold role {role_id}"
            )

    async def list_athletes(self, user_id: uuid.UUID) -> list[AthleteSummary]:
        await self._ensure_user(user_id)
        athletes = await self._repo.list_athletes(user_id)
        return [AthleteSummary.from_model(a) for a in athletes]

    async def assign_athlete(
        self, user_id: uuid.UUID, athlete_id: uuid.UUID, *, created_by: uuid.UUID
    ) -> None:
        if user_id == athlete_id:
            raise ValidationException(detail="A user cannot be their own athlete")
        await self._ensure_user(user_id)
        await self._ensure_user(athlete_id)
        await self._repo.assign_athlete(user_id, athlete_id, created_by=created_by)

    async def revoke_athlete(self, user_id: uuid.UUID, athlete_id: uuid.UUID) -> None:
        await self._ensure_user(user_id)
        await self._ensure_user(athlete_id)
        if not await self._repo.revoke_athlete(user_id, athlete_id):
            raise NotFoundException(
                detail=f"User {user_id} does not coach user {athlete_id}"
            )

    async def _ensure_user(self, user_id: uuid.UUID) -> None:
        if await self._repo.get_by_id(user_id) is None:
            raise NotFoundException(detail=f"User {user_id} not found")

    async def _ensure_user_and_role(
        self, user_id: uuid.UUID, role_id: uuid.UUID
    ) -> None:
        await self._ensure_user(user_id)
        if await self._roles.get_by_id(role_id) is None:
            raise NotFoundException(detail=f"Role {role_id} not found")


async def provide_user_service(
    db_session: NamedDependency[AsyncSession],
) -> UserService:
    return UserService(db_session)
