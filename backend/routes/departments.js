import express from 'express';
import Department from '../models/Department.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const DEFAULT_DEPARTMENTS = [
  { code: 'CS', name: 'Computer Science' },
  { code: 'SE', name: 'Software Engineering' },
  { code: 'AI', name: 'Artificial Intelligence' },
  { code: 'CY', name: 'Cybersecurity' },
  { code: 'DS', name: 'Data Science' },
  { code: 'IT', name: 'Information Technology' },
];

router.get('/', authorize('admin', 'teacher', 'reception', 'hod'), async (req, res) => {
  try {
    let depts = await Department.find();
    if (depts.length === 0) {
      await Department.insertMany(DEFAULT_DEPARTMENTS);
      depts = await Department.find();
    }
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
