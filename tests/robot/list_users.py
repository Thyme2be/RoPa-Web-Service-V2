import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("d:/RoPa-Web-Service-V2/server/.env")
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cur = conn.cursor()
try:
    cur.execute("SELECT id, email, username, role, status FROM users;")
    rows = cur.fetchall()
    for row in rows:
        print(row)
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
