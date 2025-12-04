from flask import Blueprint, jsonify, request

from ..db import get_db

bp = Blueprint("products", __name__)


def _serialize_product(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "price": row["price"],
        "stock": row["stock"],
        "category": row["category"],
        "description": row["description"],
        "image_url": row["image_url"],
        "discount": row["discount"],
        "is_featured": bool(row["is_featured"]),
    }


@bp.route("/", methods=["GET"])
def list_products():
    db = get_db()
    rows = db.execute(
        "SELECT id, name, price, stock, category, description, image_url, discount, is_featured FROM products ORDER BY id"
    ).fetchall()
    return jsonify([_serialize_product(row) for row in rows])


@bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    db = get_db()
    row = db.execute(
        "SELECT id, name, price, stock, category, description, image_url, discount, is_featured FROM products WHERE id = ?",
        (product_id,),
    ).fetchone()
    if not row:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(_serialize_product(row))


@bp.route("/", methods=["POST"])
def create_product():
    payload = request.get_json(force=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    db = get_db()
    cur = db.execute(
        """
        INSERT INTO products (name, price, stock, category, description, image_url, discount, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            float(payload.get("price") or 0),
            int(payload.get("stock") or 0),
            (payload.get("category") or None),
            (payload.get("description") or None),
            (payload.get("image_url") or None),
            float(payload.get("discount") or 0),
            1 if payload.get("is_featured") in (True, 1, "1", "true", "True") else 0,
        ),
    )
    db.commit()
    new_id = cur.lastrowid

    return get_product(new_id)


@bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    payload = request.get_json(force=True) or {}
    db = get_db()

    row = db.execute(
        "SELECT id, name, price, stock, category, description, image_url, discount, is_featured FROM products WHERE id = ?",
        (product_id,),
    ).fetchone()
    if not row:
        return jsonify({"error": "Product not found"}), 404

    current = _serialize_product(row)
    updated = {
        "name": (payload.get("name") or current["name"]).strip(),
        "price": float(payload.get("price") or current["price"]),
        "stock": int(payload.get("stock") or current["stock"]),
        "category": payload.get("category", current["category"]),
        "description": payload.get("description", current["description"]),
        "image_url": payload.get("image_url", current["image_url"]),
        "discount": float(payload.get("discount") or current["discount"]),
        "is_featured": 1 if payload.get("is_featured", current["is_featured"]) in (True, 1, "1", "true", "True") else 0,
    }

    db.execute(
        """
        UPDATE products
        SET name = ?, price = ?, stock = ?, category = ?, description = ?, image_url = ?, discount = ?, is_featured = ?
        WHERE id = ?
        """,
        (
            updated["name"],
            updated["price"],
            updated["stock"],
            updated["category"],
            updated["description"],
            updated["image_url"],
            updated["discount"],
            updated["is_featured"],
            product_id,
        ),
    )
    db.commit()

    return get_product(product_id)


@bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    db = get_db()
    row = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if not row:
        return jsonify({"error": "Product not found"}), 404

    db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
    return jsonify({"message": "Product deleted"}), 200
