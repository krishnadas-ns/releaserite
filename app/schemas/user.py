"""
User Pydantic Schemas
"""
# pylint: disable=too-few-public-methods
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
# pylint: disable=wrong-import-position
from app.schemas.role import Role

class UserBase(BaseModel):
    """
    Base Model for User
    """
    email: EmailStr = Field(..., example="admin@example.com")
    full_name: Optional[str] = Field(default=None, example="Admin User")
    role_id: Optional[UUID] = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
    )


class UserCreate(UserBase):
    """
    Model for creating a user
    """
    password: str = Field(..., min_length=8, example="StrongPassword123!")


class UserRead(UserBase):
    """
    Model for reading user data
    """
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role: Optional[Role] = None

    class Config:
        """Config"""
        from_attributes = True

class UserUpdate(BaseModel):
    """
    Model for updating user data
    """
    email: Optional[EmailStr] = Field(default=None, example="new.email@example.com")
    full_name: Optional[str] = Field(default=None, example="Updated Name")
    role_id: Optional[UUID] = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
    )
    is_active: Optional[bool] = Field(default=None)
    password: Optional[str] = Field(
        default=None,
        min_length=8,
        example="NewStrongPassword123!",
    )
