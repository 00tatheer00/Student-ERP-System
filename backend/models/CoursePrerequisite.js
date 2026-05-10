import mongoose from 'mongoose';

const coursePrerequisiteSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    prerequisiteCourseCode: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

coursePrerequisiteSchema.index({ courseCode: 1, prerequisiteCourseCode: 1 }, { unique: true });

export default mongoose.model('CoursePrerequisite', coursePrerequisiteSchema);
