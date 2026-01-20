"""
Script to drop and recreate release-related tables.
"""
# pylint: disable=wrong-import-position
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine
from app.models.release import ReleaseModel, DeploymentModel, ReleaseServiceLinkModel

def recreate_release_tables():
    """Drop and recreate release tables."""
    print("Dropping release-related tables...")
    # Order matters due to foreign keys
    DeploymentModel.__table__.drop(engine, checkfirst=True)
    ReleaseServiceLinkModel.__table__.drop(engine, checkfirst=True)
    ReleaseModel.__table__.drop(engine, checkfirst=True)

    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    recreate_release_tables()
