"""
Script to reset the admin user's password.
"""
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# pylint: disable=wrong-import-position
from app.core.database import SessionLocal
from app.models.user import UserModel
from app.core.security import get_password_hash

def reset_admin_password():
    """Reset admin password to default."""
    db = SessionLocal()
    try:
        admin_email = "admin@example.com"
        user = db.query(UserModel).filter(UserModel.email == admin_email).first()
        if user:
            print(f"Found user: {user.email}")
            user.hashed_password = get_password_hash("Admin123!")
            db.commit()
            print("Password reset successfully to 'Admin123!'")
        else:
            print(f"User {admin_email} not found!")
    except Exception as e: # pylint: disable=broad-exception-caught
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()
