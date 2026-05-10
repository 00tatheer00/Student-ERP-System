import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import Student from '../models/Student.js';
import { encodeAttendanceQr } from '../utils/attendanceQr.js';
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

// GET /api/students/:id/id-card — ISO CR80-style two-sided PDF (QR on back for attendance)
router.get('/:id/id-card', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const CARD_W = 153;
    const CARD_H = 243;
    const navy = '#0f2749';
    const gold = '#c9a227';
    const muted = '#64748b';

    const qrPayload = encodeAttendanceQr(student._id.toString());
    const qrBuffer = await QRCode.toBuffer(qrPayload, { type: 'png', margin: 1, width: 320, errorCorrectionLevel: 'M' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=id-card-${student.studentId}.pdf`);

    const doc = new PDFDocument({ size: [CARD_W, CARD_H], margin: 0 });
    doc.pipe(res);

    // ---- Front ----
    doc.rect(0, 0, CARD_W, 44).fill(navy);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('University of Computer Sciences', 8, 11, { width: CARD_W - 16, align: 'center' });
    doc.font('Helvetica').fontSize(6.2);
    doc.text('Official Student Identification', 8, 26, { width: CARD_W - 16, align: 'center' });

    doc.strokeColor(gold).lineWidth(1.5).moveTo(0, 44).lineTo(CARD_W, 44).stroke();

    const photoX = 9;
    const photoY = 51;
    const photoW = 54;
    const photoH = 66;
    doc.rect(photoX, photoY, photoW, photoH).lineWidth(0.35).strokeColor('#cbd5e1').stroke();

    if (student.profilePhoto) {
      const rel = student.profilePhoto.replace(/^\//, '');
      const photoPath = path.join(__dirname, '..', rel);
      if (fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, photoX + 1.5, photoY + 1.5, {
            fit: [photoW - 3, photoH - 3],
            align: 'center',
            valign: 'center',
          });
        } catch {
          doc.fillColor(muted).fontSize(6).text('PHOTO', photoX, photoY + photoH / 2 - 3, {
            width: photoW,
            align: 'center',
          });
        }
      }
    } else {
      doc.fillColor('#94a3b8').fontSize(6).text('PHOTO', photoX, photoY + photoH / 2 - 3, {
        width: photoW,
        align: 'center',
      });
    }

    const tx = photoX + photoW + 7;
    let ty = photoY + 2;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5);
    doc.text(student.fullName.toUpperCase(), tx, ty, { width: CARD_W - tx - 8 });
    ty += 13;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(navy);
    doc.text(student.studentId, tx, ty);
    ty += 12;
    doc.font('Helvetica').fontSize(6.5).fillColor('#334155');
    doc.text(`${student.program}  ·  ${student.department}  ·  Semester ${student.semester}`, tx, ty, {
      width: CARD_W - tx - 8,
    });
    ty += 11;
    doc.text(`Batch ${student.batch}`, tx, ty);
    ty += 11;
    doc.fontSize(5.8).fillColor(muted);
    doc.text(`Phone  ${student.phone}`, tx, ty, { width: CARD_W - tx - 8 });

    doc.font('Helvetica').fontSize(5).fillColor('#94a3b8');
    const issued = student.createdAt ? new Date(student.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Issued ${issued}`, 8, CARD_H - 24, { width: CARD_W - 16, align: 'center' });
    doc.text('Non-transferable · Report lost cards to the Registrar', 8, CARD_H - 15, {
      width: CARD_W - 16,
      align: 'center',
    });

    // ---- Back (attendance QR) ----
    doc.addPage({ size: [CARD_W, CARD_H], margin: 0 });
    doc.rect(0, 0, CARD_W, CARD_H).fill('#f8fafc');

    doc.lineWidth(0.5).fillColor('#ffffff').strokeColor('#e2e8f0');
    doc.rect(8, 12, CARD_W - 16, CARD_H - 24).fillAndStroke();

    doc.fillColor(navy).font('Helvetica-Bold').fontSize(9);
    doc.text('ATTENDANCE', 12, 22, { width: CARD_W - 24, align: 'center' });
    doc.font('Helvetica').fontSize(5.8).fillColor('#475569');
    doc.text(
      'Present this side to the reader. USB or Bluetooth scanners paste into the ERP attendance field like a keyboard.',
      14,
      36,
      { width: CARD_W - 28, align: 'center' }
    );

    const qrSize = 82;
    const qrx = (CARD_W - qrSize) / 2;
    const qry = 58;
    doc.image(qrBuffer, qrx, qry, { width: qrSize, height: qrSize });

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7);
    doc.text(student.studentId, 10, qry + qrSize + 7, { width: CARD_W - 20, align: 'center' });
    doc.font('Helvetica').fontSize(5.5).fillColor(muted);
    doc.text(`${student.fullName}`, 10, qry + qrSize + 17, { width: CARD_W - 20, align: 'center' });

    doc.fontSize(5).fillColor('#94a3b8');
    doc.text('University ERP · enrollment verified', 10, CARD_H - 26, { width: CARD_W - 20, align: 'center' });

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
