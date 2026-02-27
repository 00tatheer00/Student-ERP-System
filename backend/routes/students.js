import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import PDFDocument from 'pdfkit';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// All routes require auth
router.use(protect);

// GET /api/students - List with filters
router.get('/', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const { department, semester, program, batch, search, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (program) filter.program = program;
    if (batch) filter.batch = parseInt(batch);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { CNIC: { $regex: search, $options: 'i' } },
      ];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/export - Export CSV
router.get('/export', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    const students = await Student.find(filter);
    const headers = 'studentId,fullName,fatherName,CNIC,phone,email,department,program,semester,batch,status\n';
    const rows = students.map((s) =>
      [s.studentId, s.fullName, s.fatherName, s.CNIC, s.phone, s.email, s.department, s.program, s.semester, s.batch, s.status].join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students/import - CSV Import
router.post('/import', authorize('admin', 'reception'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    const created = [];
    for (const row of records) {
      const exists = await Student.findOne({ CNIC: row.CNIC || row.cnic });
      if (exists) continue;
      const student = await Student.create({
        fullName: row.fullName || row.name,
        fatherName: row.fatherName || row.father_name,
        CNIC: row.CNIC || row.cnic,
        phone: row.phone,
        email: row.email,
        address: row.address || 'N/A',
        department: (row.department || 'CS').toUpperCase().slice(0, 2),
        program: row.program || 'BS',
        semester: parseInt(row.semester) || 1,
        batch: parseInt(row.batch) || new Date().getFullYear(),
        status: row.status || 'active',
      });
      created.push(student);
    }
    await logActivity(req.user._id, 'csv_import', 'students', { count: created.length });
    res.json({ message: `Imported ${created.length} students`, count: created.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id/id-card - Generate ID card PDF (must be before :id)
router.get('/:id/id-card', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=id-card-${student.studentId}.pdf`);
    const doc = new PDFDocument({ size: [240, 380], margin: 15 });
    doc.pipe(res);
    doc.rect(0, 0, 240, 380).stroke();
    doc.fontSize(10).text('University of Computer Sciences', 15, 20, { align: 'center', width: 210 });
    doc.fontSize(8).text('Student ID Card', 15, 38, { align: 'center', width: 210 });
    doc.moveDown(4);
    doc.fontSize(14).text(student.studentId, 15, 80, { width: 210 });
    doc.fontSize(12).text(student.fullName, 15, 105);
    doc.fontSize(9).text(`Dept: ${student.department} | Sem: ${student.semester}`, 15, 130);
    doc.text(`Program: ${student.program} | Batch: ${student.batch}`, 15, 145);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students
router.post('/', authorize('admin', 'reception'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    await logActivity(req.user._id, 'create', 'students', { studentId: student.studentId });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', authorize('admin', 'reception'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await logActivity(req.user._id, 'update', 'students', { studentId: student.studentId });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await logActivity(req.user._id, 'delete', 'students', { studentId: student.studentId });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students/:id/photo
router.post('/:id/photo', authorize('admin', 'reception'), upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { profilePhoto: `/uploads/${req.file.filename}` },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
