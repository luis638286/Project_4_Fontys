# backend/models.py

import bcrypt

# ---------- In-memory users ----------

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


# ---------- In-memory products ----------

_products = []
_next_product_id = 1


def seed_products():
    """
    Add some example products in memory.
    """
    global _products, _next_product_id
    if _products:
        return  # already seeded

    sample = [
        {"name": "Bananas (1kg)", "price": 1.49, "stock": 30},
        {"name": "Milk 1L", "price": 0.99, "stock": 50},
        {"name": "Bread (whole grain)", "price": 1.79, "stock": 20},
    ]

    for item in sample:
        item["id"] = _next_product_id
        _next_product_id += 1
        _products.append(item)


def get_all_products():
    return list(_products)  # return a copy


def get_product_by_id(product_id: int):
    for p in _products:
        if p["id"] == product_id:
            return p
    return None


def create_product(name: str, price: float, stock: int):
    global _products, _next_product_id
    product = {
        "id": _next_product_id,
        "name": name,
        "price": price,
        "stock": stock,
    }
    _next_product_id += 1
    _products.append(product)
    return product


def update_product(product_id: int, name: str, price: float, stock: int):
    p = get_product_by_id(product_id)
    if not p:
        return None
    p["name"] = name
    p["price"] = price
    p["stock"] = stock
    return p


def delete_product(product_id: int):
    global _products
    _products = [p for p in _products if p["id"] != product_id]
