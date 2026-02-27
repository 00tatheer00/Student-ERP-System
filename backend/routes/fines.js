import express from 'express';
import Fine from '../models/Fine.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const { studentId, status, type } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    if (type) filter.type = type;
    const fines = await Fine.find(filter)
      .populate('studentId', 'studentId fullName department')
      .sort({ createdAt: -1 });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin', 'reception', 'hod'), async (req, res) => {
  try {
    const fine = await Fine.create(req.body);
    const populated = await Fine.findById(fine._id).populate('studentId', 'studentId fullName department');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/pay', authorize('admin', 'reception'), async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    ).populate('studentId', 'studentId fullName department');
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    res.json(fine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const fine = await Fine.findByIdAndDelete(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    res.json({ message: 'Fine deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
