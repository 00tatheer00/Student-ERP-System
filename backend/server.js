import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import courseRoutes from './routes/courses.js';
import attendanceRoutes from './routes/attendance.js';
import resultRoutes from './routes/results.js';
import feeRoutes from './routes/fees.js';
import fineRoutes from './routes/fines.js';
import departmentRoutes from './routes/departments.js';
import dashboardRoutes from './routes/dashboard.js';
import activityLogRoutes from './routes/activityLogs.js';
import academicTermRoutes from './routes/academicTerms.js';
import enrollmentRoutes from './routes/enrollments.js';
import prerequisiteRoutes from './routes/prerequisites.js';
import degreeRequirementRoutes from './routes/degreeRequirements.js';
import examRoutes from './routes/exams.js';
import serviceLedgerRoutes from './routes/serviceLedgers.js';
import portalRoutes from './routes/portal.js';
import complianceRoutes from './routes/compliance.js';
import notificationRoutes from './routes/notifications.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;
const startedAt = Date.now();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.SENTRY_DSN) {
  import('@sentry/node')
    .then((Sentry) => {
      Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
      console.log('✓ Sentry initialized');
    })
    .catch(() => console.warn('Sentry package not installed — npm i @sentry/node to enable'));
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser and same-origin requests without Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/academic-terms', academicTermRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/prerequisites', prerequisiteRoutes);
app.use('/api/degree-requirements', degreeRequirementRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/service-ledgers', serviceLedgerRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbLabels = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    mongo: dbLabels[dbState] || String(dbState),
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ucs-erp')
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
