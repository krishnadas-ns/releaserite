# app/api/v1/endpoints/environment.py

from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.environment import EnvironmentModel
from app.models.service import ServiceModel  # used to protect deletes
from app.schemas.environment import (
    Environment,
    EnvironmentCreate,
    EnvironmentUpdate,
)

router = APIRouter(
    prefix="/environment",
    tags=["environment"],
)


@router.get("/", response_model=List[Environment], summary="List environments")
def list_environments(db: Session = Depends(get_db)) -> List[Environment]:
    return db.query(EnvironmentModel).order_by(EnvironmentModel.name).all()


@router.post(
    "/",
    response_model=Environment,
    status_code=status.HTTP_201_CREATED,
    summary="Create environment",
)
def create_environment(
    payload: EnvironmentCreate,
    db: Session = Depends(get_db),
) -> Environment:
    # Enforce unique name
    existing = (
        db.query(EnvironmentModel)
        .filter(EnvironmentModel.name == payload.name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Environment with this name already exists.",
        )

    env = EnvironmentModel(
        name=payload.name,
        description=payload.description,
    )
    db.add(env)
    db.commit()
    db.refresh(env)
    return env


@router.get(
    "/{environment_id}",
    response_model=Environment,
    summary="Get environment by ID",
)
def get_environment(
    environment_id: UUID,
    db: Session = Depends(get_db),
) -> Environment:
    env = (
        db.query(EnvironmentModel)
        .filter(EnvironmentModel.id == environment_id)
        .first()
    )
    if not env:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found.",
        )
    return env


@router.patch(
    "/{environment_id}",
    response_model=Environment,
    summary="Update environment",
)
def update_environment(
    environment_id: UUID,
    payload: EnvironmentUpdate,
    db: Session = Depends(get_db),
) -> Environment:
    env = (
        db.query(EnvironmentModel)
        .filter(EnvironmentModel.id == environment_id)
        .first()
    )
    if not env:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found.",
        )

    # If name is changing, keep uniqueness
    data = payload.model_dump(exclude_unset=True)
    new_name = data.get("name")
    if new_name and new_name != env.name:
        existing = (
            db.query(EnvironmentModel)
            .filter(EnvironmentModel.name == new_name)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another environment with this name already exists.",
            )

    for field, value in data.items():
        setattr(env, field, value)

    db.commit()
    db.refresh(env)
    return env


@router.delete(
    "/{environment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete environment",
)
def delete_environment(
    environment_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    env = (
        db.query(EnvironmentModel)
        .filter(EnvironmentModel.id == environment_id)
        .first()
    )
    if not env:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found.",
        )

    # Protect deletion if services still reference this environment
    attached_service = (
        db.query(ServiceModel)
        .filter(ServiceModel.environment_id == environment_id)
        .first()
    )
    if attached_service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Environment has attached services; reassign or remove them before deleting.",
        )

    db.delete(env)
    db.commit()
    return None
