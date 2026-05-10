import mongoose from 'mongoose';

const academicTermSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    semester: { type: Number, min: 1, max: 8 },
    year: { type: Number, required: true },
    enrollmentOpenAt: { type: Date, required: true },
    enrollmentCloseAt: { type: Date, required: true },
    addDropDeadline: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

academicTermSchema.index({ year: 1, semester: 1 });

export default mongoose.model('AcademicTerm', academicTermSchema);
