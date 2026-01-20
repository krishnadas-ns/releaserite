"""
Service Database Model
"""
# pylint: disable=too-few-public-methods
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class ServiceModel(Base):
    """
    Service database model.
    """
    __tablename__ = "services"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,  # application-generated
        nullable=False,
    )
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner = Column(String(255), nullable=True)          # e.g. "data-platform-team"
    status = Column(String(50), nullable=True)
    repo_link = Column(String(512), nullable=True)
    environment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("environments.id"),
        nullable=True,
        index=True,
    )

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    environment = relationship("EnvironmentModel", back_populates="services")
