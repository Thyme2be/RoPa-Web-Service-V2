import sqlalchemy
from app.database import engine

def migrate():
    # List of ALL status values to ensure in the PostgreSQL Enum type
    # Adding both old lowercase and new UPPERCASE variants safely
    new_values = [
        "DRAFT",
        "PENDING_PROCESSOR",
        "PENDING_AUDITOR",
        "APPROVED",
        "REJECTED_PROCESSOR",
        "REJECTED_OWNER",
        "COMPLETED",
    ]

    try:
        with engine.execution_options(isolation_level="AUTOCOMMIT").connect() as conn:
            for val in new_values:
                conn.execute(sqlalchemy.text(
                    f"ALTER TYPE documentstatus ADD VALUE IF NOT EXISTS '{val}';"
                ))
                print(f"  ✓ Ensured: {val}")
        print("\nMigration complete!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
