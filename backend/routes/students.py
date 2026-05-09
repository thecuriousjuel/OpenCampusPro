from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Student, Teacher
from datetime import datetime

bp = Blueprint("students", __name__, url_prefix="/api/students")


@bp.route("", methods=["GET"])
@jwt_required()
def get_students():
    """Get all students with optional search and pagination"""
    from flask import current_app

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", "")
    batch_id = request.args.get("batch_id", type=int)

    current_app.logger.info(
        f"Fetching students - Page: {page}, Per page: {per_page}, Search: '{search}', Batch ID: {batch_id}"
    )

    query = Student.query

    if batch_id:
        query = query.filter_by(batch_id=batch_id)

    if search:
        query = query.filter(
            (Student.name.ilike(f"%{search}%"))
            | (Student.email.ilike(f"%{search}%"))
            | (Student.student_code.ilike(f"%{search}%"))
        )

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "students": [student.to_dict() for student in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "current_page": page,
        }
    ), 200


@bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_student(id):
    """Get a single student by ID"""
    from flask import current_app

    current_app.logger.info(f"Fetching student with ID: {id}")
    student = Student.query.get(id)

    if not student:
        current_app.logger.warning(f"Student not found: ID {id}")
        return jsonify({"error": "Student not found"}), 404

    return jsonify({"student": student.to_dict()}), 200


@bp.route("", methods=["POST"])
@jwt_required()
def create_student():
    """Create a new student"""
    from flask import current_app

    data = request.get_json()

    current_app.logger.info(f"Creating new student: {data.get('name', 'N/A')}")

    if not data or not data.get("name") or not data.get("email"):
        current_app.logger.warning("Student creation failed: Missing required fields")
        return jsonify({"error": "Missing required fields"}), 400

    # Check if email already exists in students table
    if Student.query.filter_by(email=data["email"]).first():
        current_app.logger.warning(
            f"Student creation failed: Email '{data['email']}' already exists in students"
        )
        return jsonify({"error": "Email already exists"}), 400

    # Check if email already exists in teachers table
    if Teacher.query.filter_by(email=data["email"]).first():
        current_app.logger.warning(
            f"Student creation failed: Email '{data['email']}' already exists in teachers"
        )
        return jsonify({"error": "Email already exists"}), 400

    # Validate batch if provided
    if data.get("batch_id"):
        from models import Batch

        batch = Batch.query.get(data["batch_id"])
        if not batch:
            current_app.logger.warning(
                f"Student creation failed: Batch ID {data['batch_id']} not found"
            )
            return jsonify({"error": "Batch not found"}), 404

    # Determine default status based on batch assignment:
    # - If a batch is provided, default to 'active'
    # - If no batch is provided, default to 'inactive'
    default_status = "active" if data.get("batch_id") else "inactive"

    student = Student(
        student_code=data.get(
            "student_code", f"STUD-{int(datetime.utcnow().timestamp())}"
        ),
        name=data["name"],
        email=data["email"],
        phone=data.get("phone"),
        address=data.get("address"),
        status=data.get("status", default_status),
        batch_id=data.get("batch_id"),
    )

    if data.get("enrollment_date"):
        try:
            student.enrollment_date = datetime.fromisoformat(
                data["enrollment_date"]
            ).date()
        except:
            pass

    try:
        db.session.add(student)
        db.session.commit()
        current_app.logger.info(
            f"Student created successfully: {student.name} (ID: {student.id})"
        )
        return jsonify(
            {"message": "Student created successfully", "student": student.to_dict()}
        ), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error creating student '{data.get('name')}': {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_student(id):
    """Update a student"""
    from flask import current_app

    current_app.logger.info(f"Updating student with ID: {id}")
    student = Student.query.get(id)

    if not student:
        current_app.logger.warning(f"Student update failed: ID {id} not found")
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json()

    data = request.get_json()

    if data.get("student_code"):
        # Check uniqueness if changed
        existing = Student.query.filter_by(student_code=data["student_code"]).first()
        if existing and existing.id != id:
            return jsonify({"error": "Student Code already exists"}), 400
        student.student_code = data["student_code"]

    if data.get("name"):
        student.name = data["name"]
    if data.get("email"):
        # Check if new email already exists in students table
        existing = Student.query.filter_by(email=data["email"]).first()
        if existing and existing.id != id:
            return jsonify({"error": "Email already exists"}), 400

        # Check if new email already exists in teachers table
        if Teacher.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already exists"}), 400

        student.email = data["email"]
    if "phone" in data:
        student.phone = data["phone"]
    if "address" in data:
        student.address = data["address"]
    if data.get("status"):
        student.status = data["status"]
    if data.get("enrollment_date"):
        try:
            student.enrollment_date = datetime.fromisoformat(
                data["enrollment_date"]
            ).date()
        except:
            pass

    # Handle batch_id update
    if "batch_id" in data:
        if data["batch_id"]:
            # Validate batch exists
            from models import Batch

            batch = Batch.query.get(data["batch_id"])
            if not batch:
                current_app.logger.warning(
                    f"Student update failed: Batch ID {data['batch_id']} not found"
                )
                return jsonify({"error": "Batch not found"}), 404
            student.batch_id = data["batch_id"]

            # Auto-activate student when a batch is assigned (only if currently inactive)
            if student.status == "inactive":
                student.status = "active"
                current_app.logger.info(
                    f"Student ID {id} auto-activated due to batch assignment"
                )
        else:
            # Allow removing batch assignment
            student.batch_id = None

    try:
        db.session.commit()
        current_app.logger.info(
            f"Student updated successfully: {student.name} (ID: {student.id})"
        )
        return jsonify(
            {"message": "Student updated successfully", "student": student.to_dict()}
        ), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error updating student ID {id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_student(id):
    """Delete a student"""
    from flask import current_app

    current_app.logger.info(f"Deleting student with ID: {id}")
    student = Student.query.get(id)

    if not student:
        current_app.logger.warning(f"Student deletion failed: ID {id} not found")
        return jsonify({"error": "Student not found"}), 404

    try:
        student_name = student.name
        db.session.delete(student)
        db.session.commit()
        current_app.logger.info(
            f"Student deleted successfully: {student_name} (ID: {id})"
        )
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error deleting student ID {id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500
