import express from 'express';
import ServiceLedger from '../models/ServiceLedger.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';
import { activeStudentMatch } from '../utils/studentQuery.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const { studentId, module: mod } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (mod) filter.module = mod;
    const rows = await ServiceLedger.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin', 'reception'), async (req, res) => {
  try {
    const st = await Student.findOne(activeStudentMatch({ _id: req.body.studentId }));
    if (!st) return res.status(404).json({ message: 'Student not found' });
    const row = await ServiceLedger.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/balance/:studentId/:module', authorize('admin', 'reception', 'hod', 'student', 'parent'), async (req, res) => {
  try {
    const { studentId, module: mod } = req.params;
    if (req.user.role === 'student' && String(req.user.linkedStudentId) !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'parent' && !(req.user.parentOfStudentIds || []).map(String).includes(studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const rows = await ServiceLedger.find({ studentId, module: mod });
    let balance = 0;
    for (const r of rows) {
      if (r.entryType === 'charge') balance += r.amount;
      else if (r.entryType === 'payment') balance -= r.amount;
      else balance += r.amount;
    }
    res.json({ studentId, module: mod, balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
