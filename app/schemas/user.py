from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr = Field(..., example="admin@example.com")
    full_name: str | None = Field(default=None, example="Admin User")
    role_id: UUID | None = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
    )


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, example="StrongPassword123!")


from app.schemas.role import Role

class UserRead(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role: Role | None = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: EmailStr | None = Field(default=None, example="new.email@example.com")
    full_name: str | None = Field(default=None, example="Updated Name")
    role_id: UUID | None = Field(
        default=None,
        example="3fa85f64-5717-4562-b3fc-2c963f66afa6",
    )
    is_active: bool | None = Field(default=None)
    password: str | None = Field(
        default=None,
        min_length=8,
        example="NewStrongPassword123!",
    )