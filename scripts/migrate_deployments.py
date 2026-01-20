"""
Migration script to add 'service_id' to `deployments` table.
"""
# pylint: disable=wrong-import-position
import sys
import os

# Add parent dir to path to find app module if needed,
# but for raw sql migration we just need connection.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Run migration."""
    print(f"Connecting to database: {settings.DATABASE_URL}...")
    engine = create_engine(str(settings.DATABASE_URL))

    with engine.connect() as conn:
        print("Checking if service_id column exists...")
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='deployments' AND column_name='service_id';"
        ))
        if result.rowcount > 0:
            print("Column service_id already exists. Skipping.")
            return

        print("Adding service_id column to deployments table...")

        # Add column
        conn.execute(text("ALTER TABLE deployments ADD COLUMN service_id UUID;"))

        # Add foreign key
        conn.execute(text(
            "ALTER TABLE deployments "
            "ADD CONSTRAINT fk_deployments_services "
            "FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL;"
        ))

        # Commit
        conn.commit()
        print("Migration successful: service_id column added.")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e: # pylint: disable=broad-exception-caught
        print(f"Migration failed: {e}")
        sys.exit(1)
