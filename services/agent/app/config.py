from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    google_maps_api_key: str = ""
    supabase_url: str = ""
    supabase_key: str = ""
    work_dir: str = "/tmp/showcount-agent"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
