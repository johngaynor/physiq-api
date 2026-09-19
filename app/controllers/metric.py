from typing import ClassVar

from app.models.metric import MetricModel
from app.services.metric import MetricService
from litestar import Controller, get
from litestar.di import Provide


class MetricController(Controller):
    dependencies: ClassVar[dict[str, Provide]] = {
        "metric_service": Provide(MetricService, sync_to_thread=False)
    }

    @get(path="/", summary="Get all metrics.")
    async def get_all(self, metric_service: MetricService) -> list[MetricModel]:
        return await metric_service.get_all()
