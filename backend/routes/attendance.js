import express from 'express';
import QRCode from 'qrcode';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/attendance/qr/:studentId - Generate QR for student
router.get('/qr/:studentId', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const payload = JSON.stringify({
      studentId: student._id.toString(),
      studentIdCode: student.studentId,
      timestamp: Date.now(),
    });
    const qrDataUrl = await QRCode.toDataURL(payload);
    res.json({ qrCode: qrDataUrl, studentId: student.studentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance/scan - Scan attendance (QR or manual)
router.post('/scan', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { studentId, courseCode, status = 'present', method = 'manual' } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
      studentId,
      courseCode,
      date: { $gte: today, $lt: tomorrow },
    });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      studentId,
      courseCode,
      date: new Date(),
      status,
      method,
    });
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance - List attendance with filters
router.get('/', authorize('admin', 'teacher', 'hod'), async (req, res) => {
  try {
    const { studentId, courseCode, date, startDate, endDate } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (courseCode) filter.courseCode = courseCode;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    const attendance = await Attendance.find(filter)
      .populate('studentId', 'studentId fullName department semester')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/percentage/:studentId
router.get('/percentage/:studentId', authorize('admin', 'teacher', 'hod'), async (req, res) => {
  try {
    const { courseCode, startDate, endDate } = req.query;
    const filter = { studentId: req.params.studentId };
    if (courseCode) filter.courseCode = courseCode;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    const records = await Attendance.find(filter);
    const total = records.length;
    const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
    res.json({ total, present, absent: total - present, percentage: parseFloat(percentage) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
