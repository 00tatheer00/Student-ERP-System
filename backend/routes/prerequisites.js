import express from 'express';
import CoursePrerequisite from '../models/CoursePrerequisite.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'teacher', 'hod', 'reception'), async (req, res) => {
  try {
    const rows = await CoursePrerequisite.find().sort({ courseCode: 1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const row = await CoursePrerequisite.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await CoursePrerequisite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
