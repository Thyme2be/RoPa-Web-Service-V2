
import sqlite3
import os

db_path = 'server/ropa.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, first_name, last_name, company_name, role FROM users WHERE role = 'PROCESSOR';")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
    conn.close()
