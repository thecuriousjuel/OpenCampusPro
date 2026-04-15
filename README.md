# Student Management System

A comprehensive web-based Student Management System built with Flask (Backend) and React (Frontend). This system provides tools for managing students, teachers, courses, batches, attendance, and fees.

## 📋 Features

- **User Authentication**: Secure JWT-based authentication with admin and staff roles
- **Student Management**: Add, edit, view, and delete student records with standardized IDs (STUD-xxxx)
- **Teacher Management**: Manage teacher profiles and assignments with standardized IDs (TEAC-xxxx)
- **Course Management**: Create and manage courses with codes, credits, and duration
- **Batch Management**: Organize students into batches with assigned teachers and courses
- **Attendance Tracking**: Record and monitor student attendance
- **Fee Management**: Track fee payments, due dates, and payment status
- **Reports**: Generate comprehensive reports for students, attendance, and fees
- **Search & Filtering**: Enhanced search capabilities across modules using Name, Email, or ID
- **Custom UI Components**: Toast notifications and confirmation dialogs

## 🏗️ Architecture

The system follows a three-tier architecture:
- **Frontend**: React with Vite, React Router, and Context API
- **Backend**: Flask REST API with JWT authentication
- **Database**: SQLite with SQLAlchemy ORM

For detailed architecture diagrams, see [diagrams.md](diagrams.md).

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

The backend server will start at `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🐳 Docker Guide (Build, Export, and Run)

You can containerize the entire system and easily run it anywhere or export the images to share.

### 1. Building the Images

Run the following commands from the root directory to build the images for both frontend and backend manually:

```bash
docker build -t sms-backend ./backend
docker build -t sms-frontend ./frontend
```

*(Alternatively, you can just use `docker-compose up --build -d` to build and run them all at once!)*

### 2. Exporting the Images (Optional)

If you need to deploy the application on a completely different machine, you can export these images as `.tar` files right after building them:

```bash
docker save -o sms-backend.tar sms-backend
docker save -o sms-frontend.tar sms-frontend
```

### 3. Loading and Running Exported Images

When you transfer the `.tar` files to your target machine, import them into Docker:

```bash
docker load -i sms-backend.tar
docker load -i sms-frontend.tar
```

Once loaded, start the application containers directly with these commands:

**Start the API (Backend):**
```bash
docker run -d --name my-sms-backend -p 5001:5001 -v sms_backend_data:/instance sms-backend
```
*(This maps the port to 5001 and creates a volume to preserve your SQLite database.)*

**Start the Website (Frontend):**
```bash
docker run -d --name my-sms-frontend -p 5173:5173 sms-frontend
```

You can then view the user interface at `http://localhost:5173`!

## 📁 Project Structure

```
student-management-cli/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── models.py              # SQLAlchemy database models
│   ├── routes/                # API route handlers
│   │   ├── auth.py
│   │   ├── students.py
│   │   ├── teachers.py
│   │   ├── courses.py
│   │   ├── batches.py
│   │   ├── attendance.py
│   │   ├── fees.py
│   │   └── reports.py
│   └── instance/              # SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main application component
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   └── context/           # React Context providers
│   └── public/                # Static assets
│
├── diagrams.md                # System architecture diagrams
└── README.md                  # This file
```

## 🗄️ Database Models

- **User**: Admin and staff users with authentication
- **Student**: Student records with enrollment details
- **Teacher**: Teacher profiles with specialization
- **Course**: Course information with credits and duration
- **Batch**: Course batches with teacher assignments
- **Attendance**: Student attendance records
- **Fee**: Fee payment tracking

## 🔐 Default Credentials

After initial setup, you may need to create an admin user. Use the backend scripts:

```bash
cd backend
python check_users.py  # Check existing users
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/students/<id>` - Get student details
- `PUT /api/students/<id>` - Update student
- `DELETE /api/students/<id>` - Delete student

### Teachers
- `GET /api/teachers` - List all teachers
- `POST /api/teachers` - Create new teacher
- `PUT /api/teachers/<id>` - Update teacher
- `DELETE /api/teachers/<id>` - Delete teacher

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/<id>` - Update course
- `DELETE /api/courses/<id>` - Delete course

### Batches
- `GET /api/batches` - List all batches
- `POST /api/batches` - Create new batch
- `PUT /api/batches/<id>` - Update batch
- `DELETE /api/batches/<id>` - Delete batch

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Record attendance
- `PUT /api/attendance/<id>` - Update attendance

### Fees
- `GET /api/fees` - List fee records
- `POST /api/fees` - Create fee record
- `PUT /api/fees/<id>` - Update fee (payment)
- `GET /api/fees/student/<id>` - Get student fees

### Reports
- `GET /api/reports/students` - Student statistics
- `GET /api/reports/attendance` - Attendance reports
- `GET /api/reports/fees` - Fee collection reports

## 🎨 Technologies Used

### Backend
- Flask - Web framework
- Flask-SQLAlchemy - ORM
- Flask-JWT-Extended - JWT authentication
- Flask-CORS - Cross-origin support
- Werkzeug - Password hashing

### Frontend
- React - UI library
- Vite - Build tool
- React Router - Routing
- Context API - State management
- CSS3 - Styling

## 📊 Documentation

- **Architecture Diagrams**: See [diagrams.md](diagrams.md) for:
  - High-Level Architecture
  - Database Schema (Class Diagram)
  - Component Hierarchy
  - Data Flow Diagrams
  - Sequence Diagrams

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is available for educational and personal use.

## 🐛 Known Issues & Future Enhancements

- Add email notifications for fee due dates
- Implement advanced search and filtering
- Add export functionality for reports (PDF/Excel)
- Implement role-based access control (RBAC)
- Add batch enrollment for students

## 📞 Support

For issues and questions, please open an issue in the repository.