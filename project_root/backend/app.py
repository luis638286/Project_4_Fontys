from flask import Flask, jsonify, request, session
from flask_cors import CORS
import bcrypt

from . import models


def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    # Secret key for sessions (for now hard-coded)
    app.config["SECRET_KEY"] = "change-this-later"

    # ---- Seed in-memory users once at startup ----
    models.seed_users()
    print("Seeded default admin user: admin@example.com / admin123")

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

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
