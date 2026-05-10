import express from 'express';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import { protect, authorize } from '../middleware/auth.js';
import { activeStudentMatch } from '../utils/studentQuery.js';

const router = express.Router();
router.use(protect);

router.get('/gdpr/student/:id/export', authorize('admin', 'student', 'parent'), async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.role === 'student' && String(req.user.linkedStudentId) !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'parent' && !(req.user.parentOfStudentIds || []).map(String).includes(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(id).lean();
    if (!student) return res.status(404).json({ message: 'Not found' });

    const bundle = {
      exportNotice: 'Personal data export (ERP). Retain securely.',
      exportedAt: new Date().toISOString(),
      consentProcessing: student.consentProcessing,
      consentMarketing: student.consentMarketing,
      profile: {
        studentId: student.studentId,
        fullName: student.fullName,
        fatherName: student.fatherName,
        CNIC: student.CNIC,
        phone: student.phone,
        email: student.email,
        address: student.address,
        department: student.department,
        program: student.program,
        semester: student.semester,
        batch: student.batch,
        admissionDate: student.admissionDate,
        status: student.status,
      },
    };
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/insights/attendance-sheet', authorize('admin', 'hod', 'teacher'), async (req, res) => {
  try {
    const { courseCode, startDate, endDate } = req.query;
    const filter = {};
    if (courseCode) filter.courseCode = courseCode;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const rows = await Attendance.find(filter)
      .populate('studentId', 'studentId fullName department')
      .sort({ date: -1 })
      .limit(2000);
    res.json({
      count: rows.length,
      rows: rows.map((r) => ({
        date: r.date,
        student: r.studentId?.studentId,
        fullName: r.studentId?.fullName,
        department: r.studentId?.department,
        courseCode: r.courseCode,
        status: r.status,
        method: r.method,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/insights/fee-collection', authorize('admin', 'hod', 'reception'), async (req, res) => {
  try {
    const fees = await Fee.find().populate('studentId', 'studentId fullName department');
    let totalBilled = 0;
    let totalPaid = 0;
    const bySemester = {};
    for (const f of fees) {
      totalBilled += f.totalAmount || 0;
      totalPaid += f.paidAmount || 0;
      const k = `S${f.semester}`;
      if (!bySemester[k]) bySemester[k] = { billed: 0, paid: 0 };
      bySemester[k].billed += f.totalAmount || 0;
      bySemester[k].paid += f.paidAmount || 0;
    }
    res.json({
      records: fees.length,
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      bySemester,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/insights/fee-defaulters', authorize('admin', 'hod', 'reception'), async (req, res) => {
  try {
    const fees = await Fee.find({ status: { $in: ['pending', 'partial'] } }).populate(
      'studentId',
      'studentId fullName department phone email'
    );
    const rows = fees
      .map((f) => ({
        studentId: f.studentId?.studentId,
        fullName: f.studentId?.fullName,
        department: f.studentId?.department,
        semester: f.semester,
        balance: (f.totalAmount || 0) - (f.paidAmount || 0),
        status: f.status,
        phone: f.studentId?.phone,
        email: f.studentId?.email,
      }))
      .filter((r) => r.balance > 0);
    res.json({ count: rows.length, rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/insights/hec-students-export', authorize('admin', 'hod'), async (req, res) => {
  try {
    const students = await Student.find(activeStudentMatch()).sort({ department: 1, studentId: 1 });
    const headers = [
      'Reg_No',
      'Full_Name',
      'Father_Name',
      'CNIC',
      'Gender',
      'Department',
      'Program',
      'Semester',
      'Batch',
      'Email',
      'Phone',
    ];
    const lines = [headers.join(',')];
    for (const s of students) {
      const row = [
        s.studentId,
        `"${(s.fullName || '').replace(/"/g, '""')}"`,
        `"${(s.fatherName || '').replace(/"/g, '""')}"`,
        s.CNIC,
        '',
        s.department,
        s.program,
        s.semester,
        s.batch,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        s.phone,
      ];
      lines.push(row.join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=hec-style-students.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
