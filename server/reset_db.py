from sqlalchemy import text
from app.database import engine, Base
import app.models

def reset():
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
    
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully.")

if __name__ == "__main__":
    reset()
