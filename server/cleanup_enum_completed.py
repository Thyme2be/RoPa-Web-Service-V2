import sqlalchemy
from app.database import engine

def cleanup():
    # Final list of values as defined in DocumentStatus Enum
    correct_values = [
        'DRAFT',
        'PENDING_PROCESSOR',
        'PENDING_AUDITOR',
        'APPROVED',
        'REJECTED_PROCESSOR',
        'REJECTED_OWNER',
        'COMPLETED'
    ]
    
    enum_name = "documentstatus"
    table_name = "ropa_documents"
    column_name = "status"

    print(f"Starting cleanup of enum '{enum_name}'...")
    
    try:
        with engine.execution_options(isolation_level="AUTOCOMMIT").connect() as conn:
            # 1. Update existing data to uppercase COMPLETED if it's currently lowercase
            print("  Step 1: Updating existing records to uppercase...")
            conn.execute(sqlalchemy.text(f"UPDATE {table_name} SET {column_name} = 'COMPLETED' WHERE {column_name}::text = 'completed';"))
            
            # 2. Rename the old type
            print("  Step 2: Renaming old type...")
            conn.execute(sqlalchemy.text(f"ALTER TYPE {enum_name} RENAME TO {enum_name}_old;"))
            
            # 3. Create the new type with correct values
            print("  Step 3: Creating new type with uppercase values...")
            values_str = ", ".join([f"'{v}'" for v in correct_values])
            conn.execute(sqlalchemy.text(f"CREATE TYPE {enum_name} AS ENUM ({values_str});"))
            
            # 4. Update the table column to use the new type
            print(f"  Step 4: Updating table {table_name} to use the new type...")
            conn.execute(sqlalchemy.text(f"ALTER TABLE {table_name} ALTER COLUMN {column_name} TYPE {enum_name} USING {column_name}::text::{enum_name};"))
            
            # 5. Drop the old type
            print("  Step 5: Dropping old type...")
            conn.execute(sqlalchemy.text(f"DROP TYPE {enum_name}_old;"))
            
            print("\nCleanup complete! Lowercase 'completed' has been removed.")

    except Exception as e:
        print(f"\nError during cleanup: {e}")
        print("Note: If the type rename failed, you might need to manually restore or check if other tables are using this type.")

if __name__ == "__main__":
    cleanup()
