# Diagrams

This folder contains Draw.io (`.drawio`) flowcharts for every major module of the Student Management System.
Open any file with the **Draw.io Integration** VS Code extension or at [app.diagrams.net](https://app.diagrams.net/).

## Files

| File | Module | Description |
|---|---|---|
| `01_authentication.drawio` | Authentication | Login flow, JWT token handling, redirect logic |
| `02_student_management.drawio` | Students | Add / Edit / Delete student with validation & cascade delete |
| `03_teacher_management.drawio` | Teachers | Add / Edit / Delete teacher with batch constraint check |
| `04_course_management.drawio` | Courses | Add (unique code check) / Edit / Delete (batch dependency guard) |
| `05_batch_management.drawio` | Batches | Add (course required, date validation) / Edit / Delete (student enrolled guard) |
| `06_attendance_management.drawio` | Attendance | Bulk marking, status update, duplicate detection |
| `07_fee_management.drawio` | Fees | Add fee, mark as paid (with confirmation dialog), delete & overdue badge |
| `08_marks_management.drawio` | Marks | Add marks (0–100 validation, duplicate guard), edit, delete, auto pass/fail |
| `09_reports_dashboard.drawio` | Reports & Dashboard | KPI cards, Attendance / Fee / Student reports |

## Colour Legend

| Colour | Meaning |
|---|---|
| 🟢 Green | Start / End / Success state |
| 🔵 Blue | UI / Frontend action |
| 🟣 Purple | API / Backend call |
| 🟡 Yellow | Decision / Condition |
| 🔴 Red | Error / Failure state |
| 🟠 Orange | Informational note |
