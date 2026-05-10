import express from 'express';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Result from '../models/Result.js';
import { protect, authorize } from '../middleware/auth.js';
import { activeStudentMatch } from '../utils/studentQuery.js';

const router = express.Router();
router.use(protect);

async function attendancePercent(studentMongoId) {
  const records = await Attendance.find({ studentId: studentMongoId });
  if (!records.length) return { total: 0, present: 0, percentage: null };
  const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const pct = ((present / records.length) * 100).toFixed(2);
  return { total: records.length, present, percentage: parseFloat(pct) };
}

router.get('/student/me', authorize('student'), async (req, res) => {
  try {
    if (!req.user.linkedStudentId) return res.status(400).json({ message: 'Account not linked to student record' });
    const student = await Student.findOne(activeStudentMatch({ _id: req.user.linkedStudentId }));
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fees = await Fee.find({ studentId: student._id });
    let feeDue = 0;
    let feePaid = 0;
    for (const f of fees) {
      feeDue += f.totalAmount || 0;
      feePaid += f.paidAmount || 0;
    }

    const results = await Result.find({ studentId: student._id }).sort({ semester: -1 });
    const transcript = results.map((r) => ({
      semester: r.semester,
      GPA: r.GPA,
      CGPA: r.CGPA,
      courses: r.courses?.length || 0,
    }));

    const att = await attendancePercent(student._id);

    res.json({
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        department: student.department,
        program: student.program,
        semester: student.semester,
        email: student.email,
      },
      attendance: att,
      fees: { totalDue: feeDue, totalPaid: feePaid, balance: feeDue - feePaid },
      transcriptSummary: transcript,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/parent/children', authorize('parent'), async (req, res) => {
  try {
    const ids = req.user.parentOfStudentIds || [];
    const students = await Student.find(activeStudentMatch({ _id: { $in: ids } })).select(
      'studentId fullName department program semester'
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/parent/student/:studentId/summary', authorize('parent'), async (req, res) => {
  try {
    const sid = req.params.studentId;
    if (!(req.user.parentOfStudentIds || []).map(String).includes(sid)) {
      return res.status(403).json({ message: 'Not linked to this student' });
    }
    const student = await Student.findOne(activeStudentMatch({ _id: sid }));
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const att = await attendancePercent(student._id);
    const fees = await Fee.find({ studentId: student._id });
    let feeDue = 0;
    let feePaid = 0;
    for (const f of fees) {
      feeDue += f.totalAmount || 0;
      feePaid += f.paidAmount || 0;
    }

    res.json({
      studentId: student.studentId,
      fullName: student.fullName,
      attendance: att,
      fees: { totalDue: feeDue, totalPaid: feePaid, balance: feeDue - feePaid },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
