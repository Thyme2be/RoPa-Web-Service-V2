import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.xkjxvapwsvoijftnllzz:RoPACN334FastAPI@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("SELECT username, email, role FROM users WHERE role = 'ADMIN' LIMIT 5;"))
    for row in result:
        print(f"Username: {row[0]}, Email: {row[1]}, Role: {row[2]}")
