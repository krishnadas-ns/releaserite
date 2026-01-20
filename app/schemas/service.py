from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl

class ServiceBase(BaseModel):
    name: str = Field(..., example="Ingestion Service")
    description: str | None = Field(
        default=None,
        example="Handles data ingestion from external sources",
    )
    owner: str | None = Field(
        default=None,
        example="data-platform-team",
    )
    environment_id: UUID | None = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
        description="ID of the environment this service belongs to.",
    )
    status: str | None = Field(
        default="active",
        example="active",
    )
    repo_link: HttpUrl | None = Field(
        default=None,
        example="https://gitlab.com/org/project",
        description="Link to the repo for this service.",
    )

class ServiceCreate(ServiceBase):
    """Fields required when creating a new service."""
    # Usually you don't allow client to send id / timestamps
    pass

class ServiceUpdate(BaseModel):
    """Fields allowed when updating an existing service."""
    name: str | None = Field(default=None, example="Updated service name")
    description: str | None = Field(default=None, example="Updated description")
    owner: str | None = Field(default=None, example="updated-owner")
    environment_id: UUID | None = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
    )
    status: str | None = Field(default=None, example="deprecated")
    repo_link: HttpUrl | None = Field(
        default=None,
        example="https://gitlab.com/org/project",
    )

class Service(ServiceBase):
    """Service representation returned from the API."""
    id: UUID = Field(..., example="3fa85f64-5717-4562-b3fc-2c963f66afa6")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # ORM -> Pydantic
