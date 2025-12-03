from flask import Flask, jsonify, request, session
from flask_cors import CORS
import bcrypt

from . import models


def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    # Secret key for sessions (for now hard-coded)
    app.config["SECRET_KEY"] = "change-this-later"

    # ---- Seed in-memory data once at startup ----
    models.seed_users()
    models.seed_products()
    print("Seeded admin user and sample products")

    # ---- Small helpers ----
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
                return jsonify({"error": "Admin access only"}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper

    # ---- Routes ----

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    # ---------- Auth ----------

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

    # ---------- Products ----------

    @app.route("/api/products", methods=["GET"])
    def list_products():
        products = models.get_all_products()
        return jsonify(products)

    @app.route("/api/products", methods=["POST"])
    @require_admin
    def add_product():
        data = request.get_json() or {}
        name = data.get("name")
        price = data.get("price")
        stock = data.get("stock", 0)

        if not name or price is None:
            return jsonify({"error": "name and price are required"}), 400

        try:
            price = float(price)
            stock = int(stock)
        except ValueError:
            return jsonify({"error": "price must be number, stock must be integer"}), 400

        product = models.create_product(name, price, stock)
        return jsonify(product), 201

    @app.route("/api/products/<int:product_id>", methods=["PUT"])
    @require_admin
    def edit_product(product_id):
        data = request.get_json() or {}
        name = data.get("name")
        price = data.get("price")
        stock = data.get("stock")

        if not name or price is None or stock is None:
            return jsonify({"error": "name, price and stock are required"}), 400

        try:
            price = float(price)
            stock = int(stock)
        except ValueError:
            return jsonify({"error": "price must be number, stock must be integer"}), 400

        product = models.update_product(product_id, name, price, stock)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        return jsonify(product)

    @app.route("/api/products/<int:product_id>", methods=["DELETE"])
    @require_admin
    def remove_product(product_id):
        product = models.get_product_by_id(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        models.delete_product(product_id)
        return jsonify({"message": "Product deleted"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
