"""
Script to seed default users into the database.
"""
# pylint: disable=wrong-import-position
import os
import sys

# Add project root to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.core.database import SessionLocal
from app.models.user import UserModel
from app.models.role import RoleModel
from app.core.security import get_password_hash

def seed_users():
    """Seed users from configuration."""
    db = SessionLocal()
    try:
        users_config = [
            {"email": "admin@example.com", "role": "admin", "name": "Admin User"},
            {"email": "po@example.com", "role": "product_owner", "name": "Product Owner"},
            {"email": "qa@example.com", "role": "qa_engineer", "name": "QA Engineer"},
            {"email": "rm@example.com", "role": "release_manager", "name": "ReleaseRite Admin"},
            {"email": "sec@example.com", "role": "security_analyst", "name": "Security Analyst"},
        ]

        common_password_hash = get_password_hash("Admin123!")

        for user_data in users_config:
            # Get role
            role = db.query(RoleModel).filter(RoleModel.name == user_data["role"]).first()
            if not role:
                print(f"Role {user_data['role']} not found! Run update_roles.py first.")
                continue

            # Check if user exists
            user = db.query(UserModel).filter(UserModel.email == user_data["email"]).first()
            if user:
                print(f"User {user_data['email']} already exists. Updating role if needed.")
                if user.role_id != role.id:
                    user.role_id = role.id
                    db.add(user)
            else:
                print(f"Creating user {user_data['email']}...")
                user = UserModel(
                    email=user_data["email"],
                    full_name=user_data["name"],
                    hashed_password=common_password_hash,
                    is_active=True,
                    role_id=role.id
                )
                db.add(user)

        db.commit()
        print("Users seeded successfully.")

    except Exception as e: # pylint: disable=broad-exception-caught
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
