import mongoose from 'mongoose';

const degreeRequirementSchema = new mongoose.Schema(
  {
    program: { type: String, enum: ['BS', 'MS'], required: true },
    department: { type: String, enum: ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'], required: true },
    title: { type: String, default: 'Default degree plan' },
    requiredCourseCodes: [{ type: String, uppercase: true, trim: true }],
  },
  { timestamps: true }
);

degreeRequirementSchema.index({ program: 1, department: 1 });

export default mongoose.model('DegreeRequirement', degreeRequirementSchema);
