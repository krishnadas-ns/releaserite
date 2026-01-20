"""
Role Pydantic Schemas
"""
# pylint: disable=too-few-public-methods
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    """Base Role Schema."""
    name: str = Field(..., example="release_manager")
    description: Optional[str] = Field(
        default=None,
        example="Responsible for managing and approving releases",
    )
    permissions: Optional[str] = Field(
        default=None,
        example="read:releases,write:releases",
        description="Comma-separated list of permissions"
    )


class RoleCreate(RoleBase):
    """Schema for creating a Role."""


class RoleUpdate(BaseModel):
    """Schema for updating a Role."""
    name: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)


class Role(RoleBase):
    """Role response schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True
