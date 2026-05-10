import express from 'express';
import ExamHall from '../models/ExamHall.js';
import ExamSession from '../models/ExamSession.js';
import ExamSeatAssignment from '../models/ExamSeatAssignment.js';
import MalpracticeLog from '../models/MalpracticeLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/halls', authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    res.json(await ExamHall.find().sort({ code: 1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/halls', authorize('admin'), async (req, res) => {
  try {
    const h = await ExamHall.create(req.body);
    res.status(201).json(h);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sessions', authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const rows = await ExamSession.find().populate('hallId').sort({ scheduledAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/sessions', authorize('admin', 'hod'), async (req, res) => {
  try {
    const s = await ExamSession.create(req.body);
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/sessions/:id/seats', authorize('admin', 'hod'), async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.id).populate('hallId');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || !studentIds.length) {
      return res.status(400).json({ message: 'studentIds array required' });
    }
    const cap = session.hallId?.capacity || 999;
    if (studentIds.length > cap) return res.status(400).json({ message: 'Too many students for hall capacity' });

    await ExamSeatAssignment.deleteMany({ examSessionId: session._id });

    let seat = 1;
    const created = [];
    for (const sid of studentIds) {
      const a = await ExamSeatAssignment.create({
        examSessionId: session._id,
        studentId: sid,
        seatNumber: seat++,
      });
      created.push(a);
    }
    session.seatPlanGenerated = true;
    await session.save();
    res.status(201).json({ sessionId: session._id, assignments: created.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sessions/:id/seats', authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const rows = await ExamSeatAssignment.find({ examSessionId: req.params.id })
      .populate('studentId', 'studentId fullName')
      .sort({ seatNumber: 1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/sessions/:id/malpractice', authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { studentId, description, severity } = req.body;
    const log = await MalpracticeLog.create({
      examSessionId: req.params.id,
      studentId,
      description,
      severity: severity || 'medium',
      reportedByUserId: req.user._id,
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/malpractice', authorize('admin', 'hod'), async (req, res) => {
  try {
    const rows = await MalpracticeLog.find()
      .populate('examSessionId', 'title courseCode scheduledAt')
      .populate('studentId', 'studentId fullName')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
