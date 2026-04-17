import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

print(f"Connecting to database: {DATABASE_URL.split('@')[-1]}")

engine = create_engine(DATABASE_URL)

try:
    with engine.begin() as conn:
        with open("migrations/002_full_ropa_schema.sql", "r", encoding="utf-8") as file:
            print("Executing migration 002_full_ropa_schema.sql...")
            sql_script = file.read()
            conn.execute(text(sql_script))
    print("Migration executed successfully!")
except Exception as e:
    print(f"Migration Failed: {e}")
