# FreshMart Local Stack

A cleaned-up, sqlite-backed FreshMart demo with a structured Flask API and static admin/customer frontends.

## Project layout
- `backend/` – Flask application package.
  - `app/` – application factory, database helpers, and blueprints
  - `run.py` – convenience entrypoint to start the API locally
- `frontend/` – static admin and customer experiences
  - `assets/` – shared config + API helper loaded by both admin and customer pages
  - `admin/` – admin dashboards and product management UI
  - `customer/` – storefront pages (shop, login, checkout)
- `docs/` – existing security docs

## Backend setup
1. From `project_root/backend`, create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Initialize the sqlite database with sample data:
   ```bash
   flask --app app init-db
   ```
3. Run the API (instance DB lives in `backend/instance/freshmart.sqlite`):
   ```bash
   python run.py
   ```
   The server runs at `http://localhost:5000` with CORS enabled for the static frontend.

### API base URL
`http://localhost:5000/api`

### Endpoints
- Health: `GET /api/health`
- Auth:
  - `POST /api/auth/register` – `first_name`, `last_name`, `email`, `password` (optional `role`)
  - `POST /api/auth/login` – `email`, `password`
- Products:
  - `GET /api/products/` – list products
  - `GET /api/products/<id>` – single product
  - `POST /api/products/` – create product (name, price, stock, category, description, image_url, discount, is_featured)
  - `PUT /api/products/<id>` – update product
  - `DELETE /api/products/<id>` – remove product

## Frontend usage
- Admin product management: open `frontend/admin/products.html` in a browser. It uses the shared API client and hits the Flask endpoints above.
- Storefront: open `frontend/customer/shop.html` to browse products backed by the same API.
- Update `frontend/assets/js/config.js` if you change the API host/port.

## Notes
- SQLite is used for all persistence; the schema and seed data are created automatically via `flask --app app init-db` or on first run of `run.py`.
- Requirements keep the original tech stack (Flask, Flask-Cors, bcrypt).
- Local hosting only; no external services are required.
