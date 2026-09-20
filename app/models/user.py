from advanced_alchemy.extensions.litestar import base
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class UserModel(base.UUIDBase):
    __tablename__ = "users"

    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    api_key_hash: Mapped[str | None] = mapped_column(
        String(64), unique=True, nullable=True, index=True
    )
