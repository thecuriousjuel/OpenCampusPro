from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Fee, Student
from datetime import datetime, date

bp = Blueprint('fees', __name__, url_prefix='/api/fees')

@bp.route('', methods=['GET'])
@jwt_required()
def get_fees():
    """Get all fee records"""
    from flask import current_app
    student_id = request.args.get('student_id', type=int)
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    current_app.logger.info(f"Fetching fees - Student ID: {student_id}, Status: {status}, Page: {page}")
    
    query = Fee.query
    
    if student_id:
        query = query.filter_by(student_id=student_id)
    if status:
        query = query.filter_by(status=status)
    
    # Update overdue fees
    today = date.today()
    overdue_fees = Fee.query.filter(
        Fee.status == 'pending',
        Fee.due_date < today
    ).all()
    for fee in overdue_fees:
        fee.status = 'overdue'
    db.session.commit()
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'fees': [fee.to_dict() for fee in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_fee(id):
    """Get a single fee record"""
    from flask import current_app
    current_app.logger.info(f"Fetching fee record with ID: {id}")
    fee = Fee.query.get(id)
    
    if not fee:
        current_app.logger.warning(f"Fee record not found: ID {id}")
        return jsonify({'error': 'Fee record not found'}), 404
    
    return jsonify({'fee': fee.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_fee():
    """Create a new fee record"""
    from flask import current_app
    data = request.get_json()
    
    current_app.logger.info(f"Creating new fee record for student ID: {data.get('student_id', 'N/A')}")
    
    if not data or not data.get('student_id') or not data.get('amount') or not data.get('due_date'):
        current_app.logger.warning("Fee creation failed: Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify student exists
    student = Student.query.get(data['student_id'])
    if not student:
        current_app.logger.warning(f"Fee creation failed: Student ID {data['student_id']} not found")
        return jsonify({'error': 'Student not found'}), 404
    
    fee = Fee(
        student_id=data['student_id'],
        amount=data['amount'],
        description=data.get('description'),
        status='pending'
    )
    
    try:
        fee.due_date = datetime.fromisoformat(data['due_date']).date()
    except:
        return jsonify({'error': 'Invalid due date format'}), 400
    
    try:
        db.session.add(fee)
        db.session.commit()
        current_app.logger.info(f"Fee record created successfully: Student ID {fee.student_id}, Amount: {fee.amount} (ID: {fee.id})")
        return jsonify({
            'message': 'Fee record created successfully',
            'fee': fee.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating fee record: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>/pay', methods=['PUT'])
@jwt_required()
def pay_fee(id):
    """Record a fee payment"""
    from flask import current_app
    current_app.logger.info(f"Recording payment for fee ID: {id}")
    fee = Fee.query.get(id)
    
    if not fee:
        current_app.logger.warning(f"Payment failed: Fee record ID {id} not found")
        return jsonify({'error': 'Fee record not found'}), 404
    
    if fee.status == 'paid':
        current_app.logger.warning(f"Payment failed: Fee ID {id} already paid")
        return jsonify({'error': 'Fee already paid'}), 400
    
    data = request.get_json()
    
    fee.status = 'paid'
    fee.paid_date = datetime.utcnow().date()
    
    if data and data.get('paid_date'):
        try:
            fee.paid_date = datetime.fromisoformat(data['paid_date']).date()
        except:
            pass
    
    try:
        db.session.commit()
        current_app.logger.info(f"Payment recorded successfully for fee ID {id}: Student ID {fee.student_id}, Amount: {fee.amount}")
        return jsonify({
            'message': 'Payment recorded successfully',
            'fee': fee.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error recording payment for fee ID {id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_fees(student_id):
    """Get all fees for a student"""
    from flask import current_app
    current_app.logger.info(f"Fetching fees for student ID: {student_id}")
    student = Student.query.get(student_id)
    
    if not student:
        current_app.logger.warning(f"Student not found for fee query: ID {student_id}")
        return jsonify({'error': 'Student not found'}), 404
    
    fees = Fee.query.filter_by(student_id=student_id).all()
    
    # Calculate totals
    total_amount = sum(fee.amount for fee in fees)
    paid_amount = sum(fee.amount for fee in fees if fee.status == 'paid')
    outstanding = total_amount - paid_amount
    
    return jsonify({
        'student': student.to_dict(),
        'fees': [fee.to_dict() for fee in fees],
        'summary': {
            'total_amount': total_amount,
            'paid_amount': paid_amount,
            'outstanding': outstanding
        }
    }), 200

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_fee(id):
    """Delete a fee record"""
    from flask import current_app
    current_app.logger.info(f"Deleting fee record with ID: {id}")
    fee = Fee.query.get(id)
    
    if not fee:
        current_app.logger.warning(f"Fee deletion failed: ID {id} not found")
        return jsonify({'error': 'Fee record not found'}), 404
    
    try:
        fee_amount = fee.amount
        student_id = fee.student_id
        db.session.delete(fee)
        db.session.commit()
        current_app.logger.info(f"Fee record deleted successfully: Student ID {student_id}, Amount: {fee_amount} (ID: {id})")
        return jsonify({'message': 'Fee record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting fee record ID {id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
