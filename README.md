# 🎓 Smart Student Management System (SmartSMS)
> **University Semester Project — Software Construction & Development (SCD)**  
> Built with Node.js, Express, React (Vite + Tailwind CSS), SQLite / Firebase Architecture, JWT Authentication, and 6 Essential Software Design Patterns.

---

## 🌟 Executive Summary

SmartSMS is a full-stack, enterprise-grade academic management system designed to streamline university administrative, faculty, and student workflows. It is built strictly following the **Model-View-Controller (MVC)** architectural pattern and incorporates **6 mandatory Gang of Four (GoF) design patterns** directly within production source code.

---

## 📐 Mandatory Design Patterns Implementation

Each design pattern is accompanied in source code by the designated comment:
`// Pattern: <name> - <why used here>`

### 1. MVC (Model-View-Controller)
- **Model** (`backend/models/`): Encapsulates domain logic and business entities (`User`, `Admin`, `Teacher`, `Student`).
- **View** (`frontend/src/`): Interactive, responsive React + Vite UI styled with Tailwind CSS (`AdminDashboard`, `TeacherDashboard`, `StudentDashboard`).
- **Controller** (`backend/controllers/`): Mediates between user requests, services, and repositories (`authController`, `adminController`, `teacherController`, `studentController`, `reportController`).

### 2. Repository Pattern
- **Path**: `backend/repositories/`
- **Why used here**: Mediates between the domain entities and the database access layer, providing clean CRUD methods. Controllers and services **never** write SQL directly.
- **Implementations**:
  - `UserRepository.js`: CRUD, block/unblock, password reset, search.
  - `StudentRepository.js`: Student profiles, registration, class affiliations.
  - `TeacherRepository.js`: Faculty records, assigned courses.
  - `CourseRepository.js`: Course curriculum, instructor assignments, student enrollments.
  - `AttendanceRepository.js`: Roll-call records, student percentage calculation, low-attendance threshold detection.
  - `MarkRepository.js`: Grade recording, weighted GPA and CGPA calculations.
  - `FeeRepository.js`: Voucher lifecycle, payment status transitions, financial metrics.
  - `TimetableRepository.js`, `AssignmentRepository.js`, `SubmissionRepository.js`, `CourseMaterialRepository.js`, `AnnouncementRepository.js`.

### 3. Factory Pattern
- **Path**: `backend/patterns/factories/`
- **Why used here**:
  - `UserFactory.js`: Encapsulates the instantiation of role-specific domain objects (`Admin`, `Teacher`, `Student`) with appropriate default permissions and behaviors (`UserFactory.create(role, data)`).
  - `ReportFactory.js`: Creates the appropriate report generators (`AttendanceReport`, `ResultReport`, `FeeReport`) based on requested parameters (`ReportFactory.create(type)`).

### 4. Singleton Pattern
- **Path**: `backend/patterns/singletons/`
- **Why used here**:
  - `Database.js`: Guarantees a single, centralized database connection instance across the application lifecycle (`Database.getInstance()`). Includes reset and in-memory capabilities for test isolation.
  - `Logger.js`: Centralized, synchronized application logging and event logging singleton (`Logger.getInstance()`).

### 5. Observer Pattern
- **Path**: `backend/patterns/observers/`
- **Why used here**: Decouples event publishers from subscribers. When critical academic actions occur, `NotificationSubject` dispatches real-time alerts to registered observers:
  - `StudentNotifier.js`: Notifies students when announcements are posted, attendance drops below 75%, assignments are uploaded, marks are entered, or fees are issued.
  - `TeacherNotifier.js`: Alerts faculty when students submit assignments or announcements are broadcast.
  - `EmailLogObserver.js`: Simulates audit logging and institutional email dispatches.

### 6. Strategy Pattern
- **Path**: `backend/patterns/strategies/`
- **Why used here**:
  - `GradingStrategy.js`: Encapsulates interchangeable grading formulas:
    - `AbsoluteGradingStrategy`: Standard university criteria (85+ = A / 4.0, 80-84 = A-, 75-79 = B+, etc.).
    - `RelativeGradingStrategy`: Standard deviation curve based on class mean and variance.
  - `ReportExportStrategy.js`: Encapsulates interchangeable report exporting algorithms:
    - `PdfExportStrategy`: Generates downloadable formatted binary PDF documents via PDFKit.
    - `ExcelExportStrategy`: Generates downloadable Excel / XLSX spreadsheets via SheetJS.
  - `FeeCalculationStrategy.js`:
    - `RegularFeeStrategy`: Full tuition computation.
    - `ScholarshipFeeStrategy`: Automatic merit waivers (e.g., 50% waiver for GPA ≥ 3.8, 25% for GPA ≥ 3.5).

---

## 🚀 Key Portal Features

### 🛡️ Admin Portal
- **Dashboard Telemetry**: Real-time stats (Total Students, Teachers, Courses, Campus Attendance %, Fee Collected vs Pending) with visual progress meters.
- **User Management**: Add, edit, delete, search, block/unblock student and teacher accounts; one-click password reset.
- **Curriculum Management**: Create courses, set credit hours, assign faculty instructors to subjects.
- **Class & Cohort Management**: Manage departments, semesters (1-8), and sections (A, B).
- **Timetable Scheduler**: Allocate room numbers, lecture time slots, courses, and teachers.
- **Fee Management**: Issue fee vouchers with regular or scholarship strategies; update payment status (`paid`, `pending`, `partial`).
- **Campus Broadcasts**: Post announcements to everyone, faculty only, students only, or specific classes.
- **Reports Export**: 1-click export of Attendance, Marks/Results, and Fee Ledgers in PDF or Excel.

### 👨‍🏫 Faculty Portal
- **Overview**: Teaching load, assigned courses, student counts.
- **Attendance Register**: Mark daily lecture attendance (`Present`, `Absent`, `Late`). **Enforces the university same-day edit policy**.
- **Marks & Grading Engine**: Enter marks for Quizzes (20), Assignments (20), Midterms (30), and Finals (30). Instant calculation of Letter Grades and GPA using **GradingStrategy** (toggle between Absolute scale and Relative Bell Curve!).
- **Assignment Management**: Upload assignments with due dates and review/grade student submissions with numeric marks and qualitative feedback.
- **Course Materials**: Upload lecture notes, presentation slides, and reading links.
- **Course Broadcasts**: Send instant targeted announcements to enrolled students.

### 🎓 Student Portal
- **Overview**: Current GPA & CGPA summary, active course load, fee overview.
- **🚨 Critical Attendance Warning (< 75%)**: Prominent warning banner displayed automatically whenever attendance in any registered subject falls below the mandatory 75% university policy.
- **Course Attendance Breakdown**: Detailed breakdown of lectures attended, absent, and late with progress meters.
- **Transcript & Grades**: Detailed subject-wise breakdown of Quiz, Assignment, Mid, Final, Grade, and GPA.
- **Assignment Submissions**: View assignment details, deadlines, upload submissions (text or file/GitHub link), and inspect teacher marks/feedback.
- **Class Timetable**: Day-by-day weekly schedule with class time and room numbers.
- **Lecture Materials**: Download slides and course reading materials.
- **Fee Challan (PDF)**: View semester fee status and generate a printable, formatted 3-part bank deposit challan (Student Copy, University Accounts Copy, Bank Branch Copy).
- **Profile Self-Service**: Update permitted contact details (phone, address) and change password securely.

---

## 🔑 Pre-Configured Demo Credentials

The login page includes **one-click quick login pills** for immediate demonstration:

| Portal | Role | Email | Password | Notable Highlights |
|---|---|---|---|---|
| **Admin** | Administrator | `admin@sms.edu` | `Admin@123` | Full governance & telemetry |
| **Faculty** | Teacher | `prof.ahmed@sms.edu` | `Teacher@123` | Dr. Ahmed Khan (HOD, CS) |
| **Faculty** | Teacher | `dr.sarah@sms.edu` | `Teacher@123` | Dr. Sarah Malik (Databases) |
| **Student** | Student | `student1@sms.edu` | `Student@123` | Hamza Tariq (High Attendance ≥85%, Merit Scholarship) |
| **Student** | Student | `student3@sms.edu` | `Student@123` | **Bilal Hassan (Low Attendance Alert <75%, 50% in CS302)** |

---

## 🛠️ Installation & Execution Guide

### Prerequisites
- Node.js (v18+) & npm

### 1. Run Unit Tests (Jest)
To run the automated test suite covering all 12 mandatory areas:
\`\`\`bash
npm test
\`\`\`

### 2. Seed the Database
To populate the database with complete sample data:
\`\`\`bash
npm run seed
\`\`\`

### 3. Build & Run the Full-Stack Application
\`\`\`bash
# Build the React frontend
npm run build:frontend

# Start the full-stack server (serves API on /api and React frontend on /)
npm start
\`\`\`
Visit **`http://localhost:5000`** in your browser.

Alternatively, to run frontend in Vite development mode with hot-reload:
\`\`\`bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
\`\`\`
Visit **`http://localhost:3000`** in your browser.

---

## 🧪 Unit Testing Verification Summary

\`\`\`
PASS tests/system.test.js
  Smart Student Management System - SCD Unit Tests
    1. UserFactory Pattern
      ✓ creates Admin, Teacher, and Student instances with appropriate properties
      ✓ throws error when creating an invalid user role
    2. AbsoluteGradingStrategy
      ✓ calculates correct letter grades and GPA based on score thresholds
    3. RelativeGradingStrategy
      ✓ calculates curved grade and GPA based on class mean and standard deviation
    4. ReportExportStrategy (PDF & Excel)
      ✓ PdfExportStrategy produces valid PDF buffer and mime type
      ✓ ExcelExportStrategy produces valid Excel/XLSX buffer and mime type
    5. FeeCalculationStrategy
      ✓ RegularFeeStrategy applies no discount
      ✓ ScholarshipFeeStrategy applies merit waiver for high GPA
    6. Singleton Pattern
      ✓ Database.getInstance() returns the identical singleton instance
      ✓ Logger.getInstance() returns the identical singleton instance and logs entries
    7. Observer Pattern
      ✓ notifies attached observers when an event is dispatched
      ✓ EmailLogObserver records dispatched email events
    8. Repository Pattern (In-Memory SQLite Database)
      ✓ UserRepository performs CRUD methods cleanly without direct SQL in services
      ✓ CourseRepository creates and retrieves courses
    9. Attendance Percentage Calculation
      ✓ accurately calculates attendance % and identifies when below 75%
    10. GPA Calculation
      ✓ computes weighted GPA from multiple courses correctly
    11. AuthService (Login & Password Verification)
      ✓ authenticates valid credentials and returns JWT token
      ✓ rejects incorrect password with error
      ✓ rejects non-existent email with error
    12. Role Middleware (Authorization)
      ✓ authorizes user with allowed role and calls next()
      ✓ rejects user with unauthorized role with 403 Forbidden
      ✓ rejects unauthenticated request with 401

Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Time:        2.289 s
Ran all test suites.
\`\`\`
