import psycopg2
import os
import bcrypt
from dotenv import load_dotenv

def truncate_pwd(pwd: str) -> str:
    pwd_bytes = pwd.encode('utf-8')
    if len(pwd_bytes) > 72:
        return pwd_bytes[:72].decode('utf-8', 'ignore')
    return pwd

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(
        truncate_pwd(password).encode('utf-8'),
        salt
    ).decode('utf-8')

load_dotenv("d:/RoPa-Web-Service-V2/server/.env")
db_url = os.getenv("DATABASE_URL")

new_password = "Admin@1234"
new_hash = get_password_hash(new_password)

conn = psycopg2.connect(db_url)
cur = conn.cursor()
try:
    cur.execute("UPDATE users SET password_hash = %s WHERE username = %s OR email = %s", (new_hash, "ADMIN01", "admin01@gmail.com"))
    conn.commit()
    print(f"Updated admin password to: {new_password}")
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
