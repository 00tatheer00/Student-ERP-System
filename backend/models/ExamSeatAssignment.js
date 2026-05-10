import mongoose from 'mongoose';

const examSeatAssignmentSchema = new mongoose.Schema(
  {
    examSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    seatNumber: { type: Number, required: true, min: 1 },
    rowLabel: { type: String, default: '' },
  },
  { timestamps: true }
);

examSeatAssignmentSchema.index({ examSessionId: 1, studentId: 1 }, { unique: true });
examSeatAssignmentSchema.index({ examSessionId: 1, seatNumber: 1 }, { unique: true });

export default mongoose.model('ExamSeatAssignment', examSeatAssignmentSchema);
