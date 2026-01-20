from uuid import UUID
from typing import List

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.schemas.service import Service, ServiceCreate, ServiceUpdate
from app.core.database import get_db
from app.models.service import ServiceModel

from app.models.user import UserModel
from app.api.v1.dependencies import check_permission

router = APIRouter(prefix="/service", tags=["service"])


@router.get("/", response_model=List[Service], summary="List services")
def list_services(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(check_permission("read:services"))
) -> List[Service]:
    rows = db.query(ServiceModel).all()
    return rows  # thanks to from_attributes=True, FastAPI converts ORM -> Pydantic


@router.post(
    "/",
    response_model=Service,
    status_code=status.HTTP_201_CREATED,
    summary="Create service",
)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(check_permission("create:services"))
) -> Service:
    row = ServiceModel(
        name=payload.name,
        description=payload.description,
        owner=payload.owner,
        environment_id=payload.environment_id,  # NEW FK field
        status=payload.status or "active",
        repo_link=str(payload.repo_link) if payload.repo_link else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{service_id}", response_model=Service, summary="Get service by ID")
def get_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(check_permission("read:services"))
) -> Service:
    row = (
        db.query(ServiceModel)
        .filter(ServiceModel.id == service_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Service not found")
    return row


@router.patch("/{service_id}", response_model=Service, summary="Update service")
def update_service(
    service_id: UUID,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(check_permission("create:services"))
) -> Service:
    row = (
        db.query(ServiceModel)
        .filter(ServiceModel.id == service_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Service not found")

    data = payload.model_dump(exclude_unset=True)
    if "repo_link" in data and data["repo_link"] is not None:
        data["repo_link"] = str(data["repo_link"])

    for field, value in data.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete service",
)
def delete_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(check_permission("create:services"))
):
    row = (
        db.query(ServiceModel)
        .filter(ServiceModel.id == service_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(row)
    db.commit()
    return None
