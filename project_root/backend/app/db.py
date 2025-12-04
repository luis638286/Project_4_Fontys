import sqlite3
from pathlib import Path

import bcrypt

import click
from flask import current_app, g

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    description TEXT,
    image_url TEXT,
    discount REAL NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    notes TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
"""


SAMPLE_PRODUCTS = [
    {
        "name": "Bananas (1kg)",
        "price": 1.49,
        "stock": 30,
        "category": "Fruit",
        "description": "Fresh bananas by the kilogram",
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e",
    },
    {
        "name": "Milk 1L",
        "price": 0.99,
        "stock": 50,
        "category": "Dairy",
        "description": "Whole milk 1 liter",
        "image_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
    },
    {
        "name": "Whole grain bread",
        "price": 1.79,
        "stock": 20,
        "category": "Bakery",
        "description": "Baked this morning",
        "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e",
    },
]


def get_db():
    if "db" not in g:
        db_path = Path(current_app.instance_path) / current_app.config["DATABASE"]
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.executescript(SCHEMA)
    db.commit()

    seed_admin(db)
    seed_demo_customers(db)
    seed_products(db)


def ensure_schema():
    """Initialize the schema if the database or tables don't yet exist."""

    db = get_db()
    try:
        # Touch expected tables to confirm they exist. If any are missing,
        # fall back to a full init so the app can continue running.
        db.execute("SELECT 1 FROM users LIMIT 1")
        db.execute("SELECT 1 FROM products LIMIT 1")
        db.execute("SELECT 1 FROM orders LIMIT 1")
        db.execute("SELECT 1 FROM order_items LIMIT 1")
    except sqlite3.OperationalError:
        init_db()


def seed_admin(db):
    existing_admin = db.execute(
        "SELECT id FROM users WHERE email = ?",
        ("admin@freshmart.com",),
    ).fetchone()

    if existing_admin:
        return

    password_hash = bcrypt.hashpw("Admin123!".encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )

    db.execute(
        """
        INSERT INTO users (first_name, last_name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("FreshMart", "Admin", "admin@freshmart.com", password_hash, "admin"),
    )
    db.commit()


def seed_demo_customers(db):
    existing_customers = db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").fetchone()
    if existing_customers and existing_customers["count"]:
        return

    starter_users = [
        {
            "first_name": "Sarah",
            "last_name": "Lee",
            "email": "sarah.lee@example.com",
            "password": "Customer123!",
        },
        {
            "first_name": "Daniel",
            "last_name": "Carter",
            "email": "dan.carter@example.com",
            "password": "Customer123!",
        },
    ]

    for user in starter_users:
        password_hash = bcrypt.hashpw(user["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        db.execute(
            """
            INSERT INTO users (first_name, last_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, 'customer')
            """,
            (user["first_name"], user["last_name"], user["email"], password_hash),
        )

    db.commit()


def seed_products(db):
    cur = db.execute("SELECT COUNT(*) as count FROM products")
    count = cur.fetchone()["count"]
    if count:
        return

    for item in SAMPLE_PRODUCTS:
        db.execute(
            """
            INSERT INTO products (name, price, stock, category, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                item.get("name"),
                item.get("price", 0),
                item.get("stock", 0),
                item.get("category"),
                item.get("description"),
                item.get("image_url"),
            ),
        )
    db.commit()


def init_app(app):
    app.teardown_appcontext(close_db)

    @app.cli.command("init-db")
    def init_db_command():
        init_db()
        click.echo("Initialized the database with sample data.")
