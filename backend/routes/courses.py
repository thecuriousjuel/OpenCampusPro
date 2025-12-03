from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Course

bp = Blueprint('courses', __name__, url_prefix='/api/courses')

@bp.route('', methods=['GET'])
@jwt_required()
def get_courses():
    """Get all courses"""
    from flask import current_app
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    current_app.logger.info(f"Fetching courses - Page: {page}, Per page: {per_page}, Search: '{search}'")
    
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
    from flask import current_app
    current_app.logger.info(f"Fetching course with ID: {id}")
    course = Course.query.get(id)
    
    if not course:
        current_app.logger.warning(f"Course not found: ID {id}")
        return jsonify({'error': 'Course not found'}), 404
    
    return jsonify({'course': course.to_dict()}), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_course():
    """Create a new course"""
    from flask import current_app
    data = request.get_json()
    
    current_app.logger.info(f"Creating new course: {data.get('name', 'N/A')} ({data.get('code', 'N/A')})")
    
    if not data or not data.get('name') or not data.get('code'):
        current_app.logger.warning("Course creation failed: Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Course.query.filter_by(code=data['code']).first():
        current_app.logger.warning(f"Course creation failed: Code '{data['code']}' already exists")
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
        current_app.logger.info(f"Course created successfully: {course.name} (ID: {course.id})")
        return jsonify({
            'message': 'Course created successfully',
            'course': course.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating course '{data.get('name')}': {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_course(id):
    """Update a course"""
    from flask import current_app
    current_app.logger.info(f"Updating course with ID: {id}")
    course = Course.query.get(id)
    
    if not course:
        current_app.logger.warning(f"Course update failed: ID {id} not found")
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
        current_app.logger.info(f"Course updated successfully: {course.name} (ID: {course.id})")
        return jsonify({
            'message': 'Course updated successfully',
            'course': course.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating course ID {id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_course(id):
    """Delete a course"""
    from flask import current_app
    current_app.logger.info(f"Deleting course with ID: {id}")
    course = Course.query.get(id)
    
    if not course:
        current_app.logger.warning(f"Course deletion failed: ID {id} not found")
        return jsonify({'error': 'Course not found'}), 404
    
    try:
        course_name = course.name
        db.session.delete(course)
        db.session.commit()
        current_app.logger.info(f"Course deleted successfully: {course_name} (ID: {id})")
        return jsonify({'message': 'Course deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting course ID {id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
