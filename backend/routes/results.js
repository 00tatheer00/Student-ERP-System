import express from 'express';
import PDFDocument from 'pdfkit';
import Result from '../models/Result.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const gradeToPoints = { A: 4, B: 3, C: 2, D: 1, F: 0 };

// GET /api/results
router.get('/', authorize('admin', 'teacher', 'hod'), async (req, res) => {
  try {
    const { studentId, semester } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (semester) filter.semester = parseInt(semester);
    const results = await Result.find(filter)
      .populate('studentId', 'studentId fullName department program batch')
      .sort({ semester: 1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/student/:studentId
router.get('/student/:studentId', authorize('admin', 'teacher', 'hod'), async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .populate('studentId', 'studentId fullName department program batch')
      .sort({ semester: 1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/results
router.post('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { studentId, semester, courses } = req.body;
    let totalPoints = 0;
    let totalCredits = 0;
    for (const c of courses) {
      totalPoints += gradeToPoints[c.grade] * c.creditHours;
      totalCredits += c.creditHours;
    }
    const GPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    const allResults = await Result.find({ studentId }).sort({ semester: 1 });
    let cgpaTotal = 0;
    let cgpaCount = 0;
    const updatedResults = [...allResults.filter((r) => r.semester !== semester), { semester, GPA }];
    for (const r of updatedResults) {
      cgpaTotal += r.GPA || r.gpa || 0;
      cgpaCount++;
    }
    const CGPA = cgpaCount > 0 ? cgpaTotal / cgpaCount : GPA;

    const result = await Result.findOneAndUpdate(
      { studentId, semester },
      { studentId, semester, courses, GPA, CGPA },
      { new: true, upsert: true }
    )
      .populate('studentId', 'studentId fullName department program batch');
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/results/transcript/:studentId
router.get('/transcript/:studentId', authorize('admin', 'teacher', 'hod'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const results = await Result.find({ studentId: req.params.studentId }).sort({ semester: 1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transcript-${student.studentId}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('University of Computer Sciences', { align: 'center' });
    doc.fontSize(14).text('Academic Transcript', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).text(`Student ID: ${student.studentId}`);
    doc.text(`Name: ${student.fullName}`);
    doc.text(`Department: ${student.department} | Program: ${student.program} | Batch: ${student.batch}`);
    doc.moveDown(2);

    for (const r of results) {
      doc.fontSize(14).text(`Semester ${r.semester}`, { underline: true });
      doc.fontSize(10);
      doc.text('Course Code\tMarks\tGrade\tCredit Hours');
      doc.moveDown(0.5);
      for (const c of r.courses) {
        doc.text(`${c.courseCode}\t\t${c.marks}\t${c.grade}\t${c.creditHours}`);
      }
      doc.text(`GPA: ${r.GPA?.toFixed(2) || 'N/A'} | CGPA: ${r.CGPA?.toFixed(2) || 'N/A'}`);
      doc.moveDown(2);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
