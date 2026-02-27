import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      enum: ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'],
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    creditHours: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
