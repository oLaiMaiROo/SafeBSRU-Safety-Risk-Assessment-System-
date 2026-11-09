# 🛡️ SafeBSRU - Safety Risk Assessment System

A comprehensive web-based platform designed for monitoring, reporting, and evaluating safety risks and accidents within Bansomdejchaopraya Rajabhat University (BSRU).

## 📌 Core Features

*   **📊 Dashboard & Data Visualization**
    The central hub for monitoring overall accident and risk data in real-time. Features dynamic statistical filtering (1 month, 3 months, 6 months, All) to accurately summarize total incidents and severity proportions across different faculties and departments.

*   **🚦 Surveillance List & Severity Status**
    Classifies the severity of each incident that affects a person into 4 levels (green → yellow → orange → red):
    *   **Level 1 – เล็กน้อย (Minor):** Minor injury, first aid only.
    *   **Level 2 – ปานกลาง (Moderate):** Injury that requires medical treatment.
    *   **Level 3 – สูง (High):** Serious injury or illness.
    *   **Level 4 – สูงมาก (Very high):** Disability or death.

    Reports saved under the old 3-level scale were migrated to Level 1 (low), Level 2 (warning) and Level 3 (critical).

*   **📋 Case Handling**
    Each report has a status (รอดำเนินการ → กำลังดำเนินการ → เสร็จสิ้น). The administrator who changes the status is recorded as the person handling the case.

*   **🔍 Evidence Data Management & Filters**
    *   **In-depth Search:** Search incident history using reporter ID, full name, or filter by specific faculty and department.
    *   **Status Filtering:** Filter by exact incident dates, severity levels or case status. Includes a selection system to manage multiple records simultaneously.

*   **📄 Export System & Reporting**
    *   Export surveillance lists and statistics as **Excel (.csv)** files, fully formatted through data cleansing and ready for further analysis.
    *   Generate professional **PDF** reports for printing, executive presentations, or appending as evidence in official case files.

*   **📝 Incident Reporting System**
    An intuitive form supporting incident reports from both students and university personnel. It allows users to attach up to 5 photographic evidence files of the scene. Includes a Data Confirmation popup before database submission to minimize human error.

*   **🔐 Admin & Security Controls**
    *   **STATUS: ADMIN** - Restricts data management, record deletion, and in-depth detail access exclusively to verified administrators.
    *   **Account Security:** Features a robust administrator profile management system requiring current password verification before allowing credential updates, effectively preventing unauthorized access. Passwords are stored as bcrypt hashes (PostgreSQL `pgcrypto`).

## 🗄️ Database

PostgreSQL database `safety_db` with 5 tables: `reports` (center), `departments`, `severity_levels`, `admins` and `report_images`. See the ER diagram in [`docs/er-diagram.png`](docs/er-diagram.png) and the migration notes in [`backend/migrations/README.md`](backend/migrations/README.md).

## ▶️ Running locally

1. Copy `backend/.env.example` to `backend/.env` and fill in your PostgreSQL password.
2. On an existing database created before November 2026, back up and then run the migration once (see `backend/migrations/README.md`):
   `cd backend && node migrate.js migrations/001_relations_and_cleanup.sql`
3. Start the backend: `cd backend && npm start` (http://localhost:5000)
4. Start the frontend: `cd frontend && npm run dev` (http://localhost:5173)

---
*Developed for Bansomdejchaopraya Rajabhat University (BSRU)*