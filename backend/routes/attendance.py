from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Attendance, Student, Batch
from datetime import datetime
from sqlalchemy import func

bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


@bp.route("", methods=["GET"])
@jwt_required()
def get_attendance():
    """Get attendance records with filters"""
    from flask import current_app

    batch_id = request.args.get("batch_id", type=int)
    student_id = request.args.get("student_id", type=int)
    date = request.args.get("date")

    current_app.logger.info(
        f"Fetching attendance - Batch ID: {batch_id}, Student ID: {student_id}, Date: {date}"
    )

    query = Attendance.query

    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    if student_id:
        query = query.filter_by(student_id=student_id)
    if date:
        try:
            date_obj = datetime.fromisoformat(date).date()
            query = query.filter_by(date=date_obj)
        except:
            pass

    records = query.all()

    return jsonify({"attendance": [record.to_dict() for record in records]}), 200


@bp.route("", methods=["POST"])
@jwt_required()
def mark_attendance():
    """Mark attendance for students"""
    from flask import current_app

    data = request.get_json()

    current_app.logger.info(
        f"Marking attendance for {len(data.get('records', []))} record(s)"
    )

    if not data or not data.get("records"):
        current_app.logger.warning(
            "Attendance marking failed: Missing attendance records"
        )
        return jsonify({"error": "Missing attendance records"}), 400

    try:
        created_records = []

        for record in data["records"]:
            if (
                not record.get("student_id")
                or not record.get("batch_id")
                or not record.get("date")
            ):
                continue

            # Check if student and batch exist
            student = Student.query.get(record["student_id"])
            batch = Batch.query.get(record["batch_id"])

            if not student or not batch:
                continue

            date_obj = datetime.fromisoformat(record["date"]).date()

            # Check if attendance already exists for this student, batch, and date
            existing = Attendance.query.filter_by(
                student_id=record["student_id"],
                batch_id=record["batch_id"],
                date=date_obj,
            ).first()

            if existing:
                # Update existing record
                existing.status = record.get("status", "present")
                created_records.append(existing)
            else:
                # Create new record
                attendance = Attendance(
                    student_id=record["student_id"],
                    batch_id=record["batch_id"],
                    date=date_obj,
                    status=record.get("status", "present"),
                )
                db.session.add(attendance)
                created_records.append(attendance)

        db.session.commit()

        current_app.logger.info(
            f"Attendance marked successfully: {len(created_records)} record(s) processed"
        )

        return jsonify(
            {
                "message": "Attendance marked successfully",
                "attendance": [record.to_dict() for record in created_records],
            }
        ), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking attendance: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@bp.route("/student/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student_attendance(student_id):
    """Get attendance history for a student"""
    from flask import current_app

    current_app.logger.info(f"Fetching attendance history for student ID: {student_id}")
    student = Student.query.get(student_id)

    if not student:
        current_app.logger.warning(
            f"Student not found for attendance query: ID {student_id}"
        )
        return jsonify({"error": "Student not found"}), 404

    records = Attendance.query.filter_by(student_id=student_id).all()

    # Calculate statistics
    total = len(records)
    present = len([r for r in records if r.status == "present"])
    absent = len([r for r in records if r.status == "absent"])
    late = len([r for r in records if r.status == "late"])

    percentage = (present / total * 100) if total > 0 else 0

    return jsonify(
        {
            "student": student.to_dict(),
            "attendance": [record.to_dict() for record in records],
            "statistics": {
                "total": total,
                "present": present,
                "absent": absent,
                "late": late,
                "percentage": round(percentage, 2),
            },
        }
    ), 200


@bp.route("/batch/<int:batch_id>", methods=["GET"])
@jwt_required()
def get_batch_attendance(batch_id):
    """Get attendance for a batch"""
    from flask import current_app

    current_app.logger.info(f"Fetching attendance for batch ID: {batch_id}")
    batch = Batch.query.get(batch_id)

    if not batch:
        current_app.logger.warning(
            f"Batch not found for attendance query: ID {batch_id}"
        )
        return jsonify({"error": "Batch not found"}), 404

    date_param = request.args.get("date")

    if date_param:
        try:
            date_obj = datetime.fromisoformat(date_param).date()
            records = Attendance.query.filter_by(batch_id=batch_id, date=date_obj).all()
        except:
            records = []
    else:
        records = Attendance.query.filter_by(batch_id=batch_id).all()

    return jsonify(
        {
            "batch": batch.to_dict(),
            "attendance": [record.to_dict() for record in records],
        }
    ), 200
