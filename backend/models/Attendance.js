import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present',
    },
    method: {
      type: String,
      enum: ['qr', 'manual', 'biometric'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

// Prevent double attendance same day for same course
attendanceSchema.index({ studentId: 1, courseCode: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
