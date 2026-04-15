import sqlalchemy
from app.database import engine

def check_enums():
    target_enums = ['documentstatus', 'processorstatus', 'auditstatus', 'auditortype']
    
    query = """
    SELECT t.typname, e.enumlabel 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname IN :enums 
    ORDER BY 1, 2
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(sqlalchemy.text(query), {"enums": tuple(target_enums)})
            print("Current Enum Values in Database:")
            print("-" * 40)
            for row in result:
                print(f"{row.typname}: {row.enumlabel}")
            print("-" * 40)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_enums()
