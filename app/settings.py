from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore", env_file=".env", env_file_decoding="utf-8"
    )

    api_key: str = Field(alias="API_KEY")


SETTINGS = Settings()
