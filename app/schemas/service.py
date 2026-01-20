"""
Service Pydantic Schemas
"""
# pylint: disable=too-few-public-methods
from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl

class ServiceBase(BaseModel):
    """
    Base service schema.
    """
    name: str = Field(..., example="Ingestion Service")
    description: Optional[str] = Field(
        default=None,
        example="Handles data ingestion from external sources",
    )
    owner: Optional[str] = Field(
        default=None,
        example="data-platform-team",
    )
    environment_id: Optional[UUID] = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
        description="ID of the environment this service belongs to.",
    )
    status: Optional[str] = Field(
        default="active",
        example="active",
    )
    repo_link: Optional[HttpUrl] = Field(
        default=None,
        example="https://gitlab.com/org/project",
        description="Link to the repo for this service.",
    )

class ServiceCreate(ServiceBase):
    """Fields required when creating a new service."""
    # Usually you don't allow client to send id / timestamps

class ServiceUpdate(BaseModel):
    """Fields allowed when updating an existing service."""
    name: Optional[str] = Field(default=None, example="Updated service name")
    description: Optional[str] = Field(default=None, example="Updated description")
    owner: Optional[str] = Field(default=None, example="updated-owner")
    environment_id: Optional[UUID] = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
    )
    status: Optional[str] = Field(default=None, example="deprecated")
    repo_link: Optional[HttpUrl] = Field(
        default=None,
        example="https://gitlab.com/org/project",
    )

class Service(ServiceBase):
    """Service representation returned from the API."""
    id: UUID = Field(..., example="3fa85f64-5717-4562-b3fc-2c963f66afa6")
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True  # ORM -> Pydantic
