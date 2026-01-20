# app/api/v1/endpoints/user.py

from uuid import UUID
from typing import List, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import UserModel
from app.models.role import RoleModel
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.api.v1.endpoints.auth import get_current_admin_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


from app.api.v1.dependencies import check_permission

@router.get("/", response_model=List[UserRead], summary="List users")
def list_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(check_permission("read:users")),
) -> List[UserRead]:
    return db.query(UserModel).order_by(UserModel.email).all()


@router.post(
    "/",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create user (admin only)",
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_admin: Annotated[UserModel, Depends(get_current_admin_user)] = None,
) -> UserRead:
    # Ensure email is unique
    existing = (
        db.query(UserModel)
        .filter(UserModel.email == payload.email)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists.",
        )

    # If role_id provided, ensure role exists
    role_id = payload.role_id
    if role_id:
        role = db.query(RoleModel).filter(RoleModel.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role not found for given role_id.",
            )

    user = UserModel(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        role_id=payload.role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Get user by ID (admin only)",
)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Annotated[UserModel, Depends(get_current_admin_user)] = None,
) -> UserRead:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    summary="Update user (admin only)",
)
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: Annotated[UserModel, Depends(get_current_admin_user)] = None,
) -> UserRead:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    data = payload.model_dump(exclude_unset=True)

    # If email is changing, ensure uniqueness
    new_email = data.get("email")
    if new_email and new_email != user.email:
        existing = (
            db.query(UserModel)
            .filter(UserModel.email == new_email)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another user with this email already exists.",
            )

    # If role_id is changing, ensure target role exists
    if "role_id" in data and data["role_id"] is not None:
        role = (
            db.query(RoleModel)
            .filter(RoleModel.id == data["role_id"])
            .first()
        )
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role not found for given role_id.",
            )

    # Handle password separately
    new_password = data.pop("password", None)
    if new_password:
        user.hashed_password = get_password_hash(new_password)

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user (admin only)",
)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: Annotated[UserModel, Depends(get_current_admin_user)] = None,
) -> None:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Optional: prevent admin from deleting self
    if current_admin and current_admin.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user cannot delete themself.",
        )

    db.delete(user)
    db.commit()
    return None
