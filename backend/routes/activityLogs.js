import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.find()
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
