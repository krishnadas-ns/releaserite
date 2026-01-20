"""
API Dependencies Module
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import UserModel

def check_permission(required_permission: str):
    """
    Dependency to check if the current user has the required permission.
    """
    def dependency(
        current_user: Annotated[UserModel, Depends(get_current_user)],
    ) -> UserModel:
        # Admin has all permissions
        if current_user.role and current_user.role.name == "admin":
            return current_user

        # Check specific permission
        user_permissions = []
        if current_user.role and current_user.role.permissions:
            user_permissions = [p.strip() for p in current_user.role.permissions.split(",")]

        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required: {required_permission}",
            )
        return current_user
    return dependency

# Helper for endpoints that just need any valid user but we might expand logic later
# For now, get_current_user is sufficient for authentication.
