from app.models.metric import MetricModel


class MetricRepository:
    async def list_all(self) -> list[MetricModel]:
        return [
            MetricModel(
                user_id="test_user", date="2026-01-01", name="weight", value=180.5
            )
        ]
