import express from 'express';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const { studentId, semester, status } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (semester) filter.semester = parseInt(semester);
    if (status) filter.status = status;
    const fees = await Fee.find(filter)
      .populate('studentId', 'studentId fullName department program semester batch')
      .sort({ semester: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/student/:studentId', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId })
      .populate('studentId', 'studentId fullName department program batch')
      .sort({ semester: 1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin', 'reception'), async (req, res) => {
  try {
    const { studentId, semester, semesterFee, labFee, libraryFee } = req.body;
    const totalAmount = (parseFloat(semesterFee) || 0) + (parseFloat(labFee) || 0) + (parseFloat(libraryFee) || 0);
    const fee = await Fee.findOneAndUpdate(
      { studentId, semester },
      {
        studentId,
        semester,
        semesterFee: semesterFee || 0,
        labFee: labFee || 0,
        libraryFee: libraryFee || 0,
        totalAmount,
        paidAmount: 0,
        status: 'pending',
      },
      { new: true, upsert: true }
    ).populate('studentId', 'studentId fullName department program batch');
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/pay', authorize('admin', 'reception'), async (req, res) => {
  try {
    const { amount, type = 'semester', receiptNo } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    fee.paidAmount += parseFloat(amount);
    fee.paymentHistory.push({ amount: parseFloat(amount), type, receiptNo });
    fee.status = fee.paidAmount >= fee.totalAmount ? 'paid' : 'partial';
    await fee.save();
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
