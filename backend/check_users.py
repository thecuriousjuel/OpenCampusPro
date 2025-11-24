import sys
sys.path.insert(0, '/Users/biswajitbasak/Programming/Student Management System/backend')

from app import app, db
from models import User

with app.app_context():
    users = User.query.all()
    
    if users:
        print("Existing users in database:")
        print("-" * 50)
        for user in users:
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print("-" * 50)
    else:
        print("No users found in database")
