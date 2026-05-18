import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.routes.auth import auth_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.courses import courses_bp
from backend.routes.internships import internships_bp
from backend.routes.progress import progress_bp
from backend.routes.recommend import recommend_bp
from backend.routes.roadmap import roadmap_bp
from backend.routes.profile import profile_bp
from backend.routes.uploads import uploads_bp
from backend.database.repository import ensure_collections, storage_mode

BACKEND_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(BACKEND_ENV_PATH, override=True)


def create_app():
    app = Flask(__name__, instance_relative_config=True, static_folder=None)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")

    CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "*").split(","))
    ensure_collections()

    app.register_blueprint(recommend_bp, url_prefix="/api")
    app.register_blueprint(courses_bp, url_prefix="/api")
    app.register_blueprint(progress_bp, url_prefix="/api")
    app.register_blueprint(internships_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(roadmap_bp, url_prefix="/api")
    app.register_blueprint(uploads_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "2.0.0", "data_source": storage_mode()}

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
