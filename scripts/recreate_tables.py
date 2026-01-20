"""
Script to drop and recreate release-related tables.
"""
# pylint: disable=unused-import
import os
import sys

from sqlalchemy import delete
from app.core.database import Base, engine, SessionLocal
from app.models.release import ReleaseModel, DeploymentModel, ReleaseServiceLinkModel

def recreate_release_tables():
    """Drop and recreate release tables."""
    print("Dropping release-related tables...")
    # Order matters due to foreign keys
    DeploymentModel.__table__.drop(engine, checkfirst=True)
    ReleaseServiceLinkModel.__table__.drop(engine, checkfirst=True)
    # Also drop the old release_services_link table if it exists as a Table object in metadata
    # (It might not be in metadata anymore since we replaced it with a class,
    # so raw SQL might be safer if needed,
    # but let's try dropping the model table).
    # If the old table was named "release_services_link" and the new one is too, drop() will work.

    ReleaseModel.__table__.drop(engine, checkfirst=True)

    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    recreate_release_tables()
