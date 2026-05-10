import express from 'express';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendNotificationEmail, sendSmsStub, sendPushStub } from '../services/notifications.js';
import { activeStudentMatch } from '../utils/studentQuery.js';

const router = express.Router();
router.use(protect);

router.post('/fee-reminders', authorize('admin', 'reception'), async (req, res) => {
  try {
    const overdue = await Fee.find({ status: { $in: ['pending', 'partial'] } }).populate('studentId');
    const results = [];
    for (const f of overdue) {
      const bal = (f.totalAmount || 0) - (f.paidAmount || 0);
      if (bal <= 0 || !f.studentId?.email) continue;
      const r = await sendNotificationEmail(
        f.studentId.email,
        'Fee reminder — UCS ERP',
        `Dear ${f.studentId.fullName}, your semester ${f.semester} balance is Rs. ${bal}. Please clear dues at the accounts office.`
      );
      results.push({ studentId: f.studentId.studentId, ...r });
    }
    res.json({ processed: results.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/attendance-warnings', authorize('admin', 'teacher', 'hod'), async (req, res) => {
  try {
    const threshold = Number(req.body.thresholdPercent || 75);
    const students = await Student.find(activeStudentMatch());
    const out = [];
    for (const s of students) {
      const records = await Attendance.find({ studentId: s._id });
      if (records.length < 5) continue;
      const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      const pct = (present / records.length) * 100;
      if (pct >= threshold) continue;
      if (s.email) {
        await sendNotificationEmail(
          s.email,
          'Attendance notice — UCS ERP',
          `Dear ${s.fullName}, your attendance is ${pct.toFixed(1)}%. Please meet your course coordinator.`
        );
      }
      await sendSmsStub(s.phone, `Attendance ${pct.toFixed(0)}% — UCS ERP`);
      out.push({ studentId: s.studentId, percentage: pct });
    }
    res.json({ warned: out.length, students: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/results-published', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { semester } = req.body;
    const filter = semester ? { semester: Number(semester) } : {};
    const results = await Result.find(filter).populate('studentId');
    const emailed = [];
    for (const r of results) {
      const st = r.studentId;
      if (!st?.email) continue;
      await sendNotificationEmail(
        st.email,
        `Results published — Semester ${r.semester}`,
        `Dear ${st.fullName}, semester ${r.semester} results are available in the ERP. GPA: ${r.GPA ?? 'N/A'}, CGPA: ${r.CGPA ?? 'N/A'}.`
      );
      emailed.push(st.studentId);
    }
    res.json({ notices: emailed.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/push-stub', authorize('admin'), async (req, res) => {
  try {
    const u = await User.findOne({ role: 'student' });
    const r = await sendPushStub(u?._id || req.user._id, req.body.title || 'Notice', req.body.body || '');
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
