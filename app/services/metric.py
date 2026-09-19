from app.models.metric import MetricModel
from app.repos.metric import MetricRepository
from litestar.exceptions import NotFoundException


class MetricService:
    def __init__(self) -> None:
        self._repo = MetricRepository()

    async def get_all(self) -> list[MetricModel]:
        metrics = await self._repo.list_all()
        if len(metrics) == 0:
            raise NotFoundException(detail="No metrics found")

        return metrics
