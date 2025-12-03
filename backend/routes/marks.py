from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Mark, Student, Batch
from sqlalchemy import func

bp = Blueprint('marks', __name__, url_prefix='/api/marks')

@bp.route('', methods=['GET'])
@jwt_required()
def get_marks():
    """Get all marks with optional filtering by batch_id or student_id"""
    from flask import current_app
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)
    batch_id = request.args.get('batch_id', type=int)
    student_id = request.args.get('student_id', type=int)
    
    current_app.logger.info(f"Fetching marks - Batch ID: {batch_id}, Student ID: {student_id}, Page: {page}")
    
    query = Mark.query
    
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    if student_id:
        query = query.filter_by(student_id=student_id)
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'marks': [mark.to_dict() for mark in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_mark(id):
    """Get a single mark by ID"""
    from flask import current_app
    current_app.logger.info(f"Fetching mark with ID: {id}")
    mark = Mark.query.get(id)
    
    if not mark:
        current_app.logger.warning(f"Mark not found: ID {id}")
        return jsonify({'error': 'Mark not found'}), 404
    
    return jsonify({'mark': mark.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_mark():
    """Create a new mark"""
    from flask import current_app
    data = request.get_json()
    
    current_app.logger.info(f"Creating new mark: Student ID {data.get('student_id')}, Batch ID {data.get('batch_id')}")
    
    if not data or not data.get('student_id') or not data.get('batch_id') or data.get('marks_obtained') is None:
        current_app.logger.warning("Mark creation failed: Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate marks range
    marks = float(data['marks_obtained'])
    if marks < 0 or marks > 100:
        current_app.logger.warning(f"Mark creation failed: Invalid marks value {marks}")
        return jsonify({'error': 'Marks must be between 0 and 100'}), 400
    
    # Check if student exists
    student = Student.query.get(data['student_id'])
    if not student:
        current_app.logger.warning(f"Mark creation failed: Student ID {data['student_id']} not found")
        return jsonify({'error': 'Student not found'}), 404
    
    # Check if batch exists
    batch = Batch.query.get(data['batch_id'])
    if not batch:
        current_app.logger.warning(f"Mark creation failed: Batch ID {data['batch_id']} not found")
        return jsonify({'error': 'Batch not found'}), 404
    
    # Check if mark already exists for this student-batch combination
    existing_mark = Mark.query.filter_by(
        student_id=data['student_id'],
        batch_id=data['batch_id']
    ).first()
    
    if existing_mark:
        current_app.logger.warning(f"Mark creation failed: Mark already exists for Student ID {data['student_id']} in Batch ID {data['batch_id']}")
        return jsonify({'error': 'Mark already exists for this student in this batch'}), 400
    
    mark = Mark(
        student_id=data['student_id'],
        batch_id=data['batch_id'],
        marks_obtained=marks
    )
    
    try:
        db.session.add(mark)
        db.session.commit()
        current_app.logger.info(f"Mark created successfully: Student ID {mark.student_id}, Batch ID {mark.batch_id}, Marks: {mark.marks_obtained} (ID: {mark.id})")
        return jsonify({
            'message': 'Mark created successfully',
            'mark': mark.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating mark: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_mark(id):
    """Update a mark"""
    from flask import current_app
    current_app.logger.info(f"Updating mark with ID: {id}")
    mark = Mark.query.get(id)
    
    if not mark:
        current_app.logger.warning(f"Mark update failed: ID {id} not found")
        return jsonify({'error': 'Mark not found'}), 404
    
    data = request.get_json()
    
    if data.get('marks_obtained') is not None:
        marks = float(data['marks_obtained'])
        if marks < 0 or marks > 100:
            return jsonify({'error': 'Marks must be between 0 and 100'}), 400
        mark.marks_obtained = marks
    
    try:
        db.session.commit()
        current_app.logger.info(f"Mark updated successfully: ID {mark.id}, New marks: {mark.marks_obtained}")
        return jsonify({
            'message': 'Mark updated successfully',
            'mark': mark.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating mark ID {id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_mark(id):
    """Delete a mark"""
    from flask import current_app
    current_app.logger.info(f"Deleting mark with ID: {id}")
    mark = Mark.query.get(id)
    
    if not mark:
        current_app.logger.warning(f"Mark deletion failed: ID {id} not found")
        return jsonify({'error': 'Mark not found'}), 404
    
    try:
        student_id = mark.student_id
        batch_id = mark.batch_id
        marks_obtained = mark.marks_obtained
        db.session.delete(mark)
        db.session.commit()
        current_app.logger.info(f"Mark deleted successfully: Student ID {student_id}, Batch ID {batch_id}, Marks: {marks_obtained} (ID: {id})")
        return jsonify({'message': 'Mark deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting mark ID {id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get marks analytics - pass/fail counts and median marks"""
    from flask import current_app
    batch_id = request.args.get('batch_id', type=int)
    
    current_app.logger.info(f"Fetching marks analytics - Batch ID: {batch_id}")
    
    query = Mark.query
    
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    
    marks = query.all()
    
    if not marks:
        return jsonify({
            'total_students': 0,
            'passed': 0,
            'failed': 0,
            'median_marks': 0
        }), 200
    
    # Calculate pass/fail counts
    passed = sum(1 for mark in marks if mark.marks_obtained >= 40)
    failed = len(marks) - passed
    
    # Calculate median
    marks_list = sorted([mark.marks_obtained for mark in marks])
    n = len(marks_list)
    if n % 2 == 0:
        median = (marks_list[n//2 - 1] + marks_list[n//2]) / 2
    else:
        median = marks_list[n//2]
    
    return jsonify({
        'total_students': len(marks),
        'passed': passed,
        'failed': failed,
        'median_marks': round(median, 2)
    }), 200
