import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

# Default migration to run if no argument provided
migration_file = "migrations/005_fix_schema_mismatches.sql"
if len(sys.argv) > 1:
    migration_file = sys.argv[1]

if not os.path.exists(migration_file):
    # Try looking in migrations/ directory if not found directly
    alt_path = os.path.join("migrations", migration_file)
    if os.path.exists(alt_path):
        migration_file = alt_path
    else:
        print(f"Error: Migration file '{migration_file}' not found.")
        sys.exit(1)

print(f"Connecting to database...")
print(f"Executing migration: {migration_file}")

engine = create_engine(DATABASE_URL)

try:
    with engine.begin() as conn:
        with open(migration_file, "r", encoding="utf-8") as file:
            sql_script = file.read()
            # Split by semicolon to execute one by one if preferred, 
            # but for Postgres, a single script within a transaction block is usually fine.
            # However, some statements like DO blocks or CREATE TYPE cannot be in a multi-statement execute in some drivers.
            # psycopg2 usually handles it fine via text().
            conn.execute(text(sql_script))
    print("Migration executed successfully!")
except Exception as e:
    print(f"Migration Failed: {e}")
    sys.exit(1)
