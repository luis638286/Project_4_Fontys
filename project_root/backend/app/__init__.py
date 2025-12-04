from pathlib import Path

from flask import Flask
from flask_cors import CORS

from . import db
from .routes.auth import bp as auth_bp
from .routes.products import bp as products_bp


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        DATABASE="freshmart.sqlite",
    )

    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    CORS(app)

    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")

    @app.route("/api/health")
    def health_check():
        return {"status": "ok"}, 200

    return app
