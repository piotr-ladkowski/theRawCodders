from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    convex_url: str
    openai_api_key: str
    cache_ttl_seconds: int = 300

    model_config = {"env_file": ".env.local", "extra": "ignore"}


settings = Settings()

