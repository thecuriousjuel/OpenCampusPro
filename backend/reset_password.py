import sys
sys.path.insert(0, '/Users/biswajitbasak/Programming/Student Management System/backend')

from app import app, db
from models import User

with app.app_context():
    # Find the user
    user = User.query.filter_by(username='biswajit').first()
    
    if user:
        # Reset password to 'admin123'
        user.set_password('admin123')
        db.session.commit()
        print("✅ Password reset successful!")
        print(f"Username: {user.username}")
        print(f"New Password: admin123")
        print("\nYou can now login with these credentials.")
    else:
        print("User not found")
