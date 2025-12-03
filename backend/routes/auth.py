from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from datetime import datetime

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    from flask import current_app
    data = request.get_json()
    
    current_app.logger.info(f"Registration attempt for username: {data.get('username', 'N/A')}")
    
    # Validate required fields
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        current_app.logger.warning(f"Registration failed: Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        current_app.logger.warning(f"Registration failed: Username '{data['username']}' already exists")
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        current_app.logger.warning(f"Registration failed: Email '{data['email']}' already exists")
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'admin')
    )
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        
        current_app.logger.info(f"User registered successfully: {user.username} (ID: {user.id})")
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
    except Exception as e:
        db.session.rollback()
        error_message = 'Registration failed. Please try again later.'
        
        # Check for specific error types
        if 'unique constraint' in str(e).lower() or 'already exists' in str(e).lower():
            error_message = 'Username or email already exists.'
        
        # Log the actual error for debugging
        current_app.logger.error(f"Registration error for user '{data.get('username')}': {str(e)}", exc_info=True)
        
        return jsonify({'error': error_message}), 500

@bp.route('/login', methods=['POST'])
def login():
    """User login"""
    from flask import current_app
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        current_app.logger.warning("Login attempt with missing credentials")
        return jsonify({'error': 'Missing username or password'}), 400
    
    current_app.logger.info(f"Login attempt for username: {data['username']}")
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        current_app.logger.warning(f"Failed login attempt for username: {data['username']}")
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create access token
    access_token = create_access_token(identity=str(user.id))
    
    current_app.logger.info(f"Successful login for user: {user.username} (ID: {user.id})")
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    from flask import current_app
    user_id = get_jwt_identity()
    current_app.logger.info(f"User logged out: ID {user_id}")
    return jsonify({'message': 'Logout successful'}), 200
