from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore", env_file=".env", env_file_encoding="utf-8"
    )

    database_uri: str = Field(default="", alias="DATABASE_URI")
    """Full SQLAlchemy URL. When empty it is assembled from the DB_* fields."""

    db_host: str = Field(default="", alias="DB_HOST")
    db_port: str = Field(default="5432", alias="DB_PORT")
    db_name: str = Field(default="", alias="DB_NAME")
    db_user: str = Field(default="", alias="DB_USER")
    db_password: str = Field(default="", alias="DB_PASSWORD")

    @model_validator(mode="after")
    def build_database_uri(self) -> "Settings":
        if self.database_uri:
            return self
        if not all([self.db_host, self.db_name, self.db_user]):
            raise ValueError("DATABASE_URI or DB_HOST/DB_NAME/DB_USER must be set")
        if not self.db_password:
            raise ValueError("DB_PASSWORD must be set when DATABASE_URI is not")
        self.database_uri = (
            f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )
        return self


SETTINGS = Settings()
