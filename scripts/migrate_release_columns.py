"""
Migration script to add columns to releases table.
"""
# pylint: disable=wrong-import-position
import sys
import os

from sqlalchemy import text

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def migrate():
    """Run migration."""
    with engine.connect() as conn:
        with conn.begin():
            print("Migrating releases table...")

            # Add planned_release_date
            try:
                conn.execute(text(
                    "ALTER TABLE releases ADD COLUMN planned_release_date TIMESTAMP;"
                ))
                print("Added planned_release_date column.")
            except Exception as e: # pylint: disable=broad-exception-caught
                print(f"Skipping planned_release_date (likely already exists): {e}")

            # Add owner_id
            try:
                conn.execute(text(
                    "ALTER TABLE releases ADD COLUMN owner_id UUID REFERENCES users(id);"
                ))
                print("Added owner_id column.")
            except Exception as e: # pylint: disable=broad-exception-caught
                print(f"Skipping owner_id: {e}")

            # Add product_owner_id
            try:
                conn.execute(text(
                    "ALTER TABLE releases "
                    "ADD COLUMN product_owner_id UUID REFERENCES users(id);"
                ))
                print("Added product_owner_id column.")
            except Exception as e: # pylint: disable=broad-exception-caught
                print(f"Skipping product_owner_id: {e}")

            # Add qa_id
            try:
                conn.execute(text(
                    "ALTER TABLE releases ADD COLUMN qa_id UUID REFERENCES users(id);"
                ))
                print("Added qa_id column.")
            except Exception as e: # pylint: disable=broad-exception-caught
                print(f"Skipping qa_id: {e}")

            # Add security_analyst_id
            try:
                conn.execute(text(
                    "ALTER TABLE releases "
                    "ADD COLUMN security_analyst_id UUID REFERENCES users(id);"
                ))
                print("Added security_analyst_id column.")
            except Exception as e: # pylint: disable=broad-exception-caught
                print(f"Skipping security_analyst_id: {e}")

            print("Migration complete.")

if __name__ == "__main__":
    migrate()
