# University of Computer Sciences — Student ERP System

A MERN-stack student and academic operations platform for a university Computer Sciences faculty. The repository contains a React/Vite frontend and an Express/MongoDB backend.

## Features

- **Student management:** Student records, search and filters, CSV import/export, profile photos, and student ID cards.
- **Attendance:** Course-based attendance, QR codes, scan/mark flows, and attendance percentages.
- **Courses and academic structure:** Departments, programs, semesters, course enrollment, prerequisites, and degree requirements.
- **Results and examinations:** Marks, GPA calculation, transcripts, exam sessions, and seat assignments.
- **Fees and fines:** Fee records, payment history, fines, and service ledgers.
- **Dashboards and reporting:** Department and semester analytics, attendance trends, GPA distribution, and financial summaries.
- **Role-based access:** Admin, Teacher, Reception, and HOD workflows.
- **Operational controls:** Activity logs, compliance tracking, and notifications.

## Technology

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 7, React Router |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens |
| Supporting tools | Recharts, QRCode, PDFKit, Vitest |

## Requirements

- Node.js 18+
- npm
- MongoDB (local instance or MongoDB Atlas)

## Local setup

Install the root, backend, and frontend dependencies:

```bash
git clone https://github.com/00tatheer00/Student-ERP-System.git
cd Student-ERP-System
npm run install:all
```

Create the backend environment file from the example:

```bash
cp backend/.env.example backend/.env
```

Configure the values in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ucs-erp
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Start the frontend and backend together:

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)
- Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run backend and frontend concurrently |
| `npm run server` | Run the backend in development mode |
| `npm run client` | Run the Vite frontend |
| `npm run install:all` | Install dependencies for all workspaces |
| `npm run build` | Build the frontend |
| `npm start` | Start the backend |
| `cd backend && npm test` | Run backend tests |

## Project structure

```text
.
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication and activity logging
│   ├── models/          # Mongoose models
│   ├── routes/          # REST API routes
│   └── scripts/         # Development seed data
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── utils/
└── package.json
```

## Security and demo data

The development seed script and login interface contain demo-account details for local evaluation. Treat those accounts as development-only: replace demo credentials, use a unique strong JWT secret, and configure a private database before any public deployment. Do not reuse demo passwords in production.

Environment files and dependency folders must not be committed. The repository currently contains previously tracked generated dependencies; adding ignore rules does not remove files already tracked by Git. Remove tracked dependency folders from the Git index in a separate cleanup commit after confirming the local project still installs correctly.

## License

See the repository's [LICENSE](./LICENSE) file if present.
