from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Student, Teacher, Course, Batch, Attendance, Fee
from sqlalchemy import func
from datetime import datetime, date

bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    from flask import current_app
    current_app.logger.info("Fetching dashboard statistics")
    total_students = Student.query.count()
    active_students = Student.query.filter_by(status='active').count()
    total_teachers = Teacher.query.count()
    total_courses = Course.query.count()
    total_batches = Batch.query.count()
    
    # Fee statistics
    total_fees = db.session.query(func.sum(Fee.amount)).scalar() or 0
    paid_fees = db.session.query(func.sum(Fee.amount)).filter_by(status='paid').scalar() or 0
    outstanding_fees = total_fees - paid_fees
    
    # Attendance statistics (last 30 days)
    today = date.today()
    recent_attendance = Attendance.query.filter(
        Attendance.date >= today.replace(day=1)
    ).all()
    
    if recent_attendance:
        present_count = len([a for a in recent_attendance if a.status == 'present'])
        attendance_rate = (present_count / len(recent_attendance) * 100) if recent_attendance else 0
    else:
        attendance_rate = 0
    
    return jsonify({
        'students': {
            'total': total_students,
            'active': active_students
        },
        'teachers': {
            'total': total_teachers
        },
        'courses': {
            'total': total_courses
        },
        'batches': {
            'total': total_batches
        },
        'fees': {
            'total': round(total_fees, 2),
            'paid': round(paid_fees, 2),
            'outstanding': round(outstanding_fees, 2)
        },
        'attendance': {
            'rate': round(attendance_rate, 2)
        }
    }), 200

@bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance_report():
    """Get attendance report"""
    from flask import current_app
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    batch_id = request.args.get('batch_id', type=int)
    
    current_app.logger.info(f"Generating attendance report - Start: {start_date}, End: {end_date}, Batch ID: {batch_id}")
    
    query = Attendance.query
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date).date()
            query = query.filter(Attendance.date >= start)
        except:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date).date()
            query = query.filter(Attendance.date <= end)
        except:
            pass
    
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    
    records = query.all()
    
    # Calculate statistics
    total = len(records)
    present = len([r for r in records if r.status == 'present'])
    absent = len([r for r in records if r.status == 'absent'])
    late = len([r for r in records if r.status == 'late'])
    
    return jsonify({
        'records': [record.to_dict() for record in records],
        'summary': {
            'total': total,
            'present': present,
            'absent': absent,
            'late': late,
            'attendance_rate': round((present / total * 100) if total > 0 else 0, 2)
        }
    }), 200

@bp.route('/fees', methods=['GET'])
@jwt_required()
def get_fees_report():
    """Get fees collection report"""
    from flask import current_app
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    current_app.logger.info(f"Generating fees report - Start: {start_date}, End: {end_date}, Status: {status}")
    
    query = Fee.query
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date).date()
            query = query.filter(Fee.due_date >= start)
        except:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date).date()
            query = query.filter(Fee.due_date <= end)
        except:
            pass
    
    if status:
        query = query.filter_by(status=status)
    
    fees = query.all()
    
    # Calculate totals
    total_amount = sum(fee.amount for fee in fees)
    paid_fees = [fee for fee in fees if fee.status == 'paid']
    pending_fees = [fee for fee in fees if fee.status == 'pending']
    overdue_fees = [fee for fee in fees if fee.status == 'overdue']
    
    paid_amount = sum(fee.amount for fee in paid_fees)
    pending_amount = sum(fee.amount for fee in pending_fees)
    overdue_amount = sum(fee.amount for fee in overdue_fees)
    
    return jsonify({
        'fees': [fee.to_dict() for fee in fees],
        'summary': {
            'total_amount': round(total_amount, 2),
            'paid_amount': round(paid_amount, 2),
            'pending_amount': round(pending_amount, 2),
            'overdue_amount': round(overdue_amount, 2),
            'total_count': len(fees),
            'paid_count': len(paid_fees),
            'pending_count': len(pending_fees),
            'overdue_count': len(overdue_fees),
            'collection_rate': round((paid_amount / total_amount * 100) if total_amount > 0 else 0, 2)
        }
    }), 200

@bp.route('/students', methods=['GET'])
@jwt_required()
def get_students_report():
    """Get students statistics report"""
    from flask import current_app
    current_app.logger.info("Generating students statistics report")
    students = Student.query.all()
    
    active_count = len([s for s in students if s.status == 'active'])
    inactive_count = len([s for s in students if s.status == 'inactive'])
    graduated_count = len([s for s in students if s.status == 'graduated'])
    
    return jsonify({
        'total': len(students),
        'active': active_count,
        'inactive': inactive_count,
        'graduated': graduated_count,
        'students': [student.to_dict() for student in students]
    }), 200
