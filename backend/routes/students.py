from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Student
from datetime import datetime

bp = Blueprint('students', __name__, url_prefix='/api/students')

@bp.route('', methods=['GET'])
@jwt_required()
def get_students():
    """Get all students with optional search and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    query = Student.query
    
    if search:
        query = query.filter(
            (Student.name.ilike(f'%{search}%')) |
            (Student.email.ilike(f'%{search}%'))
        )
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'students': [student.to_dict() for student in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_student(id):
    """Get a single student by ID"""
    student = Student.query.get(id)
    
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    return jsonify({'student': student.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_student():
    """Create a new student"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if email already exists
    if Student.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    student = Student(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        address=data.get('address'),
        status=data.get('status', 'active')
    )
    
    if data.get('enrollment_date'):
        try:
            student.enrollment_date = datetime.fromisoformat(data['enrollment_date']).date()
        except:
            pass
    
    try:
        db.session.add(student)
        db.session.commit()
        return jsonify({
            'message': 'Student created successfully',
            'student': student.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_student(id):
    """Update a student"""
    student = Student.query.get(id)
    
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        student.name = data['name']
    if data.get('email'):
        # Check if new email already exists
        existing = Student.query.filter_by(email=data['email']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Email already exists'}), 400
        student.email = data['email']
    if 'phone' in data:
        student.phone = data['phone']
    if 'address' in data:
        student.address = data['address']
    if data.get('status'):
        student.status = data['status']
    if data.get('enrollment_date'):
        try:
            student.enrollment_date = datetime.fromisoformat(data['enrollment_date']).date()
        except:
            pass
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Student updated successfully',
            'student': student.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_student(id):
    """Delete a student"""
    student = Student.query.get(id)
    
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({'message': 'Student deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
