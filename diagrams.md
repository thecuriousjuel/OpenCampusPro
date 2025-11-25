# Student Management System - Architecture Diagrams

This document contains comprehensive diagrams that document the architecture, components, data flow, and key processes of the Student Management System.

---

## 1. High-Level Architecture Diagram

This diagram shows the overall system architecture with the three main layers: Frontend (React), Backend (Flask), and Database (SQLite).

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>Vite + React Router]
    end
    
    subgraph "Application Layer"
        API[Flask REST API<br/>Backend Server]
        Auth[Authentication<br/>JWT Tokens]
    end
    
    subgraph "Data Layer"
        DB[(SQLite Database<br/>SQLAlchemy ORM)]
    end
    
    UI -->|HTTP/REST API| API
    API -->|JWT Auth| Auth
    API -->|CRUD Operations| DB
    Auth -.->|Validates| API
    
    style UI fill:#61dafb,stroke:#333,stroke-width:2px
    style API fill:#90EE90,stroke:#333,stroke-width:2px
    style Auth fill:#FFD700,stroke:#333,stroke-width:2px
    style DB fill:#FF6347,stroke:#333,stroke-width:2px
```

---

## 2. Low-Level Diagrams

### 2.1. Backend Class Diagram (Database Models)

This diagram shows all SQLAlchemy models and their relationships in the backend.

```mermaid
classDiagram
    class User {
        +Integer id
        +String username
        +String email
        +String password_hash
        +String role
        +DateTime created_at
        +set_password(password)
        +check_password(password)
        +to_dict()
    }
    
    class Student {
        +Integer id
        +String name
        +String email
        +String phone
        +Text address
        +Date enrollment_date
        +String status
        +to_dict()
    }
    
    class Teacher {
        +Integer id
        +String name
        +String email
        +String phone
        +String specialization
        +Date hire_date
        +to_dict()
    }
    
    class Course {
        +Integer id
        +String name
        +String code
        +Text description
        +Integer credits
        +String duration
        +to_dict()
    }
    
    class Batch {
        +Integer id
        +String name
        +Integer course_id
        +Integer teacher_id
        +Date start_date
        +Date end_date
        +Integer capacity
        +to_dict()
    }
    
    class Attendance {
        +Integer id
        +Integer student_id
        +Integer batch_id
        +Date date
        +String status
        +to_dict()
    }
    
    class Fee {
        +Integer id
        +Integer student_id
        +Float amount
        +Date due_date
        +Date paid_date
        +String status
        +String description
        +to_dict()
    }
    
    Student "1" --o "*" Attendance : has
    Student "1" --o "*" Fee : has
    Batch "1" --o "*" Attendance : tracks
    Course "1" --o "*" Batch : offers
    Teacher "1" --o "*" Batch : teaches
```

### 2.2. Frontend Component Diagram

This diagram shows the structure of React components and pages in the frontend.

```mermaid
graph TB
    subgraph "Main Application"
        App[App.jsx<br/>Router & Auth Context]
    end
    
    subgraph "Context Providers"
        AuthContext[AuthContext<br/>User Authentication State]
    end
    
    subgraph "Pages"
        Login[Login Page]
        Dashboard[Dashboard Page]
        Students[Students Page]
        Teachers[Teachers Page]
        Courses[Courses Page]
        Batches[Batches Page]
        Attendance[Attendance Page]
        Fees[Fees Page]
        Reports[Reports Page]
    end
    
    subgraph "Shared Components"
        Navbar[Navbar Component]
        Sidebar[Sidebar Component]
        ProtectedRoute[ProtectedRoute HOC]
        Toast[Toast Notifications]
        Dialog[Custom Dialogs]
    end
    
    App --> AuthContext
    App --> ProtectedRoute
    ProtectedRoute --> Dashboard
    ProtectedRoute --> Students
    ProtectedRoute --> Teachers
    ProtectedRoute --> Courses
    ProtectedRoute --> Batches
    ProtectedRoute --> Attendance
    ProtectedRoute --> Fees
    ProtectedRoute --> Reports
    
    Dashboard --> Navbar
    Dashboard --> Sidebar
    Students --> Navbar
    Students --> Sidebar
    Students --> Toast
    Students --> Dialog
    
    style App fill:#61dafb,stroke:#333,stroke-width:2px
    style AuthContext fill:#FFD700,stroke:#333,stroke-width:2px
    style ProtectedRoute fill:#90EE90,stroke:#333,stroke-width:2px
```

---

## 3. Data Flow Diagrams (DFD)

### 3.1. Level 0 - System Context Diagram

```mermaid
graph LR
    Admin[Admin User]
    Staff[Staff User]
    
    subgraph "Student Management System"
        SMS[Student Management<br/>System]
    end
    
    Admin -->|Login, Manage Users| SMS
    Staff -->|Manage Students,<br/>Courses, Fees| SMS
    SMS -->|Reports, Notifications| Admin
    SMS -->|Student Records,<br/>Fee Status| Staff
    
    style SMS fill:#90EE90,stroke:#333,stroke-width:3px
```

### 3.2. Level 1 - Detailed Data Flow

```mermaid
graph TB
    User[User]
    
    subgraph "Student Management System"
        Auth[Authentication<br/>Module]
        StudentMgmt[Student<br/>Management]
        CourseMgmt[Course & Batch<br/>Management]
        FeeMgmt[Fee<br/>Management]
        AttendanceMgmt[Attendance<br/>Management]
        ReportGen[Report<br/>Generator]
    end
    
    DB[(Database)]
    
    User -->|Login Credentials| Auth
    Auth -->|JWT Token| User
    Auth -->|Validate| StudentMgmt
    Auth -->|Validate| CourseMgmt
    Auth -->|Validate| FeeMgmt
    Auth -->|Validate| AttendanceMgmt
    
    User -->|Student Data| StudentMgmt
    StudentMgmt -->|Store/Retrieve| DB
    StudentMgmt -->|Student List| User
    
    User -->|Course/Batch Data| CourseMgmt
    CourseMgmt -->|Store/Retrieve| DB
    CourseMgmt -->|Course List| User
    
    User -->|Fee Records| FeeMgmt
    FeeMgmt -->|Store/Retrieve| DB
    FeeMgmt -->|Payment Status| User
    
    User -->|Attendance Data| AttendanceMgmt
    AttendanceMgmt -->|Store/Retrieve| DB
    AttendanceMgmt -->|Attendance Report| User
    
    User -->|Request Reports| ReportGen
    ReportGen -->|Query Data| DB
    ReportGen -->|Generated Reports| User
    
    style Auth fill:#FFD700,stroke:#333,stroke-width:2px
    style DB fill:#FF6347,stroke:#333,stroke-width:2px
```

---

## 4. Sequence Diagrams

### 4.1. Login Process

This sequence diagram shows the detailed flow of user authentication.

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as Flask Backend
    participant Auth as Auth Module
    participant DB as Database
    
    User->>UI: Enter credentials
    UI->>UI: Validate input
    UI->>API: POST /api/auth/login<br/>{username, password}
    API->>Auth: Authenticate user
    Auth->>DB: Query user by username
    DB-->>Auth: User record
    Auth->>Auth: Verify password hash
    
    alt Authentication Success
        Auth->>Auth: Generate JWT token
        Auth-->>API: Token + user data
        API-->>UI: 200 OK<br/>{token, user}
        UI->>UI: Store token in localStorage
        UI->>UI: Update AuthContext
        UI-->>User: Redirect to Dashboard
    else Authentication Failure
        Auth-->>API: Invalid credentials
        API-->>UI: 401 Unauthorized
        UI-->>User: Show error message
    end
```

### 4.2. Add Student Process

This sequence diagram shows the flow of adding a new student record.

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant Toast as Toast Notifications
    participant API as Flask Backend
    participant Auth as Auth Middleware
    participant DB as Database
    
    User->>UI: Click "Add Student"
    UI->>UI: Show student form
    User->>UI: Fill student details<br/>(name, email, phone, address)
    User->>UI: Click "Submit"
    
    UI->>UI: Validate form data
    
    alt Validation Fails
        UI->>Toast: Show error toast
        Toast-->>User: Display validation errors
    else Validation Success
        UI->>API: POST /api/students<br/>{name, email, phone, address}<br/>Header: Authorization: Bearer token
        API->>Auth: Verify JWT token
        
        alt Token Invalid
            Auth-->>API: 401 Unauthorized
            API-->>UI: 401 Response
            UI-->>User: Redirect to login
        else Token Valid
            Auth->>API: Token verified
            API->>DB: Check if email exists
            
            alt Email Exists
                DB-->>API: Email found
                API-->>UI: 400 Bad Request<br/>"Email already exists"
                UI->>Toast: Show error toast
                Toast-->>User: Display error
            else Email Unique
                DB-->>API: Email available
                API->>DB: INSERT student record
                DB-->>API: Student created
                API-->>UI: 201 Created<br/>{student data}
                UI->>Toast: Show success toast
                Toast-->>User: "Student added successfully"
                UI->>UI: Refresh student list
                UI->>UI: Close form
            end
        end
    end
```

### 4.3. Fee Payment Process

This sequence diagram shows the workflow for processing fee payments.

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant Dialog as Custom Dialog
    participant API as Flask Backend
    participant DB as Database
    
    User->>UI: View Fees Page
    UI->>API: GET /api/fees
    API->>DB: Query all fees
    DB-->>API: Fee records
    API-->>UI: Fee list
    UI-->>User: Display fees with status
    
    User->>UI: Click "Pay" on pending fee
    UI->>Dialog: Show confirmation dialog
    Dialog-->>User: "Confirm payment?"
    
    alt User Confirms
        User->>Dialog: Click "Confirm"
        Dialog->>API: PUT /api/fees/{id}<br/>{status: "paid", paid_date: today}
        API->>DB: UPDATE fee record
        DB-->>API: Fee updated
        API-->>UI: 200 OK<br/>{updated fee}
        UI->>UI: Update fee in list
        UI->>Dialog: Show success toast
        Dialog-->>User: "Payment recorded"
    else User Cancels
        User->>Dialog: Click "Cancel"
        Dialog->>UI: Close dialog
        UI-->>User: Return to fees list
    end
```

---

## Summary

These diagrams provide a comprehensive view of the Student Management System:

1. **High-Level Architecture**: Shows the three-tier architecture (Frontend, Backend, Database)
2. **Low-Level Class Diagram**: Details all database models and their relationships
3. **Low-Level Component Diagram**: Maps out the React component hierarchy
4. **Data Flow Diagrams**: Illustrate how data flows through the system at different abstraction levels
5. **Sequence Diagrams**: Document the step-by-step execution of critical workflows (Login, Add Student, Fee Payment)

These diagrams serve as essential documentation for understanding, maintaining, and extending the system.
