"""
app.py — Flask application entry point.
"""
import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from backend.routes.recommend   import recommend_bp
from backend.routes.courses     import courses_bp
from backend.routes.progress    import progress_bp
from backend.routes.internships import internships_bp
from backend.routes.auth        import auth_bp
from database.db                import init_db, ping

load_dotenv()

def create_app():
    app = Flask(__name__, static_folder="../frontend", static_url_path="")
    app.config["SECRET_KEY"]   = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["DATABASE_URL"] = os.getenv("DATABASE_URL", "sqlite:///pmis.db")

    CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "*").split(","))

    # Register blueprints
    app.register_blueprint(recommend_bp,   url_prefix="/api")
    app.register_blueprint(courses_bp,     url_prefix="/api")
    app.register_blueprint(progress_bp,    url_prefix="/api")
    app.register_blueprint(internships_bp, url_prefix="/api")
    app.register_blueprint(auth_bp,        url_prefix="/api")

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "1.0.0"}

    # Serve frontend SPA
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        return app.send_static_file("index.html")

    init_db(app)
    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)