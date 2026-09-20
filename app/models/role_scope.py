import uuid
from typing import TYPE_CHECKING

from advanced_alchemy.extensions.litestar import base
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.role import RoleModel


class RoleScopeModel(base.DefaultBase):
    """A single scope string belonging to a role."""

    __tablename__ = "role_scopes"

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    scope_str: Mapped[str] = mapped_column(Text, primary_key=True)

    role: Mapped["RoleModel"] = relationship(back_populates="scopes")
