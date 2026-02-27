import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, module, details = {}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      module,
      details,
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};
