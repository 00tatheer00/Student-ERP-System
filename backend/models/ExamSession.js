import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseCode: { type: String, required: true, uppercase: true },
    scheduledAt: { type: Date, required: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamHall', required: true },
    academicTermId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicTerm' },
    seatPlanGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ExamSession', examSessionSchema);
