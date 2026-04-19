from sqlalchemy import create_engine, inspect
import os

DATABASE_URL = "postgresql://postgres.xkjxvapwsvoijftnllzz:RoPACN334FastAPI@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

columns = inspector.get_columns('auditor_assignments')
print("Columns in 'auditor_assignments':")
for column in columns:
    print(f"- {column['name']} ({column['type']})")
