import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    academicTermId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    status: { type: String, enum: ['enrolled', 'dropped'], default: 'enrolled' },
    droppedAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index(
  { studentId: 1, courseCode: 1, academicTermId: 1 },
  { unique: true, partialFilterExpression: { status: 'enrolled' } }
);

export default mongoose.model('Enrollment', enrollmentSchema);
