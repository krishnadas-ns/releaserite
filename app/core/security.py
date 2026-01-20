"""
Security Utilities Module
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],   # ✨ no 72-byte limit
    deprecated="auto",
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generate a hash for a password.
    """
    return pwd_context.hash(password)

def create_access_token(
    subject: str,
    role: Optional[str] = None,
    permissions: Optional[str] = None,
    expires_delta: Union[timedelta, None] = None,
) -> str:
    """
    Create a JWT access token.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: dict[str, Any] = {"sub": subject}
    if role:
        to_encode["role"] = role
    if permissions:
        to_encode["permissions"] = permissions
    expire = datetime.now(tz=timezone.utc) + expires_delta
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode a JWT access token.
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )
    return payload

def truncate_password(password: str) -> str:
    """
    Truncate password (not used if using pbkdf2_sha256 which supports long passwords).
    """
    return password[:72]
