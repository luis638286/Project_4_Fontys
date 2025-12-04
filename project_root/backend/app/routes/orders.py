from flask import Blueprint, jsonify, request

from ..db import get_db

bp = Blueprint("orders", __name__)


def _serialize_order(order_row, items):
    return {
        "id": order_row["id"],
        "user_id": order_row["user_id"],
        "full_name": order_row["full_name"],
        "email": order_row["email"],
        "address": order_row["address"],
        "city": order_row["city"],
        "notes": order_row["notes"],
        "subtotal": order_row["subtotal"],
        "total": order_row["total"],
        "created_at": order_row["created_at"],
        "items": items,
    }


def _fetch_order_items(db, order_id):
    rows = db.execute(
        """
        SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.price
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.id
        """,
        (order_id,),
    ).fetchall()

    return [
        {
            "id": row["id"],
            "product_id": row["product_id"],
            "product_name": row["product_name"],
            "quantity": row["quantity"],
            "price": row["price"],
            "line_total": row["price"] * row["quantity"],
        }
        for row in rows
    ]


def _validate_items(db, items):
    cleaned = []
    subtotal = 0

    for raw in items:
        try:
            product_id = int(raw.get("product_id"))
            quantity = int(raw.get("quantity") or 0)
        except (TypeError, ValueError):
            return None, "Each item requires a valid product_id and quantity"

        if quantity <= 0:
            return None, "Item quantity must be at least 1"

        product = db.execute(
            "SELECT id, price FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()

        if not product:
            return None, f"Product {product_id} not found"

        line_total = product["price"] * quantity
        subtotal += line_total

        cleaned.append(
            {
                "product_id": product_id,
                "quantity": quantity,
                "price": product["price"],
            }
        )

    return cleaned, subtotal


@bp.route("/", methods=["POST"])
def create_order():
    payload = request.get_json(force=True) or {}
    items = payload.get("items") or []

    if not items:
        return jsonify({"error": "At least one item is required"}), 400

    full_name = (payload.get("full_name") or "").strip()
    email = (payload.get("email") or "").strip()

    if not full_name or not email:
        return jsonify({"error": "full_name and email are required"}), 400

    db = get_db()

    cleaned_items, subtotal = _validate_items(db, items)
    if cleaned_items is None:
        return jsonify({"error": subtotal}), 400

    total = subtotal

    cur = db.execute(
        """
        INSERT INTO orders (user_id, full_name, email, address, city, notes, subtotal, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("user_id"),
            full_name,
            email,
            payload.get("address"),
            payload.get("city"),
            payload.get("notes"),
            subtotal,
            total,
        ),
    )
    order_id = cur.lastrowid

    for item in cleaned_items:
        db.execute(
            """
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)
            """,
            (order_id, item["product_id"], item["quantity"], item["price"]),
        )

    db.commit()

    return get_order(order_id)


@bp.route("/", methods=["GET"])
def list_orders():
    user_id = request.args.get("user_id")
    db = get_db()

    query = "SELECT * FROM orders"
    params = []

    if user_id:
        query += " WHERE user_id = ?"
        params.append(user_id)

    query += " ORDER BY datetime(created_at) DESC"

    orders = db.execute(query, params).fetchall()

    response = []
    for order in orders:
        items = _fetch_order_items(db, order["id"])
        response.append(_serialize_order(order, items))

    return jsonify(response)


@bp.route("/<int:order_id>", methods=["GET"])
def get_order(order_id):
    db = get_db()
    order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    items = _fetch_order_items(db, order_id)
    return jsonify(_serialize_order(order, items))
