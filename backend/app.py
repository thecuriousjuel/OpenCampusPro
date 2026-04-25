from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from datetime import timedelta
import os

app = Flask(__name__)

# Configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(BASE_DIR, "instance", "student_management.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "dev-secret-key-change-in-production"
)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "jwt-secret-key-change-in-production"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": "*"}})
db.init_app(app)
jwt = JWTManager(app)

# Setup logging
from utils.logger import setup_logging

logger = setup_logging(app)

# Import routes
from routes import (
    auth,
    students,
    teachers,
    courses,
    batches,
    attendance,
    fees,
    reports,
    marks,
)

# Register blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(students.bp)
app.register_blueprint(teachers.bp)
app.register_blueprint(courses.bp)
app.register_blueprint(batches.bp)
app.register_blueprint(attendance.bp)
app.register_blueprint(fees.bp)
app.register_blueprint(reports.bp)
app.register_blueprint(marks.bp)

# Create database tables
with app.app_context():
    db.create_all()
    logger.info("Database tables created successfully!")


@app.route("/")
def index():
    return jsonify(
        {
            "message": "Student Management System API",
            "version": "1.0.0",
            "status": "running",
        }
    )


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    logger.info("Starting Flask development server on http://0.0.0.0:5001")
    app.run(debug=True, host="0.0.0.0", port=5001)
