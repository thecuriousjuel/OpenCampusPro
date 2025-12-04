import sys
import os

# Add parent directory to path to import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, db
from models import User, Student, Teacher, Course, Batch, Attendance, Fee, Mark
from datetime import datetime, timedelta
import random
from faker import Faker

fake = Faker()

def clear_database():
    """Clear all existing data"""
    with app.app_context():
        print("Clearing existing data...")
        Mark.query.delete()
        Fee.query.delete()
        Attendance.query.delete()
        Batch.query.delete()
        Course.query.delete()
        Teacher.query.delete()
        Student.query.delete()
        User.query.delete()
        db.session.commit()
        print("Database cleared!")

def seed_courses(count=5):
    """Create sample courses"""
    courses = []
    course_data = [
        {"code": "CS101", "name": "Introduction to Programming", "description": "Learn the basics of programming with Python", "credits": 4, "duration": "6"},
        {"code": "CS201", "name": "Data Structures & Algorithms", "description": "Master fundamental data structures and algorithms", "credits": 4, "duration": "6"},
        {"code": "CS301", "name": "Web Development", "description": "Build modern web applications", "credits": 3, "duration": "4"},
        {"code": "CS401", "name": "Machine Learning", "description": "Introduction to ML and AI concepts", "credits": 4, "duration": "6"},
        {"code": "CS501", "name": "Database Management Systems", "description": "Learn SQL and database design", "credits": 3, "duration": "5"},
    ]
    
    print(f"Creating {count} courses...")
    for i in range(count):
        data = course_data[i]
        course = Course(
            code=data["code"],
            name=data["name"],
            description=data["description"],
            credits=data["credits"],
            duration=data["duration"]
        )
        db.session.add(course)
        courses.append(course)
    
    db.session.commit()
    print(f"Created {count} courses!")
    return courses

def seed_students(count=50):
    """Create sample students"""
    students = []
    statuses = ['active', 'active', 'active', 'active', 'inactive', 'graduated']
    
    print(f"Creating {count} students...")
    for i in range(count):
        student = Student(
            name=fake.name(),
            email=f"student{i+1}@{fake.free_email_domain()}",
            phone=fake.phone_number()[:15],
            address=fake.address()[:200],  # Limit address length
            enrollment_date=fake.date_between(start_date='-2y', end_date='today'),
            status=random.choice(statuses)
        )
        db.session.add(student)
        students.append(student)
    
    db.session.commit()
    print(f"Created {count} students!")
    return students

def seed_teachers(count=50):
    """Create sample teachers"""
    teachers = []
    specializations = [
        "Computer Science", "Data Science", "Web Development", 
        "Machine Learning", "Artificial Intelligence", "Software Engineering",
        "Database Administration", "Cloud Computing", "Cybersecurity"
    ]
    
    print(f"Creating {count} teachers...")
    for i in range(count):
        teacher = Teacher(
            name=fake.name(),
            email=f"teacher{i+1}@mycampuspro.edu",
            phone=fake.phone_number()[:15],
            specialization=random.choice(specializations),
            hire_date=fake.date_between(start_date='-5y', end_date='today')
        )
        db.session.add(teacher)
        teachers.append(teacher)
    
    db.session.commit()
    print(f"Created {count} teachers!")
    return teachers

def seed_batches(courses, teachers, count=15):
    """Create sample batches"""
    batches = []
    
    print(f"Creating {count} batches...")
    for i in range(count):
        course = random.choice(courses)
        teacher = random.choice(teachers)
        start_date = fake.date_between(start_date='-1y', end_date='+30d')
        end_date = start_date + timedelta(days=int(course.duration) * 30)
        
        batch = Batch(
            name=f"{course.code}-Batch-{i+1}",
            course_id=course.id,
            teacher_id=teacher.id,
            start_date=start_date,
            end_date=end_date,
            capacity=random.randint(20, 40)
        )
        db.session.add(batch)
        batches.append(batch)
    
    db.session.commit()
    print(f"Created {count} batches!")
    return batches

def assign_batches_to_students(students, batches):
    """Assign batches to students"""
    print(f"Assigning batches to students...")
    count = 0
    
    # Assign batches to 70% of students (leave 30% without batches)
    students_to_assign = int(len(students) * 0.7)
    
    for student in students[:students_to_assign]:
        # Assign a random batch
        student.batch_id = random.choice(batches).id
        count += 1
    
    db.session.commit()
    print(f"Assigned batches to {count} students!")

def seed_attendance(students, batches, records_per_student=10):
    """Create attendance records"""
    statuses = ['present', 'present', 'present', 'present', 'absent', 'late']
    
    print(f"Creating attendance records...")
    count = 0
    for student in students[:30]:  # Only for first 30 students
        batch = random.choice(batches)
        for _ in range(records_per_student):
            attendance = Attendance(
                student_id=student.id,
                batch_id=batch.id,
                date=fake.date_between(start_date='-6m', end_date='today'),
                status=random.choice(statuses)
            )
            db.session.add(attendance)
            count += 1
    
    db.session.commit()
    print(f"Created {count} attendance records!")

def seed_fees(students):
    """Create fee records"""
    statuses = ['paid', 'paid', 'paid', 'pending', 'overdue']
    
    print(f"Creating fee records...")
    count = 0
    for student in students:
        num_fees = random.randint(1, 3)
        for _ in range(num_fees):
            amount = random.choice([5000, 7500, 10000, 15000, 20000])
            due_date = fake.date_between(start_date='-1y', end_date='+3m')
            status = random.choice(statuses)
            
            # Only set paid_date for paid fees, and make sure it's after due_date
            if status == 'paid':
                paid_date = fake.date_between(start_date=due_date, end_date='today')
            else:
                paid_date = None
            
            fee = Fee(
                student_id=student.id,
                amount=amount,
                due_date=due_date,
                paid_date=paid_date,
                status=status,
                description=f"Tuition Fee - {fake.month_name()}"
            )
            db.session.add(fee)
            count += 1
    
    db.session.commit()
    print(f"Created {count} fee records!")

def seed_marks(students, batches):
    """Create marks records"""
    print(f"Creating marks records...")
    count = 0
    
    # Create marks for first 40 students
    for student in students[:40]:
        # Each student gets marks for 1-3 batches
        num_batches = random.randint(1, 3)
        student_batches = random.sample(batches, min(num_batches, len(batches)))
        
        for batch in student_batches:
            # Generate marks with higher probability of passing
            if random.random() < 0.75:  # 75% pass rate
                marks_obtained = random.uniform(40, 100)
            else:
                marks_obtained = random.uniform(0, 39)
            
            mark = Mark(
                student_id=student.id,
                batch_id=batch.id,
                marks_obtained=round(marks_obtained, 2)
            )
            db.session.add(mark)
            count += 1
    
    db.session.commit()
    print(f"Created {count} marks records!")

def seed_users(count=5):
    """Create sample users"""
    users = []
    
    print(f"Creating users...")
    
    # Create Admin User
    admin = User(
        username="admin",
        email="admin@school.edu",
        role="admin"
    )
    admin.set_password("admin123")
    db.session.add(admin)
    users.append(admin)
    
    # Create Staff User
    staff = User(
        username="staff",
        email="staff@school.edu",
        role="staff"
    )
    staff.set_password("staff123")
    db.session.add(staff)
    users.append(staff)
    
    # Create random staff users
    for i in range(count):
        user = User(
            username=fake.user_name(),
            email=fake.email(),
            role="staff"
        )
        user.set_password("password123")
        db.session.add(user)
        users.append(user)
    
    db.session.commit()
    print(f"Created {len(users)} users!")
    return users

def main():
    """Run all seed functions"""
    with app.app_context():
        print("\n" + "="*50)
        print("Starting database seeding...")
        print("="*50 + "\n")
        
        # Clear existing data
        clear_database()
        
        # Seed data in order
        courses = seed_courses(5)
        students = seed_students(50)
        teachers = seed_teachers(50)
        batches = seed_batches(courses, teachers, 15)
        assign_batches_to_students(students, batches)  # NEW: Assign batches to students
        seed_attendance(students, batches)
        seed_fees(students)
        seed_marks(students, batches)
        seed_users()
        
        print("\n" + "="*50)
        print("Database seeding completed successfully!")
        print("="*50)
        print(f"\nSummary:")
        print(f"  - Courses: {Course.query.count()}")
        print(f"  - Students: {Student.query.count()}")
        print(f"  - Teachers: {Teacher.query.count()}")
        print(f"  - Batches: {Batch.query.count()}")
        print(f"  - Attendance Records: {Attendance.query.count()}")
        print(f"  - Fee Records: {Fee.query.count()}")
        print(f"  - Marks Records: {Mark.query.count()}")
        print(f"  - Users: {User.query.count()}")
        print()

if __name__ == '__main__':
    main()
