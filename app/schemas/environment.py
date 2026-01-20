# app/schemas/environment.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class EnvironmentBase(BaseModel):
    name: str = Field(..., example="prod")
    description: str | None = Field(
        default=None,
        example="Production environment",
    )


class EnvironmentCreate(EnvironmentBase):
    pass


class EnvironmentUpdate(BaseModel):
    name: str | None = Field(default=None, example="staging")
    description: str | None = Field(default=None, example="Updated description")


class Environment(EnvironmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
