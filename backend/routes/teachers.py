from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Teacher, Student
from datetime import datetime

bp = Blueprint('teachers', __name__, url_prefix='/api/teachers')

@bp.route('', methods=['GET'])
@jwt_required()
def get_teachers():
    """Get all teachers"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    query = Teacher.query
    
    if search:
        query = query.filter(
            (Teacher.name.ilike(f'%{search}%')) |
            (Teacher.email.ilike(f'%{search}%')) |
            (Teacher.specialization.ilike(f'%{search}%'))
        )
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'teachers': [teacher.to_dict() for teacher in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_teacher(id):
    """Get a single teacher by ID"""
    teacher = Teacher.query.get(id)
    
    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404
    
    return jsonify({'teacher': teacher.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_teacher():
    """Create a new teacher"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if email already exists in teachers table
    if Teacher.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Check if email already exists in students table
    if Student.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    teacher = Teacher(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        specialization=data.get('specialization')
    )
    
    if data.get('hire_date'):
        try:
            teacher.hire_date = datetime.fromisoformat(data['hire_date']).date()
        except:
            pass
    
    try:
        db.session.add(teacher)
        db.session.commit()
        return jsonify({
            'message': 'Teacher created successfully',
            'teacher': teacher.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_teacher(id):
    """Update a teacher"""
    teacher = Teacher.query.get(id)
    
    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        teacher.name = data['name']
    if data.get('email'):
        # Check if new email already exists in teachers table
        existing = Teacher.query.filter_by(email=data['email']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Email already exists'}), 400
        
        # Check if new email already exists in students table
        if Student.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        teacher.email = data['email']
    if 'phone' in data:
        teacher.phone = data['phone']
    if 'specialization' in data:
        teacher.specialization = data['specialization']
    if data.get('hire_date'):
        try:
            teacher.hire_date = datetime.fromisoformat(data['hire_date']).date()
        except:
            pass
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Teacher updated successfully',
            'teacher': teacher.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_teacher(id):
    """Delete a teacher"""
    teacher = Teacher.query.get(id)
    
    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404
    
    try:
        db.session.delete(teacher)
        db.session.commit()
        return jsonify({'message': 'Teacher deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
