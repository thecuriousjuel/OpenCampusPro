from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Batch, Course, Teacher
from datetime import datetime

bp = Blueprint('batches', __name__, url_prefix='/api/batches')

@bp.route('', methods=['GET'])
@jwt_required()
def get_batches():
    """Get all batches"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    paginated = Batch.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'batches': [batch.to_dict() for batch in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_batch(id):
    """Get a single batch by ID"""
    batch = Batch.query.get(id)
    
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    return jsonify({'batch': batch.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_batch():
    """Create a new batch"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('course_id'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify course exists
    course = Course.query.get(data['course_id'])
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Verify teacher exists if provided
    if data.get('teacher_id'):
        teacher = Teacher.query.get(data['teacher_id'])
        if not teacher:
            return jsonify({'error': 'Teacher not found'}), 404
    
    batch = Batch(
        name=data['name'],
        course_id=data['course_id'],
        teacher_id=data.get('teacher_id'),
        capacity=data.get('capacity', 30)
    )
    
    if data.get('start_date'):
        try:
            batch.start_date = datetime.fromisoformat(data['start_date']).date()
        except:
            pass
    
    if data.get('end_date'):
        try:
            batch.end_date = datetime.fromisoformat(data['end_date']).date()
        except:
            pass
    
    try:
        db.session.add(batch)
        db.session.commit()
        return jsonify({
            'message': 'Batch created successfully',
            'batch': batch.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_batch(id):
    """Update a batch"""
    batch = Batch.query.get(id)
    
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        batch.name = data['name']
    if data.get('course_id'):
        course = Course.query.get(data['course_id'])
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        batch.course_id = data['course_id']
    if 'teacher_id' in data:
        if data['teacher_id']:
            teacher = Teacher.query.get(data['teacher_id'])
            if not teacher:
                return jsonify({'error': 'Teacher not found'}), 404
        batch.teacher_id = data['teacher_id']
    if 'capacity' in data:
        batch.capacity = data['capacity']
    if data.get('start_date'):
        try:
            batch.start_date = datetime.fromisoformat(data['start_date']).date()
        except:
            pass
    if data.get('end_date'):
        try:
            batch.end_date = datetime.fromisoformat(data['end_date']).date()
        except:
            pass
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Batch updated successfully',
            'batch': batch.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_batch(id):
    """Delete a batch"""
    batch = Batch.query.get(id)
    
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404
    
    try:
        db.session.delete(batch)
        db.session.commit()
        return jsonify({'message': 'Batch deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
