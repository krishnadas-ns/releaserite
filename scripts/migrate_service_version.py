"""
Migration script to add 'version' column to release_services_link table.
Run this script to update the database schema.
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'release_services_link' AND column_name = 'version'
        """))
        
        if result.fetchone():
            print("Column 'version' already exists in release_services_link table.")
            return
        
        # Add the version column
        print("Adding 'version' column to release_services_link table...")
        conn.execute(text("""
            ALTER TABLE release_services_link 
            ADD COLUMN version VARCHAR(50) NULL
        """))
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
