"""
Release Pydantic Schemas
"""
# pylint: disable=too-few-public-methods
from datetime import datetime
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from app.schemas.service import Service

# Deployment Schemas
class DeploymentBase(BaseModel):
    """Base Deployment Schema."""
    environment_id: UUID
    status: str = Field(default="pending", example="success")

class DeploymentCreate(BaseModel):
    """Schema for creating a deployment."""
    environment_id: UUID
    service_id: Optional[UUID] = None
    status: str = "success"

class Deployment(BaseModel):
    """Deployment response schema."""
    id: UUID
    release_id: UUID
    environment_id: UUID
    service_id: Optional[UUID] = None
    status: str
    deployed_at: datetime

    class Config:
        """Pydantic Config."""
        from_attributes = True

# Release Schemas

class ReleaseServiceLinkCreate(BaseModel):
    """Schema for linking a service to a release."""
    service_id: UUID
    pipeline_link: Optional[str] = None
    version: Optional[str] = None

class ReleaseServiceLink(BaseModel):
    """Release-Service link response schema."""
    service_id: UUID
    pipeline_link: Optional[str] = None
    version: Optional[str] = None
    service: Service

    class Config:
        """Pydantic Config."""
        from_attributes = True

# User Summary Schema for embedding
class UserSummary(BaseModel):
    """Summary of user info."""
    id: UUID
    email: str
    full_name: Optional[str] = None

    class Config:
        """Pydantic Config."""
        from_attributes = True

class ReleaseBase(BaseModel):
    """Base Release Schema."""
    name: str = Field(..., example="Release-2024.01")
    version: str = Field(..., example="v1.0.0")
    planned_release_date: Optional[datetime] = None

class ReleaseCreate(ReleaseBase):
    """Schema for creating a Release."""
    services: List[ReleaseServiceLinkCreate] = Field(
        default=[],
        description="List of services with pipeline links"
    )
    product_owner_id: Optional[UUID] = None
    qa_id: Optional[UUID] = None
    security_analyst_id: Optional[UUID] = None

    @field_validator('planned_release_date')
    @classmethod
    def validate_future_date(cls, v):
        """Validate date is in future."""
        if v and v < datetime.now(v.tzinfo):
            raise ValueError('Planned release date must be in the future')
        return v

class ReleaseUpdate(BaseModel):
    """Schema for updating a Release."""
    name: Optional[str] = Field(default=None, example="Release-2024.01-Updated")
    version: Optional[str] = Field(default=None, example="v1.0.1")
    planned_release_date: Optional[datetime] = None

    @field_validator('planned_release_date')
    @classmethod
    def validate_future_date(cls, v):
        """Validate date is in future."""
        if v and v < datetime.now(v.tzinfo):
            raise ValueError('Planned release date must be in the future')
        return v

    product_owner_id: Optional[UUID] = None
    qa_id: Optional[UUID] = None
    security_analyst_id: Optional[UUID] = None
    services: Optional[List[ReleaseServiceLinkCreate]] = Field(
        default=None,
        description="List of services with pipeline links"
    )

class Release(ReleaseBase):
    """Release response schema."""
    id: UUID
    created_at: datetime
    owner_id: Optional[UUID] = None

    # Nested user details
    owner: Optional[UserSummary] = None
    product_owner: Optional[UserSummary] = None
    qa: Optional[UserSummary] = None
    security_analyst: Optional[UserSummary] = None

    service_links: List[ReleaseServiceLink] = []
    deployments: List[Deployment] = []

    class Config:
        """Pydantic Config."""
        from_attributes = True
