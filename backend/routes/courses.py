from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Course

bp = Blueprint('courses', __name__, url_prefix='/api/courses')

@bp.route('', methods=['GET'])
@jwt_required()
def get_courses():
    """Get all courses"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    query = Course.query
    
    if search:
        query = query.filter(
            (Course.name.ilike(f'%{search}%')) |
            (Course.code.ilike(f'%{search}%'))
        )
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'courses': [course.to_dict() for course in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_course(id):
    """Get a single course by ID"""
    course = Course.query.get(id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    return jsonify({'course': course.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_course():
    """Create a new course"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('code'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Course.query.filter_by(code=data['code']).first():
        return jsonify({'error': 'Course code already exists'}), 400
    
    course = Course(
        name=data['name'],
        code=data['code'],
        description=data.get('description'),
        credits=data.get('credits'),
        duration=data.get('duration')
    )
    
    try:
        db.session.add(course)
        db.session.commit()
        return jsonify({
            'message': 'Course created successfully',
            'course': course.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_course(id):
    """Update a course"""
    course = Course.query.get(id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        course.name = data['name']
    if data.get('code'):
        existing = Course.query.filter_by(code=data['code']).first()
        if existing and existing.id != id:
            return jsonify({'error': 'Course code already exists'}), 400
        course.code = data['code']
    if 'description' in data:
        course.description = data['description']
    if 'credits' in data:
        course.credits = data['credits']
    if 'duration' in data:
        course.duration = data['duration']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Course updated successfully',
            'course': course.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_course(id):
    """Delete a course"""
    course = Course.query.get(id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    try:
        db.session.delete(course)
        db.session.commit()
        return jsonify({'message': 'Course deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
