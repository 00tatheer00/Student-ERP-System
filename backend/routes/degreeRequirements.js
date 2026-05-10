import express from 'express';
import DegreeRequirement from '../models/DegreeRequirement.js';
import Student from '../models/Student.js';
import Result from '../models/Result.js';
import Enrollment from '../models/Enrollment.js';
import { protect, authorize } from '../middleware/auth.js';
import { activeStudentMatch } from '../utils/studentQuery.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'hod', 'teacher', 'reception'), async (req, res) => {
  try {
    const rows = await DegreeRequirement.find();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const row = await DegreeRequirement.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function collectedCourseCodes(studentId, results, enrollments) {
  const codes = new Set();
  for (const r of results) {
    for (const c of r.courses || []) codes.add(String(c.courseCode).toUpperCase());
  }
  for (const e of enrollments) {
    if (e.status === 'enrolled') codes.add(String(e.courseCode).toUpperCase());
  }
  return codes;
}

router.get('/audit/:studentId', authorize('admin', 'hod', 'teacher', 'reception', 'student'), async (req, res) => {
  try {
    if (req.user.role === 'student' && String(req.user.linkedStudentId) !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findOne(activeStudentMatch({ _id: req.params.studentId }));
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const plan = await DegreeRequirement.findOne({
      program: student.program,
      department: student.department,
    });
    const required = plan?.requiredCourseCodes?.map((c) => String(c).toUpperCase()) || [];

    const results = await Result.find({ studentId: student._id });
    const enrollments = await Enrollment.find({ studentId: student._id, status: 'enrolled' });
    const have = collectedCourseCodes(student._id, results, enrollments);

    const satisfied = [];
    const remaining = [];
    for (const code of required) {
      if (have.has(code)) satisfied.push(code);
      else remaining.push(code);
    }

    res.json({
      studentId: student.studentId,
      fullName: student.fullName,
      program: student.program,
      department: student.department,
      planTitle: plan?.title || 'No degree plan configured',
      required,
      satisfied,
      remaining,
      progressPercent: required.length ? Math.round((satisfied.length / required.length) * 100) : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
