import uuid

import msgspec
from app.models.role import RoleModel


class RoleRead(msgspec.Struct):
    """A role and the scope strings it grants."""

    id: uuid.UUID
    name: str
    description: str | None
    version: int
    scopes: list[str]

    @classmethod
    def from_model(cls, role: RoleModel) -> "RoleRead":
        return cls(
            id=role.id,
            name=role.name,
            description=role.description,
            version=role.version,
            scopes=sorted(s.scope_str for s in role.scopes),
        )
