import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user?.isActive) {
      return res.status(401).json({ message: 'User account is deactivated' });
    }
    const emailLc = String(req.user.email || '').toLowerCase();
    if (
      (emailLc === 'admin@uop.edu.pk' || emailLc === 'admin@ucs.edu.pk') &&
      req.user.role !== 'admin'
    ) {
      await User.findByIdAndUpdate(req.user._id, { $set: { role: 'admin' } });
      req.user.role = 'admin';
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const ROLES = {
  admin: ['admin', 'teacher', 'reception', 'hod'],
  teacher: ['teacher'],
  reception: ['reception'],
  hod: ['hod'],
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    const userRole = req.user.role;
    if (allowedRoles.includes(userRole)) return next();
    return res.status(403).json({ message: 'Access denied for this role' });
  };
};
