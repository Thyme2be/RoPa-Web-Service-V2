from app.database import engine, Base
from app.models.user import UserNotification

def main():
    try:
        # Create user_notifications table if it doesn't exist
        print("Creating user_notifications table...")
        UserNotification.__table__.create(engine, checkfirst=True)
        print("Success: user_notifications table created.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
