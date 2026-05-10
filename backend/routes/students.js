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
import { activeStudentMatch } from '../utils/studentQuery.js';
import { protect, authorize } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** DD/MM/YYYY for template-style dates */
function fmtDMY(d) {
  const x = new Date(d);
  const dd = String(x.getDate()).padStart(2, '0');
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const yyyy = x.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Regular hexagon path (flat-top); fill + gold stroke */
function hexagonFillStroke(doc, cx, cy, r, fillHex, strokeHex) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 6; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath();
  doc.fillColor(fillHex).strokeColor(strokeHex).lineWidth(0.55).fillAndStroke();
}

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
    const filter = activeStudentMatch();
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
    const filter = activeStudentMatch();
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

// PATCH consent flags (GDPR-style preferences)
router.patch('/:id/consent', authorize('admin', 'reception', 'student'), async (req, res) => {
  try {
    if (req.user.role === 'student' && String(req.user.linkedStudentId) !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { consentProcessing, consentMarketing } = req.body;
    const patch = {};
    if (typeof consentProcessing === 'boolean') patch.consentProcessing = consentProcessing;
    if (typeof consentMarketing === 'boolean') patch.consentMarketing = consentMarketing;
    const student = await Student.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Soft-delete (retention / GDPR workflow)
router.patch('/:id/archive', authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await logActivity(req.user._id, 'archive', 'students', { studentId: student.studentId });
    res.json({ message: 'Student archived (soft-deleted)', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id/id-card — red-gradient employee-style template (PNGTree-inspired), CR80
router.get('/:id/id-card', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const student = await Student.findOne(activeStudentMatch({ _id: req.params.id }));
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const CARD_W = 153;
    const CARD_H = 243;
    const R = 10;
    const cx = CARD_W / 2;
    const lineGap = 1;

    const redDark = '#5c0f18';
    const redMid = '#9f1239';
    const redBright = '#e11d48';
    const orange = '#f97316';
    const yellow = '#fbbf24';
    const goldStroke = '#fcd34d';
    const white = '#ffffff';

    const qrPayload = encodeAttendanceQr(student._id.toString());
    const qrBuffer = await QRCode.toBuffer(qrPayload, { type: 'png', margin: 1, width: 300, errorCorrectionLevel: 'M' });

    const issueDate = student.createdAt ? new Date(student.createdAt) : new Date();
    const expireDate = new Date(issueDate);
    expireDate.setFullYear(expireDate.getFullYear() + 4);
    const admDate = student.admissionDate ? new Date(student.admissionDate) : issueDate;

    const photoPathFull = student.profilePhoto
      ? path.join(__dirname, '..', student.profilePhoto.replace(/^\//, ''))
      : null;
    const hasPhoto = photoPathFull && fs.existsSync(photoPathFull);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=id-card-${student.studentId}.pdf`);

    const doc = new PDFDocument({ size: [CARD_W, CARD_H], margin: 0 });
    doc.pipe(res);

    const clipCard = () => {
      doc.save();
      doc.roundedRect(0, 0, CARD_W, CARD_H, R).clip();
    };
    const endClip = () => doc.restore();

    // ========== FRONT ==========
    clipCard();

    doc.rect(0, 0, CARD_W, CARD_H).fill(white);

    const splitY = 88;
    const peakY = 106;

    const gTop = doc.linearGradient(0, 0, 0, splitY);
    gTop.stop(0, redDark).stop(0.55, redMid).stop(1, redBright);
    doc.rect(0, 0, CARD_W, splitY).fill(gTop);

    doc.moveTo(0, splitY).lineTo(cx, peakY).lineTo(CARD_W, splitY).fill(orange);
    doc.moveTo(12, splitY).lineTo(cx, peakY - 9).lineTo(CARD_W - 12, splitY).fill(yellow);

    doc.rect(0, peakY - 2, CARD_W, CARD_H - (peakY - 2)).fill(white);

    hexagonFillStroke(doc, cx, 23, 11, '#450a0f', goldStroke);
    doc.fillColor(goldStroke).font('Helvetica-Bold').fontSize(5);
    doc.text('UCS', cx - 7, 19);

    doc.fillColor(white).font('Helvetica-Bold').fontSize(6.2);
    const orgName = 'UNIVERSITY OF COMPUTER SCIENCES';
    doc.text(orgName, 10, 34, { width: CARD_W - 20, align: 'center', lineGap });
    const orgH = doc.heightOfString(orgName, { width: CARD_W - 20, lineGap });
    doc.font('Helvetica').fontSize(4.8).fillColor('#fecaca');
    doc.text('Excellence in Computing', 10, 36 + orgH + 1, { width: CARD_W - 20, align: 'center', lineGap });

    const faceR = 27;
    const faceCy = 99;

    const photoPathFullFront = photoPathFull;
    doc.save();
    doc.circle(cx, faceCy, faceR).clip();
    doc.rect(cx - faceR, faceCy - faceR, faceR * 2, faceR * 2).fill('#fecdd3');
    if (hasPhoto) {
      try {
        doc.image(photoPathFullFront, cx - faceR, faceCy - faceR, {
          width: faceR * 2,
          height: faceR * 2,
          fit: [faceR * 2, faceR * 2],
          align: 'center',
          valign: 'center',
        });
      } catch {
        doc.fillColor('#fb7185').font('Helvetica').fontSize(6);
        doc.text('PHOTO', cx - faceR, faceCy - 4, { width: faceR * 2, align: 'center' });
      }
    } else {
      doc.fillColor('#fb7185').font('Helvetica').fontSize(6);
      doc.text('PHOTO', cx - faceR, faceCy - 4, { width: faceR * 2, align: 'center' });
    }
    doc.restore();
    doc.circle(cx, faceCy, faceR + 1.2).strokeColor(goldStroke).lineWidth(1).stroke();

    let y = peakY + 10;
    let displayName = student.fullName.toUpperCase();
    doc.font('Helvetica-Bold').fillColor(redBright);
    let namePt = 11;
    while (namePt >= 7.5) {
      doc.fontSize(namePt);
      const nh = doc.heightOfString(displayName, { width: CARD_W - 20, lineGap });
      if (nh <= 28) break;
      namePt -= 0.5;
    }
    doc.fontSize(namePt);
    if (doc.heightOfString(displayName, { width: CARD_W - 20, lineGap }) > 28) {
      let cut = displayName.trim();
      while (cut.length > 5) {
        cut = cut.slice(0, -1).trimEnd();
        const t = `${cut}…`;
        if (doc.heightOfString(t, { width: CARD_W - 20, lineGap }) <= 28) {
          displayName = t;
          break;
        }
      }
    }
    doc.text(displayName, 10, y, { width: CARD_W - 20, align: 'center', lineGap });
    y += doc.heightOfString(displayName, { width: CARD_W - 20, lineGap }) + 3;

    doc.fillColor('#1f2937').font('Helvetica').fontSize(5.6);
    const roleLine = `${student.program} Student · ${student.department}`;
    doc.text(roleLine, 10, y, { width: CARD_W - 20, align: 'center', lineGap });
    y += doc.heightOfString(roleLine, { width: CARD_W - 20, lineGap }) + 8;

    const lx = 14;
    const labW = 38;
    const tw = CARD_W - lx - labW - 10;
    doc.font('Helvetica-Bold').fontSize(5);

    const row = (label, value) => {
      doc.fillColor('#374151').text(`${label} :`, lx, y, { width: labW, lineGap });
      doc.font('Helvetica').fontSize(5).fillColor('#111827');
      const val = String(value || '—');
      doc.text(val, lx + labW, y, { width: tw, lineGap });
      const h = Math.max(
        doc.heightOfString(`${label} :`, { width: labW, lineGap }),
        doc.heightOfString(val, { width: tw, lineGap })
      );
      y += h + 4;
      doc.font('Helvetica-Bold').fontSize(5);
    };

    row('ID No', student.studentId);
    row('DOB', fmtDMY(admDate));
    row('Phone', student.phone);
    const emailRaw = student.email ? String(student.email) : '—';
    row('Email', emailRaw.length > 36 ? `${emailRaw.slice(0, 34)}…` : emailRaw);

    const barY = CARD_H - 14;
    let seed = student.studentId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const nextBar = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return 0.35 + (seed / 233280) * 1.4;
    };
    let bx = 18;
    doc.strokeColor('#0f172a').lineWidth(0.85);
    while (bx < CARD_W - 18) {
      const w = nextBar();
      doc.moveTo(bx, barY).lineTo(bx + w, barY).stroke();
      bx += w + 0.35;
    }

    endClip();
    doc.roundedRect(0.5, 0.5, CARD_W - 1, CARD_H - 1, R - 1).strokeColor('#fecaca').lineWidth(0.4).stroke();

    // ========== BACK ==========
    doc.addPage({ size: [CARD_W, CARD_H], margin: 0 });
    clipCard();

    doc.rect(0, 0, CARD_W, CARD_H).fill(white);

    const topBand = 34;
    const botBand = 36;
    const gBackTop = doc.linearGradient(0, 0, 0, topBand);
    gBackTop.stop(0, redDark).stop(1, redMid);
    doc.rect(0, 0, CARD_W, topBand).fill(gBackTop);

    const midTop = topBand;
    const midH = CARD_H - topBand - botBand;
    doc.rect(0, midTop, CARD_W, midH).fill(white);

    const gBackBot = doc.linearGradient(0, CARD_H - botBand, 0, CARD_H);
    gBackBot.stop(0, redMid).stop(1, redDark);
    doc.rect(0, CARD_H - botBand, CARD_W, botBand).fill(gBackBot);

    const midY = midTop + midH / 2;
    doc.moveTo(0, midTop).lineTo(24, midY).lineTo(0, midTop + midH).fill('#fed7aa');
    doc.moveTo(CARD_W, midTop).lineTo(CARD_W - 24, midY).lineTo(CARD_W, midTop + midH).fill('#fed7aa');

    hexagonFillStroke(doc, 18, 17, 8, '#450a0f', goldStroke);
    doc.fillColor(goldStroke).font('Helvetica-Bold').fontSize(4.5);
    doc.text('UCS', 13.5, 14);

    doc.fillColor(white).font('Helvetica-Bold').fontSize(5.8);
    doc.text('UNIVERSITY OF', 30, 9, { width: CARD_W - 36, lineGap });
    doc.text('COMPUTER SCIENCES', 30, 15, { width: CARD_W - 36, lineGap });
    doc.font('Helvetica').fontSize(4.3).fillColor('#fecaca');
    doc.text('Official Student ID', 30, 22, { width: CARD_W - 36, lineGap });

    doc.font('Helvetica').fontSize(4.9).fillColor('#4b5563');
    const policy =
      'Students must wear this ID on campus. For attendance, scan the QR code on this card. If lost, contact the Registrar office.';
    const policyY = midTop + 8;
    doc.text(policy, 12, policyY, { width: CARD_W - 24, align: 'center', lineGap });
    const policyH = doc.heightOfString(policy, { width: CARD_W - 24, lineGap });

    const qrSize = 68;
    const qrx = (CARD_W - qrSize) / 2;
    const qry = policyY + policyH + 8;

    doc.rect(qrx - 5, qry - 5, qrSize + 10, qrSize + 10).fill(white).strokeColor(goldStroke).lineWidth(0.8).stroke();
    doc.image(qrBuffer, qrx, qry, { width: qrSize, height: qrSize });

    const issueStr = fmtDMY(issueDate);
    const expStr = fmtDMY(expireDate);
    doc.fillColor(white).font('Helvetica').fontSize(4.8);
    doc.text(`Issue Date : ${issueStr}`, 10, CARD_H - botBand + 8, {
      width: CARD_W - 20,
      align: 'right',
      lineGap,
    });
    doc.text(`Expire Date : ${expStr}`, 10, CARD_H - botBand + 16, {
      width: CARD_W - 20,
      align: 'right',
      lineGap,
    });

    endClip();
    doc.roundedRect(0.5, 0.5, CARD_W - 1, CARD_H - 1, R - 1).strokeColor('#fecaca').lineWidth(0.4).stroke();

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const student = await Student.findOne(activeStudentMatch({ _id: req.params.id }));
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
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date(), status: 'inactive' },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await logActivity(req.user._id, 'soft_delete', 'students', { studentId: student.studentId });
    res.json({ message: 'Student archived', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students/:id/photo
router.post('/:id/photo', authorize('admin', 'reception'), upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
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
