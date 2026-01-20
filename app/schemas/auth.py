"""
Authentication Schemas
"""
# pylint: disable=too-few-public-methods
from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Token data schema."""
    sub: Optional[str] = None  # subject (email)
