from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    user: str
    password: str
    host: str
    port: str
    dbname: str
    
    # Secret key for JWT
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg2://{self.user}:{self.password}@{self.host}:{self.port}/{self.dbname}?sslmode=require"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
