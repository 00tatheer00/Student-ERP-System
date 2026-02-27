import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Department', departmentSchema);
