import mongoose from 'mongoose';

const malpracticeLogSchema = new mongoose.Schema(
  {
    examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    reportedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('MalpracticeLog', malpracticeLogSchema);
