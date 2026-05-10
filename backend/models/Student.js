import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    CNIC: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      enum: ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'],
      required: true,
    },
    program: {
      type: String,
      enum: ['BS', 'MS'],
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    batch: {
      type: Number,
      required: true,
      min: 2020,
      max: 2030,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    consentProcessing: {
      type: Boolean,
      default: true,
    },
    consentMarketing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-generate studentId before save
studentSchema.pre('save', async function (next) {
  if (!this.isNew || this.studentId) return next();
  const count = await mongoose.model('Student').countDocuments();
  const deptCode = this.department || 'CS';
  const seq = String(count + 1).padStart(3, '0');
  this.studentId = `UCS-${deptCode}-${seq}`;
  next();
});

export default mongoose.model('Student', studentSchema);
