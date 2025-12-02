import os
import sqlite3
from flask import Flask, jsonify, request, session
from flask_cors import CORS
import bcrypt

from . import models   # your existing user system


def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    # Secret key for sessions
    app.config["SECRET_KEY"] = "change-this-later"

    # Seed in-memory demo users
    models.seed_users()
    print("Seeded default admin user: admin@example.com / admin123")

    # -------------------------
    # Helpers
    # -------------------------
    def require_login(f):
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "Login required"}), 401
            return f(*args, **kwargs)

        wrapper.__name__ = f.__name__
        return wrapper

    def require_admin(f):
        @require_login
        def wrapper(*args, **kwargs):
            if session.get("role") != "admin":
                return jsonify({"error": "Admin only"}), 403
            return f(*args, **kwargs)

        wrapper.__name__ = f.__name__
        return wrapper

    # =============================================================
    # ROUTES
    # =============================================================

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    # -------------------------
    # AUTH
    # -------------------------
    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = models.get_user_by_email(email)
        if user is None:
            return jsonify({"error": "Invalid email or password"}), 401

        stored_hash = user["password_hash"].encode("utf-8")
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
            return jsonify({"error": "Invalid email or password"}), 401

        session["user_id"] = user["id"]
        session["role"] = user["role"]

        return jsonify({
            "message": "Login successful",
            "role": user["role"]
        }), 200

    @app.route("/api/me", methods=["GET"])
    @require_login
    def me():
        return jsonify({
            "user_id": session["user_id"],
            "role": session["role"]
        })

    @app.route("/api/logout", methods=["POST"])
    @require_login
    def logout():
        session.clear()
        return jsonify({"message": "Logged out"})



    # =============================================================
    # PRODUCTS API (SQLite)
    # =============================================================

    @app.get("/api/products")
    def get_products():
        """Return all products from backend/products.db"""

        # --- absolute path to backend/products.db ---
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        DB_PATH = os.path.join(BASE_DIR, "products.db")

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        rows = cur.execute("SELECT * FROM products").fetchall()
        products = [dict(row) for row in rows]

        conn.close()
        return jsonify(products)

    # END create_app()
    return app


# ==============================
# Run with: py -m backend.app
# ==============================
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)