# Database Seeding Guide

This directory contains scripts to populate the database with sample data for testing and demonstration purposes.

## Overview

The `seed_database.py` script generates realistic sample data for the Student Management System, including:
- **5 Courses** (CS101-CS501)
- **50 Students** with varied statuses
- **50 Teachers** with different specializations
- **15 Batches** across different courses
- **300 Attendance Records** for students
- **105 Fee Records** with various payment statuses
- **85 Marks Records** with pass/fail distribution

## Prerequisites

Before running the seed script, ensure:

1. **Virtual Environment is Activated**
   ```bash
   cd backend
   source venv/bin/activate  # On macOS/Linux
   # OR
   venv\Scripts\activate     # On Windows
   ```

2. **Required Packages are Installed**
   ```bash
   pip install faker
   ```

## How to Populate the Database

### Method 1: From Backend Directory (Recommended)

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Run the seed script
python test/seed_database.py
```

### Method 2: From Root Directory

```bash
# From project root
cd student-management-cli

# Activate virtual environment
source backend/venv/bin/activate

# Run the seed script
python backend/test/seed_database.py
```

## What the Script Does

### 1. **Clears Existing Data**
- Removes all existing records from all tables
- Ensures a clean slate for seeding

### 2. **Creates Sample Data**

#### Courses (5 records)
- CS101: Introduction to Programming (6 months)
- CS201: Data Structures & Algorithms (6 months)
- CS301: Web Development (4 months)
- CS401: Machine Learning (6 months)
- CS501: Database Management Systems (5 months)

#### Students (50 records)
- Random names using Faker library
- Email format: `student{N}@{domain}`
- Phone numbers (15 chars max)
- Addresses (200 chars max)
- Enrollment dates within last 2 years
- Status distribution: mostly active, some inactive/graduated

#### Teachers (50 records)
- Random names using Faker library
- Email format: `teacher{N}@mycampuspro.edu`
- Specializations: Computer Science, Data Science, Web Development, ML, AI, etc.
- Hire dates within last 5 years

#### Batches (15 records)
- Format: `{COURSE_CODE}-Batch-{N}`
- Assigned to random courses and teachers
- Start dates: last year to next month
- End dates: calculated based on course duration
- Capacity: 20-40 students

#### Attendance (300 records)
- For first 30 students only
- 10 records per student
- Status distribution: mostly present, some absent/late
- Dates within last 6 months

#### Fees (105 records)
- 1-3 fee records per student
- Amounts: ₹5,000 to ₹20,000
- Status distribution: mostly paid, some pending/overdue
- Paid dates only for paid fees (after due date)

#### Marks (85 records)
- For first 40 students
- 1-3 marks per student (different batches)
- 75% pass rate (marks ≥ 40)
- Marks range: 0-100

## Expected Output

When you run the script, you should see:

```
==================================================
Starting database seeding...
==================================================

Clearing existing data...
Database cleared!
Creating 5 courses...
Created 5 courses!
Creating 50 students...
Created 50 students!
Creating 50 teachers...
Created 50 teachers!
Creating 15 batches...
Created 15 batches!
Creating attendance records...
Created 300 attendance records!
Creating fee records...
Created 105 fee records!
Creating marks records...
Created 85 marks records!

==================================================
Database seeding completed successfully!
==================================================

Summary:
  - Courses: 5
  - Students: 50
  - Teachers: 50
  - Batches: 15
  - Attendance Records: 300
  - Fee Records: 105
  - Marks Records: 85
```

## Verifying the Data

After seeding, you can verify the data in several ways:

### 1. **Using the Frontend**
- Start the backend: `python backend/app.py`
- Start the frontend: `cd frontend && npm run dev`
- Login and navigate through different pages

### 2. **Using SQLite Command Line**
```bash
# Open database
sqlite3 instance/student_management.db

# Check record counts
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM teachers;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM batches;
SELECT COUNT(*) FROM attendance;
SELECT COUNT(*) FROM fees;
SELECT COUNT(*) FROM marks;

# Exit
.quit
```

### 3. **Using API Endpoints**
```bash
# Get students
curl http://localhost:5001/api/students

# Get courses
curl http://localhost:5001/api/courses

# Get dashboard stats
curl http://localhost:5001/api/reports/dashboard
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'faker'"
**Solution:**
```bash
source backend/venv/bin/activate
pip install faker
```

### Issue: "No module named 'flask'"
**Solution:** Make sure you're in the virtual environment
```bash
cd backend
source venv/bin/activate
python test/seed_database.py
```

### Issue: Database file not found
**Solution:** The script creates the database automatically. Make sure you're running from the correct directory.

### Issue: Permission denied
**Solution:** Check file permissions
```bash
chmod 644 instance/student_management.db
chmod 755 instance/
```

## Re-seeding the Database

To completely refresh the data:

1. The script automatically clears all existing data
2. Simply run the script again:
   ```bash
   python test/seed_database.py
   ```

## Customizing the Seed Data

You can modify `seed_database.py` to change:
- Number of records (change function parameters)
- Data distributions (modify random choices)
- Date ranges (adjust date generation)
- Sample data values (update data arrays)

## Database Location

The seeded data is stored in:
```
instance/student_management.db
```

This is the same database used by the running application.

## Notes

- **Data is Random**: Each run generates different random data
- **Relationships**: All foreign key relationships are properly maintained
- **Realistic Data**: Uses Faker library for realistic names, emails, etc.
- **Safe to Re-run**: Script clears old data before seeding
- **No User Accounts**: The script doesn't create login users (use registration page)

## Need Help?

If you encounter issues:
1. Check that virtual environment is activated
2. Verify all dependencies are installed
3. Ensure you're running from the correct directory
4. Check the database file permissions
5. Review the error messages for specific issues
