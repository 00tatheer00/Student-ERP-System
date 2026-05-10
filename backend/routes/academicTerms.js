import express from 'express';
import AcademicTerm from '../models/AcademicTerm.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'reception', 'hod', 'teacher', 'student'), async (req, res) => {
  try {
    const terms = await AcademicTerm.find().sort({ year: -1, semester: 1 });
    res.json(terms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const t = await AcademicTerm.create(req.body);
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const t = await AcademicTerm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return res.status(404).json({ message: 'Term not found' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await AcademicTerm.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
