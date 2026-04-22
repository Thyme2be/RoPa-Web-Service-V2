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
    # Use Upsert logic: Update password if user exists, otherwise create a new admin user
    cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", ("admin01@gmail.com", "ADMIN01"))
    user = cur.fetchone()
    
    if user:
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user[0]))
        print(f"Updated admin password for existing user: admin01@gmail.com")
    else:
        cur.execute(
            "INSERT INTO users (email, username, password_hash, role, status) VALUES (%s, %s, %s, %s, %s)",
            ("admin01@gmail.com", "ADMIN01", new_hash, "ADMIN", "ACTIVE")
        )
        print("Created new admin user: admin01@gmail.com")
    
    conn.commit()
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
