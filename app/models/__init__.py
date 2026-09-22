"""SQLAlchemy models.

Every ORM model must be imported here so it is registered with
advanced-alchemy's metadata registry before Alembic inspects it. Plain
dataclass stubs (check-ins, metrics) are intentionally left out.
"""

from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_athlete import UserAthleteModel
from app.models.user_role import UserRoleModel

__all__ = (
    "RoleModel",
    "RoleScopeModel",
    "UserAthleteModel",
    "UserModel",
    "UserRoleModel",
)
