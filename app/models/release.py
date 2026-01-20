"""
Release Database Models
"""
# pylint: disable=too-few-public-methods
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class ReleaseServiceLinkModel(Base):
    """
    Association table/model for Release <-> Service.
    """
    __tablename__ = "release_services_link"

    release_id = Column(UUID(as_uuid=True), ForeignKey("releases.id"), primary_key=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), primary_key=True)
    pipeline_link = Column(String(512), nullable=True)
    version = Column(String(50), nullable=True)

    # Relationships
    service = relationship("ServiceModel")
    # release is back-referenced from ReleaseModel


class ReleaseModel(Base):
    """
    Release database model.
    """
    __tablename__ = "releases"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        nullable=False,
    )
    name = Column(String(255), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    # pipeline_link removed, now per-service
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    planned_release_date = Column(DateTime, nullable=True)

    # User Roles
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    product_owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    qa_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    security_analyst_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Establish relationship to ReleaseServiceLinkModel
    service_links = relationship(
        "ReleaseServiceLinkModel",
        backref="release",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Establish relationship to Deployments
    deployments = relationship("DeploymentModel", back_populates="release")

    # User Relationships
    owner = relationship("UserModel", foreign_keys=[owner_id])
    product_owner = relationship("UserModel", foreign_keys=[product_owner_id])
    qa = relationship("UserModel", foreign_keys=[qa_id])
    security_analyst = relationship("UserModel", foreign_keys=[security_analyst_id])


class DeploymentModel(Base):
    """
    Deployment database model.
    """
    __tablename__ = "deployments"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        nullable=False,
    )
    release_id = Column(UUID(as_uuid=True), ForeignKey("releases.id"), nullable=False)
    environment_id = Column(UUID(as_uuid=True), ForeignKey("environments.id"), nullable=False)
    # Nullable for release-level deployments
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True)
    deployed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="success", nullable=False) # success, failed, existing, etc.

    release = relationship("ReleaseModel", back_populates="deployments")
    environment = relationship("EnvironmentModel")
    service = relationship("ServiceModel")
