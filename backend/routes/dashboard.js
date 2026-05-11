import express from 'express';
import Student from '../models/Student.js';
import { activeStudentMatch } from '../utils/studentQuery.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Fee from '../models/Fee.js';
import Fine from '../models/Fine.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin', 'hod'));

router.get('/', async (req, res) => {
  res.set({
    'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Authorization',
  });
  try {
    const students = await Student.find(activeStudentMatch({ status: 'active' }));
    const fees = await Fee.find();
    const fines = await Fine.find();
    const attendance = await Attendance.find();

    const byDept = {};
    const byProgram = { BS: 0, MS: 0 };
    const bySemester = {};
    students.forEach((s) => {
      byDept[s.department] = (byDept[s.department] || 0) + 1;
      byProgram[s.program] = (byProgram[s.program] || 0) + 1;
      bySemester[s.semester] = (bySemester[s.semester] || 0) + 1;
    });

    const totalFeeCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalFeePending = fees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0);
    const totalFines = fines.reduce((sum, f) => sum + f.amount, 0);
    const finesPaid = fines.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const finesPending = totalFines - finesPaid;

    const attendanceByDate = {};
    attendance.forEach((a) => {
      const d = a.date.toISOString().split('T')[0];
      attendanceByDate[d] = (attendanceByDate[d] || 0) + 1;
    });
    const attendanceTrend = Object.entries(attendanceByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));

    const results = await Result.find();
    const gpaDistribution = { '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0 };
    results.forEach((r) => {
      const gpa = r.GPA || 0;
      if (gpa < 1) gpaDistribution['0-1']++;
      else if (gpa < 2) gpaDistribution['1-2']++;
      else if (gpa < 3) gpaDistribution['2-3']++;
      else gpaDistribution['3-4']++;
    });

    const attendancePercent = attendance.length > 0
      ? ((attendance.filter((a) => a.status === 'present' || a.status === 'late').length / attendance.length) * 100).toFixed(1)
      : 0;

    res.json({
      totalStudents: students.length,
      byDepartment: byDept,
      byProgram: byProgram,
      bySemester: bySemester,
      feeCollection: { total: totalFeeCollected, pending: totalFeePending },
      finesSummary: { total: totalFines, paid: finesPaid, pending: finesPending },
      attendancePercentage: parseFloat(attendancePercent),
      gpaDistribution,
      attendanceTrend,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
