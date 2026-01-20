"""
Environment Pydantic Schemas
"""
# pylint: disable=too-few-public-methods
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class EnvironmentBase(BaseModel):
    """Base Environment Schema."""
    name: str = Field(..., example="prod")
    description: str | None = Field(
        default=None,
        example="Production environment",
    )


class EnvironmentCreate(EnvironmentBase):
    """Schema for creating an Environment."""


class EnvironmentUpdate(BaseModel):
    """Schema for updating an Environment."""
    name: str | None = Field(default=None, example="staging")
    description: str | None = Field(default=None, example="Updated description")


class Environment(EnvironmentBase):
    """Environment response schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True
