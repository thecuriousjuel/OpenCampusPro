# Architecture Diagrams

This document contains the complete application flowcharts for every module of **OpenCampusPro** — the Student Management System.  
All diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively on GitHub.

## Colour Legend

| Colour | Meaning |
|---|---|
| 🟢 Green | Start / End / Success state |
| 🔵 Blue | UI / Frontend action |
| 🟣 Purple | API / Backend call |
| 🟡 Yellow | Decision / Condition |
| 🔴 Red | Error / Failure state |
| 🟠 Orange | Informational note |

---

## Table of Contents

1. [Authentication](#1-authentication-flow)
2. [Student Management](#2-student-management-flow)
3. [Teacher Management](#3-teacher-management-flow)
4. [Course Management](#4-course-management-flow)
5. [Batch Management](#5-batch-management-flow)
6. [Attendance Management](#6-attendance-management-flow)
7. [Fee Management](#7-fee-management-flow)
8. [Marks Management](#8-marks-management-flow)
9. [Reports & Dashboard](#9-reports--dashboard-flow)

---

## 1. Authentication Flow

```mermaid
flowchart TD
    Start([START]):::success --> visit["User Visits App"]:::ui

    visit --> hasToken{"JWT Token in localStorage?"}:::decision

    hasToken -->|Yes| dashboard["Redirect to Dashboard"]:::success
    hasToken -->|No| loginPage["Show Login Page"]:::ui

    loginPage --> enterCreds["User Enters Username & Password"]:::ui
    enterCreds --> validateInput["Frontend Validates Input"]:::decision

    validateInput --> inputValid{"Input Valid?"}:::decision
    inputValid -->|No| validationErr["Show Validation Error"]:::error
    validationErr --> enterCreds

    inputValid -->|Yes| apiCall["POST /api/auth/login\n{username, password}"]:::api

    apiCall --> dbCheck["Query User by Username\nVerify Password Hash"]:::api

    dbCheck --> authOk{"Authentication Successful?"}:::decision

    authOk -->|No| authFail["Return 401 Unauthorized\nShow Error Toast"]:::error
    authFail --> loginPage

    authOk -->|Yes| genJwt["Generate JWT Token\nReturn 200 OK + Token"]:::success
    genJwt --> storeToken["Store Token in localStorage\nUpdate AuthContext"]:::success
    storeToken --> goToDash["Redirect to Dashboard"]:::success
    goToDash --> End([END]):::endnode

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```

---

## 2. Student Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Students Page\n(Protected Route - JWT Required)"]:::ui
    viewPage --> fetchStudents["GET /api/students\n(with optional filters)"]:::api
    fetchStudents --> displayList["Display Student List\nwith Search & Filters"]:::ui
    displayList --> chooseAction{"User Chooses Action"}:::decision

    %% ===== ADD STUDENT BRANCH =====
    chooseAction -->|Add| addForm["Show Add Student Form"]:::ui
    addForm --> fillForm["Fill: Name, Email, Phone,\nAddress, Batch, Status"]:::ui
    fillForm --> addValidate{"Validate Form"}:::decision
    addValidate -->|No| addValidErr["Show Error Toast"]:::error
    addValidErr --> fillForm
    addValidate -->|Yes| postStudent["POST /api/students\n{name, email, phone, address, batch_id}"]:::api
    postStudent --> emailUnique{"Email Already Exists?"}:::decision
    emailUnique -->|Yes| emailErr["400 - Email Already Exists"]:::error
    emailUnique -->|No| createStudent["Auto-generate student_code\nINSERT Student Record\nReturn 201 Created"]:::success
    createStudent --> addSuccess["Show Success Toast\nRefresh Student List"]:::success
    addSuccess --> End([END]):::endnode

    %% ===== EDIT STUDENT BRANCH =====
    chooseAction -->|Edit| editForm["Pre-fill Edit Form\nwith Student Data"]:::ui
    editForm --> putStudent["PUT /api/students/{id}\n{updated fields}"]:::api
    putStudent --> editSuccess["UPDATE DB Record\nReturn 200 OK\nShow Success Toast"]:::success
    editSuccess --> End

    %% ===== DELETE STUDENT BRANCH =====
    chooseAction -->|Delete| confirmDel["Show Delete\nConfirmation Dialog"]:::decision
    confirmDel --> userConfirms{"User Confirms?"}:::decision
    userConfirms -->|No| cancelDel["Cancel - Return to List"]:::error
    userConfirms -->|Yes| deleteStudent["DELETE /api/students/{id}\nCascade delete Attendance,\nFees, Marks"]:::api
    deleteStudent --> delSuccess["Return 200 OK\nShow Success Toast\nRefresh Student List"]:::success
    delSuccess --> End

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```

---

## 3. Teacher Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Teachers Page\n(Protected Route)"]:::ui
    viewPage --> fetchTeachers["GET /api/teachers"]:::api
    fetchTeachers --> displayList["Display Teacher List"]:::ui
    displayList --> chooseAction{"User Chooses Action"}:::decision

    %% ===== ADD TEACHER BRANCH =====
    chooseAction -->|Add| addForm["Show Add Teacher Form\n(Name, Email, Phone,\nSpecialization, Hire Date)"]:::ui
    addForm --> validateAdd{"Validate & Check Unique\nEmail / Employee ID"}:::decision
    validateAdd -->|Duplicate| addErr["400 - Duplicate Error"]:::error
    validateAdd -->|Valid| createTeacher["Auto-generate employee_id\nPOST /api/teachers\nINSERT DB Record\nReturn 201 Created"]:::success
    createTeacher --> End([END]):::endnode

    %% ===== EDIT TEACHER BRANCH =====
    chooseAction -->|Edit| editForm["Pre-fill Edit Form\nwith Teacher Data"]:::ui
    editForm --> putTeacher["PUT /api/teachers/{id}\nUPDATE DB Record\nReturn 200 OK"]:::success
    putTeacher --> End

    %% ===== DELETE TEACHER BRANCH =====
    chooseAction -->|Delete| checkBatches["Check if Teacher has\nAssigned Batches"]:::decision
    checkBatches --> hasBatches{"Has Active Batches?"}:::decision
    hasBatches -->|Yes| batchErr["400 - Cannot Delete:\nTeacher has Batches"]:::error
    hasBatches -->|No| deleteTeacher["DELETE /api/teachers/{id}\nReturn 200 OK\nShow Success Toast"]:::success
    deleteTeacher --> End

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```

---

## 4. Course Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Courses Page\n(Protected Route - JWT Required)"]:::ui
    viewPage --> fetchCourses["GET /api/courses\nDisplay Course List"]:::api
    fetchCourses --> displayList["Display Course List\n(Name, Code, Credits, Duration)"]:::ui
    displayList --> chooseAction{"User Chooses Action"}:::decision

    %% ===== ADD COURSE BRANCH =====
    chooseAction -->|Add| addForm["Show Add Course Form\n(Name, Code, Description,\nCredits, Duration)"]:::ui
    addForm --> validateAdd{"Validate Required Fields\n(Name & Code required)"}:::decision
    validateAdd -->|Invalid| valErr["Show Validation Error"]:::error
    validateAdd -->|Valid| checkCode{"Course Code Already Exists?"}:::decision
    checkCode -->|Yes| codeErr["400 - Course Code Already Exists"]:::error
    checkCode -->|No| postCourse["POST /api/courses\n{name, code, description,\ncredits, duration}"]:::api
    postCourse --> addOk["INSERT DB Record\nReturn 201 Created\nShow Success Toast"]:::success
    addOk --> End([END]):::endnode

    %% ===== EDIT COURSE BRANCH =====
    chooseAction -->|Edit| editForm["Pre-fill Edit Form with\nExisting Course Data"]:::ui
    editForm --> putCourse["PUT /api/courses/{id}\n{updated fields}\nUPDATE DB Record\nReturn 200 OK"]:::success
    putCourse --> End

    %% ===== DELETE COURSE BRANCH =====
    chooseAction -->|Delete| hasBatches{"Course Has Batches?"}:::decision
    hasBatches -->|Yes| cantDel["400 - Cannot Delete\nCourse has associated Batches"]:::error
    hasBatches -->|No| confirmDel["Show Confirmation Dialog"]:::decision
    confirmDel --> delCourse["DELETE /api/courses/{id}\nReturn 200 OK\nShow Success Toast"]:::success
    delCourse --> End

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```

---

## 5. Batch Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Batches Page\n(Protected Route - JWT Required)"]:::ui

    viewPage --> parallelFetch["Parallel API Calls"]:::ui
    parallelFetch --> fetchBatches["GET /api/batches"]:::api
    parallelFetch --> fetchCourses["GET /api/courses\n(for dropdown)"]:::api
    parallelFetch --> fetchTeachers["GET /api/teachers\n(for dropdown)"]:::api

    fetchBatches --> displayList["Display Batch List\n(Name, Course, Teacher, Dates, Capacity)"]:::ui
    fetchCourses --> displayList
    fetchTeachers --> displayList

    displayList --> chooseAction{"User Chooses Action"}:::decision

    %% ===== ADD BATCH BRANCH =====
    chooseAction -->|Add| addForm["Show Add Batch Form\n• Select Course (required)\n• Select Teacher (optional)\n• Set Start Date, End Date\n• Set Capacity (default: 30)"]:::ui
    addForm --> validateFields{"Course Selected?"}:::decision
    validateFields -->|No| fieldsErr["400 - Course Required"]:::error
    validateFields -->|Yes| validateDates{"end_date > start_date?"}:::decision
    validateDates -->|No| datesErr["400 - Invalid Date Range"]:::error
    validateDates -->|Yes| postBatch["POST /api/batches\n{name, course_id, teacher_id,\nstart_date, end_date, capacity}"]:::api
    postBatch --> addOk["INSERT DB Record\nReturn 201 Created\nShow Success Toast"]:::success
    addOk --> End([END]):::endnode

    %% ===== EDIT BATCH BRANCH =====
    chooseAction -->|Edit| editForm["Pre-fill Edit Form\n(Course, Teacher, Dates, Capacity)"]:::ui
    editForm --> putBatch["PUT /api/batches/{id}\n{updated fields}\nRe-validate dates\nUPDATE DB Record\nReturn 200 OK"]:::success
    putBatch --> End

    %% ===== DELETE BATCH BRANCH =====
    chooseAction -->|Delete| hasStudents{"Batch Has Enrolled Students?"}:::decision
    hasStudents -->|Yes| cantDel["400 - Cannot Delete\nBatch has enrolled Students"]:::error
    hasStudents -->|No| confirmDel["Show Confirmation Dialog"]:::decision
    confirmDel --> deleteBatch["DELETE /api/batches/{id}\nCascade delete:\nAttendance Records, Marks\nReturn 200 OK"]:::success
    deleteBatch --> End

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```

---

## 6. Attendance Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Attendance Page\n(Protected Route)"]:::ui
    viewPage --> fetchData["GET /api/attendance\nGET /api/batches (for filter)"]:::api
    fetchData --> displayList["Display Attendance List\n(filterable by Batch & Date)"]:::ui
    displayList --> chooseAction{"User Chooses Action"}:::decision

    %% ===== MARK ATTENDANCE (Bulk) =====
    chooseAction -->|Mark Attendance| markBulk["MARK ATTENDANCE (Bulk)"]:::success
    markBulk --> selectBatch["Select Batch & Date"]:::ui
    selectBatch --> fetchStudents["Load Students for Batch"]:::ui
    fetchStudents --> markEach["Mark Each Student:\nPresent / Absent / Late"]:::ui
    markEach --> submitBulk["POST /api/attendance (each)\nCheck for Duplicate Record\n(same student, batch, date)"]:::api
    submitBulk --> dupCheck{"Duplicate Entry?"}:::decision
    dupCheck -->|Yes| dupErr["400 - Record Already Exists"]:::error
    dupCheck -->|No| insertAtt["INSERT Attendance Record\nReturn 201 Created"]:::success
    insertAtt --> End([END]):::endnode

    %% ===== UPDATE ATTENDANCE =====
    chooseAction -->|Update| updateAtt["UPDATE ATTENDANCE STATUS"]:::success
    updateAtt --> changeStatus["Change Status on Existing Record\n(Present / Absent / Late)"]:::ui
    changeStatus --> putAtt["PUT /api/attendance/{id}\n{status}\nUPDATE DB Record"]:::success
    putAtt --> End

    %% ===== DELETE ATTENDANCE =====
    chooseAction -->|Delete| delAtt["DELETE /api/attendance/{id}\nRemove Record\nReturn 200 OK"]:::success
    delAtt --> End

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```

---

## 7. Fee Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Fees Page\n(Protected Route)"]:::ui
    viewPage --> fetchFees["GET /api/fees\n(filterable: student, status)"]:::api
    fetchFees --> displayFees["Display Fee List with\nStatus Badges (Pending / Paid / Overdue)"]:::ui
    displayFees --> chooseAction{"User Chooses Action"}:::decision

    %% ===== ADD FEE =====
    chooseAction -->|Add Fee| fillFeeForm["Fill Fee Form:\nSelect Student, Amount,\nDue Date, Description"]:::ui
    fillFeeForm --> validateFee{"Validate:\nAmount > 0, Date valid?"}:::decision
    validateFee -->|No| feeValErr["400 - Validation Error"]:::error
    validateFee -->|Yes| postFee["POST /api/fees\n{student_id, amount,\ndue_date, description,\nstatus: 'pending'}"]:::api
    postFee --> feeCreated["INSERT Fee Record\nReturn 201 Created\nShow Success Toast"]:::success
    feeCreated --> End([END]):::endnode

    %% ===== MARK AS PAID =====
    chooseAction -->|Pay Fee| confirmPay["Show Confirmation Dialog:\nConfirm Payment?"]:::decision
    confirmPay --> userConfirms{"User Confirms?"}:::decision
    userConfirms -->|No| cancelPay["Cancel - Return to List"]:::error
    userConfirms -->|Yes| putFee["PUT /api/fees/{id}\n{status: 'paid',\npaid_date: today}"]:::api
    putFee --> paidOk["UPDATE DB Record\nReturn 200 OK\nShow Success Toast"]:::success
    paidOk --> End

    %% ===== DELETE FEE =====
    chooseAction -->|Delete Fee| delFee["DELETE /api/fees/{id}\nReturn 200 OK\nShow Success Toast"]:::success
    delFee --> End

    %% ===== OVERDUE NOTE =====
    overdueNote["AUTO: On page load, fees where\ndue_date < today and status = 'pending'\nare displayed with 'Overdue' badge"]:::note

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
    classDef note fill:#ffe6cc,stroke:#d79b00,color:#000
```

---

## 8. Marks Management Flow

```mermaid
flowchart TD
    Start([START]):::success --> viewPage["Navigate to Marks Page\n(Protected Route)"]:::ui
    viewPage --> selectBatch["Select Batch to View Marks"]:::ui
    selectBatch --> fetchMarks["GET /api/marks?batch_id={id}\nGET /api/marks/analytics?batch_id={id}"]:::api
    fetchMarks --> displayMarks["Display Marks Table + Analytics:\nPass/Fail Count, Median Score"]:::ui
    displayMarks --> chooseAction{"User Chooses Action"}:::decision

    %% ===== ADD MARK =====
    chooseAction -->|Add| fillMarkForm["Select Student, Enter Marks (0-100)"]:::ui
    fillMarkForm --> validateMark{"Validate:\n0 <= marks <= 100?"}:::decision
    validateMark -->|No| markValErr["400 - Invalid Range"]:::error
    validateMark -->|Yes| checkDuplicate{"Mark Already Exists for\nStudent + Batch?"}:::decision
    checkDuplicate -->|Yes| dupMarkErr["400 - Mark Already Exists"]:::error
    checkDuplicate -->|No| postMark["POST /api/marks\n{student_id, batch_id, marks_obtained}\nINSERT DB Record"]:::api
    postMark --> passFailCheck["Auto-calculate Status:\nmarks >= 40 → PASSED\nmarks < 40 → FAILED"]:::success
    passFailCheck --> End([END]):::endnode

    %% ===== EDIT MARK =====
    chooseAction -->|Edit| editMark["Pre-fill Edit Form\nPUT /api/marks/{id}\n{marks_obtained}\nUPDATE DB Record"]:::success
    editMark --> End

    %% ===== DELETE MARK =====
    chooseAction -->|Delete| delMark["DELETE /api/marks/{id}\nReturn 200 OK\nRefresh Analytics"]:::success
    delMark --> End

    %% ===== ANALYTICS NOTE =====
    analyticsNote["Analytics auto-refresh after\nany mark change:\n• Total Students\n• Passed Count\n• Failed Count\n• Median Marks"]:::note

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
    classDef note fill:#ffe6cc,stroke:#d79b00,color:#000
```

---

## 9. Reports & Dashboard Flow

```mermaid
flowchart TD
    %% ===================== DASHBOARD =====================
    subgraph DASHBOARD
        dStart([START]):::success --> openDash["User Logs In\nRedirected to Dashboard"]:::ui
        openDash --> parallelFetch["Parallel API Calls"]:::ui

        parallelFetch --> fetchStudentCount["GET /api/students\n(count)"]:::api
        parallelFetch --> fetchTeacherCount["GET /api/teachers\n(count)"]:::api
        parallelFetch --> fetchCourseCount["GET /api/courses\n(count)"]:::api
        parallelFetch --> fetchFeeStats["GET /api/fees\n(pending / paid)"]:::api

        fetchStudentCount --> showKPIs["Display KPI Cards:\nTotal Students / Teachers / Courses\nPending Fees / Paid Fees\n+ Recent Activity"]:::success
        fetchTeacherCount --> showKPIs
        fetchCourseCount --> showKPIs
        fetchFeeStats --> showKPIs
    end

    %% ===================== REPORTS =====================
    subgraph REPORTS
        rStart([START]):::success --> openReports["Navigate to Reports Page\n(Protected Route)"]:::api
        openReports --> reportType{"Select Report Type"}:::decision

        %% Attendance Report
        reportType -->|Attendance| attFilters["Select Batch & Date Range"]:::ui
        attFilters --> attApiCall["GET /api/reports/attendance\n{batch_id, start, end}"]:::api
        attApiCall --> attResult["Display: Present %, Absent %\nPer-student breakdown"]:::success

        %% Fee Report
        reportType -->|Fees| feeApiCall["GET /api/reports/fees\nQuery: Paid, Pending, Overdue\ntotals and amounts"]:::api
        feeApiCall --> feeResult["Display: Total Paid, Total Pending\nOverdue Fees List"]:::success

        %% Student Report
        reportType -->|Students| stuApiCall["GET /api/reports/students\nStatus breakdown:\nActive / Inactive / Graduated"]:::api
        stuApiCall --> stuResult["Display: Student counts\nby status, batch enrollments"]:::success
    end

    showKPIs --> End([END]):::endnode
    attResult --> End
    feeResult --> End
    stuResult --> End

    classDef success fill:#d5e8d4,stroke:#82b366,color:#000
    classDef ui fill:#dae8fc,stroke:#6c8ebf,color:#000
    classDef api fill:#e1d5e7,stroke:#9673a6,color:#000
    classDef decision fill:#fff2cc,stroke:#d6b656,color:#000
    classDef error fill:#f8cecc,stroke:#b85450,color:#000
    classDef endnode fill:#f8cecc,stroke:#b85450,color:#000
```
