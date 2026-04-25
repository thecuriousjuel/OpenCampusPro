from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Teacher, Student
from datetime import datetime

bp = Blueprint("teachers", __name__, url_prefix="/api/teachers")


@bp.route("", methods=["GET"])
@jwt_required()
def get_teachers():
    """Get all teachers"""
    from flask import current_app

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", "")
    specialization = request.args.get("specialization", "")

    current_app.logger.info(
        f"Fetching teachers - Page: {page}, Per page: {per_page}, Search: '{search}', Spec: '{specialization}'"
    )

    query = Teacher.query

    if search:
        query = query.filter(
            (Teacher.name.ilike(f"%{search}%")) | (Teacher.email.ilike(f"%{search}%"))
        )

    if specialization:
        query = query.filter(Teacher.specialization == specialization)

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "teachers": [teacher.to_dict() for teacher in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "current_page": page,
        }
    ), 200


@bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_teacher(id):
    """Get a single teacher by ID"""
    from flask import current_app

    current_app.logger.info(f"Fetching teacher with ID: {id}")
    teacher = Teacher.query.get(id)

    if not teacher:
        current_app.logger.warning(f"Teacher not found: ID {id}")
        return jsonify({"error": "Teacher not found"}), 404

    return jsonify({"teacher": teacher.to_dict()}), 200


@bp.route("", methods=["POST"])
@jwt_required()
def create_teacher():
    """Create a new teacher"""
    from flask import current_app

    data = request.get_json()

    current_app.logger.info(f"Creating new teacher: {data.get('name', 'N/A')}")

    if not data or not data.get("name") or not data.get("email"):
        current_app.logger.warning("Teacher creation failed: Missing required fields")
        return jsonify({"error": "Missing required fields"}), 400

    # Check if email already exists in teachers table
    if Teacher.query.filter_by(email=data["email"]).first():
        current_app.logger.warning(
            f"Teacher creation failed: Email '{data['email']}' already exists in teachers"
        )
        return jsonify({"error": "Email already exists"}), 400

    # Check if email already exists in students table
    if Student.query.filter_by(email=data["email"]).first():
        current_app.logger.warning(
            f"Teacher creation failed: Email '{data['email']}' already exists in students"
        )
        return jsonify({"error": "Email already exists"}), 400

    teacher = Teacher(
        employee_id=data.get(
            "employee_id", f"TCH-{int(datetime.utcnow().timestamp())}"
        ),
        name=data["name"],
        email=data["email"],
        phone=data.get("phone"),
        specialization=data.get("specialization"),
    )

    if data.get("hire_date"):
        try:
            teacher.hire_date = datetime.fromisoformat(data["hire_date"]).date()
        except:
            pass

    try:
        db.session.add(teacher)
        db.session.commit()
        current_app.logger.info(
            f"Teacher created successfully: {teacher.name} (ID: {teacher.id})"
        )
        return jsonify(
            {"message": "Teacher created successfully", "teacher": teacher.to_dict()}
        ), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error creating teacher '{data.get('name')}': {str(e)}", exc_info=True
        )
        return jsonify(
            {"error": "An unexpected database error occurred. Please try again later."}
        ), 500


@bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_teacher(id):
    """Update a teacher"""
    from flask import current_app

    current_app.logger.info(f"Updating teacher with ID: {id}")
    teacher = Teacher.query.get(id)

    if not teacher:
        current_app.logger.warning(f"Teacher update failed: ID {id} not found")
        return jsonify({"error": "Teacher not found"}), 404

    data = request.get_json()

    if data.get("employee_id"):
        # Check uniqueness if changed
        existing = Teacher.query.filter_by(employee_id=data["employee_id"]).first()
        if existing and existing.id != id:
            return jsonify({"error": "Employee ID already exists"}), 400
        teacher.employee_id = data["employee_id"]

    if data.get("name"):
        teacher.name = data["name"]
    if data.get("email"):
        # Check if new email already exists in teachers table
        existing = Teacher.query.filter_by(email=data["email"]).first()
        if existing and existing.id != id:
            return jsonify({"error": "Email already exists"}), 400

        # Check if new email already exists in students table
        if Student.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already exists"}), 400

        teacher.email = data["email"]
    if "phone" in data:
        teacher.phone = data["phone"]
    if "specialization" in data:
        teacher.specialization = data["specialization"]
    if data.get("hire_date"):
        try:
            teacher.hire_date = datetime.fromisoformat(data["hire_date"]).date()
        except:
            pass

    try:
        db.session.commit()
        current_app.logger.info(
            f"Teacher updated successfully: {teacher.name} (ID: {teacher.id})"
        )
        return jsonify(
            {"message": "Teacher updated successfully", "teacher": teacher.to_dict()}
        ), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error updating teacher ID {id}: {str(e)}", exc_info=True
        )
        return jsonify(
            {"error": "An unexpected database error occurred. Please try again later."}
        ), 500


@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_teacher(id):
    """Delete a teacher"""
    from flask import current_app

    current_app.logger.info(f"Deleting teacher with ID: {id}")
    teacher = Teacher.query.get(id)

    if not teacher:
        current_app.logger.warning(f"Teacher deletion failed: ID {id} not found")
        return jsonify({"error": "Teacher not found"}), 404

    try:
        teacher_name = teacher.name
        db.session.delete(teacher)
        db.session.commit()
        current_app.logger.info(
            f"Teacher deleted successfully: {teacher_name} (ID: {id})"
        )
        return jsonify({"message": "Teacher deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error deleting teacher ID {id}: {str(e)}", exc_info=True
        )
        return jsonify(
            {"error": "An unexpected database error occurred. Please try again later."}
        ), 500
