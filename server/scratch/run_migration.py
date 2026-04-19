from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres.xkjxvapwsvoijftnllzz:RoPACN334FastAPI@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

def run_migration():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Adding preferred_title column to auditor_assignments...")
        conn.execute(text("ALTER TABLE auditor_assignments ADD COLUMN IF NOT EXISTS preferred_title VARCHAR;"))
        conn.commit()
        print("Successfully updated database schema.")

if __name__ == "__main__":
    run_migration()
