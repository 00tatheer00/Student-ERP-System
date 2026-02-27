import mongoose from 'mongoose';

const courseResultSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'F'],
  },
  creditHours: {
    type: Number,
    required: true,
  },
});

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    courses: [courseResultSchema],
    GPA: {
      type: Number,
      min: 0,
      max: 4,
    },
    CGPA: {
      type: Number,
      min: 0,
      max: 4,
    },
  },
  { timestamps: true }
);

resultSchema.index({ studentId: 1, semester: 1 }, { unique: true });

export default mongoose.model('Result', resultSchema);
