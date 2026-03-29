from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "postgres"
    DATABASE_URL: str | None = None
    
    # Secret key for JWT
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    @property
    def SYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            # Ensure SQLAlchemy uses psycopg2 driver
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            # Add sslmode=require if not specifically set, as Supabase usually requires it
            if "sslmode=" not in url:
                sep = "&" if "?" in url else "?"
                url = f"{url}{sep}sslmode=require"
            return url
            
        return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?sslmode=require"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

