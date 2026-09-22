"""SQLAlchemy models.

Every ORM model must be imported here so it is registered with
advanced-alchemy's metadata registry before Alembic inspects it.
"""

from app.models.check_in import CheckInModel
from app.models.role import RoleModel
from app.models.role_scope import RoleScopeModel
from app.models.user import UserModel
from app.models.user_athlete import UserAthleteModel
from app.models.user_role import UserRoleModel

__all__ = (
    "CheckInModel",
    "RoleModel",
    "RoleScopeModel",
    "UserAthleteModel",
    "UserModel",
    "UserRoleModel",
)
