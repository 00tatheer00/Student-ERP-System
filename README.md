# University of Computer Sciences – Student ERP System

A full production-ready MERN stack web application for managing Computer Science faculty operations.

## Tech Stack

- **MongoDB** – Database
- **Express.js** – Backend API
- **React** – Frontend
- **Node.js** – Runtime

## Departments

- Computer Science (CS)
- Software Engineering (SE)
- Artificial Intelligence (AI)
- Cybersecurity (CY)
- Data Science (DS)
- Information Technology (IT)

## Programs

- **BS** – 4 Years (Semesters 1–8)
- **MS** – 2 Years (Semesters 1–4)

## Features

### Module 1 – Student Management
- CRUD operations
- CSV import/export
- Search & filters (department, semester, program)
- Profile photo upload
- Student ID card PDF

### Module 2 – Attendance Management
- QR code per student
- Scan/mark attendance
- Prevent double attendance same day
- Course-based attendance
- Attendance percentage

### Module 3 – Course Management
- CRUD courses
- Department & semester filters

### Module 4 – Result Management
- Assign courses per semester
- Enter marks & auto-calculate GPA
- Transcript PDF export

### Module 5 – Fee Management
- Semester, lab, library fees
- Payment history
- Payment recording

### Module 6 – Fine System
- Late submission, plagiarism, no ID card, discipline violation
- Track payment status

### Module 7 – Dashboard Analytics
- Students per department (pie chart)
- Semester strength (bar chart)
- Attendance trend (line chart)
- GPA distribution
- Fee collection & fines summary

### Module 8 – Roles & Users
- **Admin** – Full system access
- **Teacher** – Attendance + Results
- **Reception** – Students + Fees
- **HOD** – Analytics + Reports

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Or manually:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Environment

Create `backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ucs-erp
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Seed Data

```bash
cd backend
npm run seed
```

This creates:
- Departments & sample courses
- Demo users (see below)
- Sample student

### Run

```bash
# Run both backend and frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Demo Login Credentials

| Role      | Email               | Password    |
|-----------|---------------------|-------------|
| Admin     | admin@uop.edu.pk    | admin123    |
| Teacher   | teacher@ucs.edu.pk  | teacher123  |
| Reception | reception@ucs.edu.pk| reception123|
| HOD       | hod@ucs.edu.pk      | hod123      |

## API Routes

- `/api/auth` – Login, register, me
- `/api/students` – CRUD, import, export, ID card
- `/api/courses` – CRUD
- `/api/attendance` – Mark, QR, percentage
- `/api/results` – CRUD, transcript PDF
- `/api/fees` – CRUD, payments
- `/api/fines` – CRUD, mark paid
- `/api/departments` – List
- `/api/dashboard` – Analytics
- `/api/activity-logs` – Admin only

## Project Structure

```
├── backend/
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   ├── middleware/   # Auth, activity log
│   ├── scripts/      # Seed data
│   └── uploads/      # File uploads
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   └── ...
└── package.json
```

## License

MIT
