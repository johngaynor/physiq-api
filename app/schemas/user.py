import uuid

import msgspec
from app.models.role import RoleModel
from app.models.user import UserModel
from app.schemas.role import RoleRead


class UserSummary(msgspec.Struct):
    """A user as shown in listings, with the names of their roles."""

    id: uuid.UUID
    first_name: str | None
    last_name: str | None
    email: str | None
    roles: list[str]

    @classmethod
    def from_model(cls, user: UserModel, roles: list[RoleModel]) -> "UserSummary":
        return cls(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            roles=[r.name for r in roles],
        )


class UserDetail(msgspec.Struct):
    """A user with their full roles and the distinct scopes those roles grant."""

    id: uuid.UUID
    first_name: str | None
    last_name: str | None
    email: str | None
    roles: list[RoleRead]
    scopes: list[str]

    @classmethod
    def from_model(cls, user: UserModel, roles: list[RoleModel]) -> "UserDetail":
        return cls(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            roles=[RoleRead.from_model(r) for r in roles],
            scopes=sorted({s.scope_str for r in roles for s in r.scopes}),
        )
