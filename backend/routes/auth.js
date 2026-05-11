import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';

const router = express.Router();

const userPayload = (user, extras = {}) => ({
  _id: user._id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  department: user.department,
  linkedStudentId: user.linkedStudentId || null,
  parentOfStudentIds: user.parentOfStudentIds || [],
  ...extras,
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
    body('role').isIn(['admin', 'teacher', 'reception', 'hod']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, fullName, role, department } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });
      const user = await User.create({ email, password, fullName, role, department });
      const token = generateToken(user._id);
      res.status(201).json(
        userPayload(user, {
          token,
        })
      );
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// @route   POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .customSanitizer((v) => String(v || '').trim().toLowerCase())
      .notEmpty()
      .isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;
      const loginEmailLc = String(email).trim().toLowerCase();
      let user = await User.findOne({ email: loginEmailLc });
      let legacyUcsAdmin = false;
      // DBs seeded before admin email rebranding still use admin@ucs.edu.pk
      if (!user && loginEmailLc === 'admin@uop.edu.pk') {
        user = await User.findOne({ email: 'admin@ucs.edu.pk', role: 'admin' });
        legacyUcsAdmin = !!user;
      }
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const storedEmailLc = String(user.email || '').toLowerCase();
      const adminEmails = new Set(['admin@uop.edu.pk', 'admin@ucs.edu.pk']);
      const isAdminAccount =
        adminEmails.has(loginEmailLc) || adminEmails.has(storedEmailLc);
      let userChanged = false;
      if (legacyUcsAdmin) {
        user.email = 'admin@uop.edu.pk';
        userChanged = true;
      }
      if (isAdminAccount && user.role !== 'admin') {
        user.role = 'admin';
        userChanged = true;
      }
      if (userChanged) {
        await user.save();
      }
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }
      const token = generateToken(user._id);
      await logActivity(user._id, 'login', 'auth', { email: user.email });
      res.json(userPayload(user, { token }));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// @route   GET /api/auth/me
router.get('/me', protect, (req, res) => {
  // Prevent browser/CDN from serving a stale user (304) after role fixes or deploys.
  res.set({
    'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Authorization',
  });
  res.json(userPayload(req.user));
});

router.post(
  '/create-portal-user',
  protect,
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
    body('role').isIn(['student', 'parent']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password, fullName, role, linkedStudentId, parentOfStudentIds } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });

      const payload = { email, password, fullName, role };
      if (role === 'student' && linkedStudentId) payload.linkedStudentId = linkedStudentId;
      if (role === 'parent' && Array.isArray(parentOfStudentIds)) payload.parentOfStudentIds = parentOfStudentIds;

      const user = await User.create(payload);
      await logActivity(req.user._id, 'create_portal_user', 'auth', { target: user.email, role });
      res.status(201).json(userPayload(user));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
