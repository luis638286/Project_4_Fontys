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
   - **macOS/Linux:**
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     python -m pip install -r requirements.txt
     ```
   - **Windows (PowerShell):**
     ```pwsh
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     python -m pip install -r requirements.txt
     ```
2. Initialize the sqlite database with sample data (using `python -m flask` avoids PATH issues such as `flask` not being recognized on Windows):
   ```bash
   python -m flask --app app init-db
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
  - `GET /api/auth/users` – list registered users (filter by `?role=customer` or `?role=admin`)
- Products:
  - `GET /api/products/` – list products
  - `GET /api/products/<id>` – single product
  - `POST /api/products/` – create product (name, price, stock, category, description, image_url, discount, is_featured)
  - `PUT /api/products/<id>` – update product
  - `DELETE /api/products/<id>` – remove product

## Frontend usage
- Admin dashboard: open `frontend/admin/admin-dashboard.html` for a quick overview and navigation to all admin tools.
- Admin catalog: open `frontend/admin/products.html` to manage products via the shared API client and Flask endpoints above.
- Admin customers: open `frontend/admin/customers.html` to browse, filter, and export customer profiles sourced from real sign-ups.
- Admin settings: open `frontend/admin/settings.html` to toggle store visibility and update local environment pointers.
- Storefront: open `frontend/customer/shop.html` to browse products backed by the same API.
- Customer auth: `frontend/customer/signup.html` registers shoppers against the API, and `frontend/customer/login.html` signs them in and redirects to the shop.
- Admin auth: log in at `frontend/admin/admin-login.html` with the seeded admin user `admin@freshmart.com` / `Admin123!` (created during `init-db`).
- Admin customers: open `frontend/admin/customers.html` to browse, filter, and export customer profiles.
- Admin settings: open `frontend/admin/settings.html` to toggle store visibility and update local environment pointers.
- Storefront: open `frontend/customer/shop.html` to browse products backed by the same API.
- Update `frontend/assets/js/config.js` if you change the API host/port.

## Viewing the sqlite database
- The database file lives at `backend/instance/freshmart.sqlite` after you run `python -m flask --app app init-db` or start the server once.
- You can inspect it with the built-in CLI:
  ```bash
  cd backend
  sqlite3 instance/freshmart.sqlite
  .tables
  SELECT * FROM products LIMIT 5;
  ```
- GUI option: open the same file in a SQLite viewer such as "DB Browser for SQLite".

## Notes
- SQLite is used for all persistence; the schema and seed data are created automatically via `flask --app app init-db` or on first run of `run.py`.
- Requirements keep the original tech stack (Flask, Flask-Cors, bcrypt).
- Local hosting only; no external services are required.
- If a deployment goes wrong, you can roll back to the previous Git state: `git log` to find the prior commit, then `git revert <commit>` (create a new undo commit) or `git reset --hard <commit>` locally before redeploying.
