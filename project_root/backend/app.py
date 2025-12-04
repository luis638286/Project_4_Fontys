from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from pathlib import Path

DB_PATH = Path('freshmart.db')

app = Flask(__name__)
CORS(app)


DB_PATH = Path('freshmart.db')

app = Flask(__name__)


def get_db_connection():
  conn = sqlite3.connect(DB_PATH)
  conn.row_factory = sqlite3.Row
  return conn


def init_db():
  conn = get_db_connection()
  cur = conn.cursor()
  cur.execute(
    """
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
    )
    """
  )
  conn.commit()
  conn.close()


@app.route('/api/products', methods=['GET'])
def get_products():
  conn = get_db_connection()
  cur = conn.cursor()
  cur.execute("SELECT * FROM products ORDER BY id ASC")
  rows = cur.fetchall()
  conn.close()

  products = [dict(row) for row in rows]
  return jsonify(products)


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
  conn = get_db_connection()
  cur = conn.cursor()
  cur.execute("SELECT * FROM products WHERE id = ?", (product_id,))
  row = cur.fetchone()
  conn.close()

  if row is None:
    return jsonify({'error': 'Product not found'}), 404

  return jsonify(dict(row))


@app.route('/api/products', methods=['POST'])
def create_product():
  data = request.get_json(force=True) or {}

  name = data.get('name', '').strip()
  if not name:
    return jsonify({'error': 'Name is required'}), 400

  price = float(data.get('price', 0) or 0)
  stock = int(data.get('stock', 0) or 0)
  category = data.get('category', '').strip() or None
  description = data.get('description', '').strip() or None
  image_url = data.get('image_url', '').strip() or None
  discount = float(data.get('discount', 0) or 0)
  is_featured = 1 if data.get('is_featured') in (1, True, '1', 'true', 'True') else 0

  conn = get_db_connection()
  cur = conn.cursor()
  cur.execute(
    """
    INSERT INTO products (name, price, stock, category, description, image_url, discount, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
    (name, price, stock, category, description, image_url, discount, is_featured),
  )
  conn.commit()
  new_id = cur.lastrowid

  cur.execute("SELECT * FROM products WHERE id = ?", (new_id,))
  row = cur.fetchone()
  conn.close()

  return jsonify(dict(row)), 201


@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
  data = request.get_json(force=True) or {}

  conn = get_db_connection()
  cur = conn.cursor()
  cur.execute("SELECT * FROM products WHERE id = ?", (product_id,))
  row = cur.fetchone()
  if row is None:
    conn.close()
    return jsonify({'error': 'Product not found'}), 404

  current = dict(row)

  name = (data.get('name') or current['name']).strip()
  price = float(data.get('price', current['price']))
  stock = int(data.get('stock', current['stock']))
  category = data.get('category', current.get('category'))
  if category is not None:
    category = category.strip()
  description = data.get('description', current.get('description'))
  if description is not None:
    description = description.strip()
  image_url = data.get('image_url', current.get('image_url'))
  if image_url is not None:
    image_url = image_url.strip()
  discount = float(data.get('discount', current['discount']))
  is_featured = data.get('is_featured', current['is_featured'])
  is_featured = 1 if is_featured in (1, True, '1', 'true', 'True') else 0

  cur.execute(
    """
    UPDATE products
    SET name = ?, price = ?, stock = ?, category = ?, description = ?, image_url = ?, discount = ?, is_featured = ?
    WHERE id = ?
    """,
    (name, price, stock, category, description, image_url, discount, is_featured, product_id),
  )
  conn.commit()

  cur.execute("SELECT * FROM products WHERE id = ?", (product_id,))
  updated_row = cur.fetchone()
  conn.close()

  return jsonify(dict(updated_row))


@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
  conn = get_db_connection()
  cur = conn.cursor()
  cur.execute("SELECT id FROM products WHERE id = ?", (product_id,))
  row = cur.fetchone()
  if row is None:
    conn.close()
    return jsonify({'error': 'Product not found'}), 404

  cur.execute("DELETE FROM products WHERE id = ?", (product_id,))
  conn.commit()
  conn.close()

  return jsonify({'message': 'Product deleted'}), 200


if __name__ == '__main__':
  init_db()
  app.run(debug=True)
