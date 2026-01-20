# app/api/v1/endpoints/role.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.role import RoleModel
from app.schemas.role import Role, RoleCreate, RoleUpdate

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("/", response_model=List[Role])
def list_roles(db: Session = Depends(get_db)):
    return db.query(RoleModel).order_by(RoleModel.name).all()


@router.post("/", response_model=Role, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(RoleModel)
        .filter(RoleModel.name == payload.name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Role with this name already exists.",
        )

    role = RoleModel(
        name=payload.name,
        description=payload.description,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/{role_id}", response_model=Role)
def get_role(role_id: UUID, db: Session = Depends(get_db)):
    role = db.query(RoleModel).filter(RoleModel.id == role_id).first()
    if not role:
        raise HTTPException(404, "Role not found")
    return role


@router.patch("/{role_id}", response_model=Role)
def update_role(role_id: UUID, payload: RoleUpdate, db: Session = Depends(get_db)):
    role = db.query(RoleModel).filter(RoleModel.id == role_id).first()
    if not role:
        raise HTTPException(404, "Role not found")

    data = payload.model_dump(exclude_unset=True)

    # Unique constraint check
    if "name" in data and data["name"] != role.name:
        if db.query(RoleModel).filter(RoleModel.name == data["name"]).first():
            raise HTTPException(409, "Role name already exists")

    for field, value in data.items():
        setattr(role, field, value)

    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: UUID, db: Session = Depends(get_db)):
    role = db.query(RoleModel).filter(RoleModel.id == role_id).first()
    if not role:
        raise HTTPException(404, "Role not found")

    db.delete(role)
    db.commit()
    return None
