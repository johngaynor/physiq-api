from app.models.check_in import CheckInModel
from app.repos.check_in import CheckInRepository
from litestar.exceptions import NotFoundException


class CheckInService:
    def __init__(self) -> None:
        self._repo = CheckInRepository()

    async def get_all(self) -> CheckInModel:
        check_ins = await self._repo.list_all()
        if len(check_ins) == 0:
            raise NotFoundException(detail="No check-ins found")

        return check_ins
