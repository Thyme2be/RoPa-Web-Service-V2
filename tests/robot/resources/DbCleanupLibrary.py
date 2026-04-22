import psycopg2
import os
from dotenv import load_dotenv

class DbCleanupLibrary:
    def __init__(self):
        load_dotenv(os.path.join(os.path.dirname(__file__), "../../../server/.env"))
        self.db_url = os.getenv("DATABASE_URL")

    def delete_user_by_email(self, email):
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM users WHERE email = %s", (email,))
            conn.commit()
            print(f"Deleted user with email: {email}")
        except Exception as e:
            print(f"Error deleting user: {e}")
            conn.rollback()
        finally:
            cur.close()
            conn.close()
