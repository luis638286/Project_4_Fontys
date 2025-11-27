# backend/models.py

import bcrypt

# In-memory "database" of users for now
# Later this will be replaced by real SQLite queries.
_users = []


def seed_users():
    """
    Create one default admin user in memory.
    email: admin@example.com
    password: admin123
    """
    global _users
    if _users:
        return  # already seeded

    password = "admin123".encode("utf-8")
    password_hash = bcrypt.hashpw(password, bcrypt.gensalt()).decode("utf-8")

    _users.append({
        "id": 1,
        "email": "admin@example.com",
        "password_hash": password_hash,
        "role": "admin",
    })


def get_user_by_email(email: str):
    """
    Return user dict if email exists, else None.
    """
    for user in _users:
        if user["email"] == email:
            return user
    return None
