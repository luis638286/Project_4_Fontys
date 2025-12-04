import bcrypt
from flask import Blueprint, jsonify, request

from ..db import get_db

bp = Blueprint("auth", __name__)


@bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(force=True) or {}
    first = (payload.get("first_name") or "").strip()
    last = (payload.get("last_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not (first and last and email and password):
        return jsonify({"error": "first_name, last_name, email, and password are required"}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify({"error": "A user with that email already exists"}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.execute(
        """
        INSERT INTO users (first_name, last_name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
        """,
        (first, last, email, password_hash, payload.get("role", "customer")),
    )
    db.commit()

    user = db.execute(
        "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE email = ?",
        (email,),
    ).fetchone()

    return jsonify(dict(user)), 201


@bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(force=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not (email and password):
        return jsonify({"error": "email and password are required"}), 400

    db = get_db()
    user = db.execute(
        "SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = ?",
        (email,),
    ).fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    sanitized = {k: user[k] for k in ["id", "first_name", "last_name", "email", "role"]}
    return jsonify({"message": "Login successful", "user": sanitized}), 200
