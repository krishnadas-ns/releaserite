"""
Database Initialization Script
"""
# pylint: disable=wrong-import-position
import os
import sys

# Add project root (parent of "scripts") to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.core.database import Base, engine, SessionLocal
from app.models.service import ServiceModel # pylint: disable=unused-import
from app.models.environment import EnvironmentModel # pylint: disable=unused-import
from app.models.role import RoleModel
from app.models.user import UserModel
from app.models.release import ReleaseModel, DeploymentModel # pylint: disable=unused-import
from app.core.security import get_password_hash


def seed_admin_role():
    """Seed the admin role if it doesn't exist."""
    db = SessionLocal()
    try:
        existing = db.query(RoleModel).filter(RoleModel.name == "admin").first()
        if not existing:
            admin = RoleModel(
                name="admin",
                description="Administrator with full system access.",
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()

def seed_roles_and_users():
    """Seed default roles and users."""
    db = SessionLocal()
    try:
        # Define Roles and Permissions
        roles_data = [
            {
                "name": "admin",
                "description": "Administrator with full system access.",
                "permissions": None  # Admin implies all
            },
            {
                "name": "release_manager",
                "description": "Can manage releases and services.",
                "permissions": (
                    "read:releases,create:releases,update:releases,delete:releases,"
                    "read:services,create:services,update:services,delete:services,"
                    "read:users"
                )
            },
            {
                "name": "product_owner",
                "description": "Can view releases and services.",
                "permissions": "read:releases,read:services"
            },
             {
                "name": "qa_engineer",
                "description": "Can view releases and services.",
                "permissions": "read:releases,read:services"
            },
             {
                "name": "security_analyst",
                "description": "Can view releases and services.",
                "permissions": "read:releases,read:services"
            }
        ]

        # Create Roles
        created_roles = {}
        for r_data in roles_data:
            role = db.query(RoleModel)\
                .filter(RoleModel.name == r_data["name"])\
                .first()
            if not role:
                role = RoleModel(
                    name=r_data["name"],
                    description=r_data["description"],
                    permissions=r_data["permissions"]
                )
                db.add(role)
                db.commit()
                db.refresh(role)
            else:
                # Update permissions if they changed
                if role.permissions != r_data["permissions"]:
                    role.permissions = r_data["permissions"]
                    db.commit()
                    db.refresh(role)
            created_roles[r_data["name"]] = role

        # Define Users
        users_data = [
            {
                "email": "admin@example.com",
                "name": "Admin User",
                "role": "admin",
                "password": "Admin123!"
            },
            {
                "email": "rm@example.com",
                "name": "ReleaseRite Admin",
                "role": "release_manager",
                "password": "password"
            },
            {
                "email": "po@example.com",
                "name": "Product Owner",
                "role": "product_owner",
                "password": "password"
            },
            {
                "email": "qa@example.com",
                "name": "QA Engineer",
                "role": "qa_engineer",
                "password": "password"
            },
            {
                "email": "sec@example.com",
                "name": "Security Analyst",
                "role": "security_analyst",
                "password": "password"
            },
        ]

        # Create Users
        for u_data in users_data:
            user = db.query(UserModel).filter(UserModel.email == u_data["email"]).first()
            role = created_roles.get(u_data["role"])
            if not user:
                user = UserModel(
                    email=u_data["email"],
                    full_name=u_data["name"],
                    hashed_password=get_password_hash(u_data["password"]),
                    is_active=True,
                    role_id=role.id if role else None,
                )
                db.add(user)
                db.commit()
                print(f"Created user: {u_data['email']}")
            else:
                if user.role_id != role.id:
                    user.role_id = role.id
                    db.commit()
                    print(f"Updated role for user: {u_data['email']}")

    finally:
        db.close()

def main():
    """Main function to initialize database."""
    Base.metadata.create_all(bind=engine)
    seed_roles_and_users()  # ensure roles and users exist

if __name__ == "__main__":
    main()
