from app.models.check_in import CheckInModel


class CheckInRepository:
    async def list_all(self) -> list[CheckInModel]:
        return [
            CheckInModel(
                user_id="test_user", date="2026-01-01", comments="test comments"
            )
        ]
