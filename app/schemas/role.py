from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    name: str = Field(..., example="release_manager")
    description: str | None = Field(
        default=None,
        example="Responsible for managing and approving releases",
    )
    permissions: str | None = Field(
        default=None,
        example="read:releases,write:releases",
        description="Comma-separated list of permissions"
    )


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: str | None = Field(default=None)
    description: str | None = Field(default=None)


class Role(RoleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
