from typing import TYPE_CHECKING

from advanced_alchemy.extensions.litestar import base
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.role_scope import RoleScopeModel


class RoleModel(base.UUIDBase):
    """A reusable, named set of scopes that can be assigned to many users."""

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    """Bumped whenever the role's scopes change, for use in cache keys."""

    scopes: Mapped[list["RoleScopeModel"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
