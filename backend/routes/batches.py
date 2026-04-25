from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Batch, Course, Teacher
from datetime import datetime

bp = Blueprint("batches", __name__, url_prefix="/api/batches")


@bp.route("", methods=["GET"])
@jwt_required()
def get_batches():
    """Get all batches"""
    from flask import current_app

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    current_app.logger.info(f"Fetching batches - Page: {page}, Per page: {per_page}")

    paginated = Batch.query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "batches": [batch.to_dict() for batch in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "current_page": page,
        }
    ), 200


@bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_batch(id):
    """Get a single batch by ID"""
    from flask import current_app

    current_app.logger.info(f"Fetching batch with ID: {id}")
    batch = Batch.query.get(id)

    if not batch:
        current_app.logger.warning(f"Batch not found: ID {id}")
        return jsonify({"error": "Batch not found"}), 404

    return jsonify({"batch": batch.to_dict()}), 200


@bp.route("", methods=["POST"])
@jwt_required()
def create_batch():
    """Create a new batch"""
    from flask import current_app

    data = request.get_json()

    current_app.logger.info(f"Creating new batch: {data.get('name', 'N/A')}")

    if not data or not data.get("name") or not data.get("course_id"):
        current_app.logger.warning("Batch creation failed: Missing required fields")
        return jsonify({"error": "Missing required fields"}), 400

    # Verify course exists
    course = Course.query.get(data["course_id"])
    if not course:
        current_app.logger.warning(
            f"Batch creation failed: Course ID {data['course_id']} not found"
        )
        return jsonify({"error": "Course not found"}), 404

    # Verify teacher exists if provided
    if data.get("teacher_id"):
        teacher = Teacher.query.get(data["teacher_id"])
        if not teacher:
            current_app.logger.warning(
                f"Batch creation failed: Teacher ID {data['teacher_id']} not found"
            )
            return jsonify({"error": "Teacher not found"}), 404

    batch = Batch(
        name=data["name"],
        course_id=data["course_id"],
        teacher_id=data.get("teacher_id"),
        capacity=data.get("capacity", 30),
    )

    if data.get("start_date"):
        try:
            batch.start_date = datetime.fromisoformat(data["start_date"]).date()
        except:
            pass

    if data.get("end_date"):
        try:
            batch.end_date = datetime.fromisoformat(data["end_date"]).date()
        except:
            pass

    try:
        db.session.add(batch)
        db.session.commit()
        current_app.logger.info(
            f"Batch created successfully: {batch.name} (ID: {batch.id})"
        )
        return jsonify(
            {"message": "Batch created successfully", "batch": batch.to_dict()}
        ), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error creating batch '{data.get('name')}': {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_batch(id):
    """Update a batch"""
    from flask import current_app

    current_app.logger.info(f"Updating batch with ID: {id}")
    batch = Batch.query.get(id)

    if not batch:
        current_app.logger.warning(f"Batch update failed: ID {id} not found")
        return jsonify({"error": "Batch not found"}), 404

    data = request.get_json()

    if data.get("name"):
        batch.name = data["name"]
    if data.get("course_id"):
        course = Course.query.get(data["course_id"])
        if not course:
            return jsonify({"error": "Course not found"}), 404
        batch.course_id = data["course_id"]
    if "teacher_id" in data:
        if data["teacher_id"]:
            teacher = Teacher.query.get(data["teacher_id"])
            if not teacher:
                return jsonify({"error": "Teacher not found"}), 404
        batch.teacher_id = data["teacher_id"]
    if "capacity" in data:
        batch.capacity = data["capacity"]
    if data.get("start_date"):
        try:
            batch.start_date = datetime.fromisoformat(data["start_date"]).date()
        except:
            pass
    if data.get("end_date"):
        try:
            batch.end_date = datetime.fromisoformat(data["end_date"]).date()
        except:
            pass

    try:
        db.session.commit()
        current_app.logger.info(
            f"Batch updated successfully: {batch.name} (ID: {batch.id})"
        )
        return jsonify(
            {"message": "Batch updated successfully", "batch": batch.to_dict()}
        ), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error updating batch ID {id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_batch(id):
    """Delete a batch"""
    from flask import current_app

    current_app.logger.info(f"Deleting batch with ID: {id}")
    batch = Batch.query.get(id)

    if not batch:
        current_app.logger.warning(f"Batch deletion failed: ID {id} not found")
        return jsonify({"error": "Batch not found"}), 404

    try:
        batch_name = batch.name
        db.session.delete(batch)
        db.session.commit()
        current_app.logger.info(f"Batch deleted successfully: {batch_name} (ID: {id})")
        return jsonify({"message": "Batch deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(
            f"Error deleting batch ID {id}: {str(e)}", exc_info=True
        )
        return jsonify({"error": str(e)}), 500
