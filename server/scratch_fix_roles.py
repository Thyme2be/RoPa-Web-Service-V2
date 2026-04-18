import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    print("Connected to DB")
    
    cur.execute("ALTER TABLE mst_roles DROP COLUMN IF EXISTS code;")
    conn.commit()
    print("Dropped column code from mst_roles")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
