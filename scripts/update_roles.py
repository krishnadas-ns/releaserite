
import os
import sys

# Add project root to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.core.database import SessionLocal
from app.models.role import RoleModel

def update_roles():
    db = SessionLocal()
    try:
        roles_config = {
            "admin": "*",
            "product_owner": "read:environments,read:services,read:dashboard,read:releases",
            "qa_engineer": "read:environments,read:services,read:dashboard,read:releases",
            "release_manager": "read:environments,read:services,create:services,read:releases,create:releases,read:dashboard",
            "security_analyst": "read:environments,read:services,read:dashboard,read:releases"
        }

        for role_name, permissions in roles_config.items():
            role = db.query(RoleModel).filter(RoleModel.name == role_name).first()
            if role:
                print(f"Updating {role_name} with permissions: {permissions}")
                role.permissions = permissions
            else:
                print(f"Role {role_name} not found, creating it.")
                role = RoleModel(name=role_name, permissions=permissions)
                db.add(role)
        
        db.commit()
        print("Roles updated successfully.")
    except Exception as e:
        print(f"Error updating roles: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_roles()
