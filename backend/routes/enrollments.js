import express from 'express';
import Enrollment from '../models/Enrollment.js';
import AcademicTerm from '../models/AcademicTerm.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';
import { assertPrerequisitesMet } from '../utils/prerequisiteCheck.js';
import { activeStudentMatch } from '../utils/studentQuery.js';

const router = express.Router();
router.use(protect);

function canManageStudent(req, studentId) {
  if (['admin', 'reception'].includes(req.user.role)) return true;
  if (req.user.role === 'student' && req.user.linkedStudentId && String(req.user.linkedStudentId) === studentId) {
    return true;
  }
  return false;
}

router.get('/', authorize('admin', 'teacher', 'hod', 'reception', 'student'), async (req, res) => {
  try {
    const { studentId, academicTermId, status } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (academicTermId) filter.academicTermId = academicTermId;
    if (status) filter.status = status;

    if (req.user.role === 'student' && req.user.linkedStudentId) {
      filter.studentId = req.user.linkedStudentId;
    }

    const rows = await Enrollment.find(filter).populate('academicTermId').populate('studentId', 'studentId fullName').sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin', 'reception', 'student'), async (req, res) => {
  try {
    let { studentId, courseCode, academicTermId } = req.body;
    if (req.user.role === 'student') {
      if (!req.user.linkedStudentId) return res.status(400).json({ message: 'Student account not linked' });
      studentId = req.user.linkedStudentId.toString();
    }

    if (!canManageStudent(req, studentId)) return res.status(403).json({ message: 'Access denied' });

    const term = await AcademicTerm.findById(academicTermId);
    if (!term || !term.isActive) return res.status(400).json({ message: 'Invalid term' });

    const now = new Date();
    if (now < term.enrollmentOpenAt || now > term.enrollmentCloseAt) {
      return res.status(400).json({ message: 'Outside enrollment window for this term' });
    }

    const student = await Student.findOne(activeStudentMatch({ _id: studentId }));
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const course = await Course.findOne({ courseCode: String(courseCode).toUpperCase() });
    if (!course) return res.status(400).json({ message: 'Unknown course' });

    await assertPrerequisitesMet(student._id, course.courseCode);

    const exists = await Enrollment.findOne({
      studentId,
      courseCode: course.courseCode,
      academicTermId,
      status: 'enrolled',
    });
    if (exists) return res.status(400).json({ message: 'Already enrolled in this course for this term' });

    const row = await Enrollment.create({
      studentId,
      courseCode: course.courseCode,
      academicTermId,
      status: 'enrolled',
    });
    res.status(201).json(row);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
});

router.patch('/:id/drop', authorize('admin', 'reception', 'student'), async (req, res) => {
  try {
    const row = await Enrollment.findById(req.params.id).populate('academicTermId');
    if (!row) return res.status(404).json({ message: 'Enrollment not found' });

    if (req.user.role === 'student') {
      if (!req.user.linkedStudentId || String(row.studentId) !== String(req.user.linkedStudentId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const term = row.academicTermId;
    if (!term) return res.status(400).json({ message: 'Missing term' });

    const now = new Date();
    if (now > term.addDropDeadline) {
      return res.status(400).json({ message: 'Add/drop deadline has passed' });
    }

    row.status = 'dropped';
    row.droppedAt = now;
    await row.save();
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
