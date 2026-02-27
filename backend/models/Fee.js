import mongoose from 'mongoose';

const feePaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['semester', 'lab', 'library', 'other'], required: true },
  paidAt: { type: Date, default: Date.now },
  receiptNo: { type: String },
});

const feeSchema = new mongoose.Schema(
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
    semesterFee: {
      type: Number,
      required: true,
      default: 0,
    },
    labFee: {
      type: Number,
      default: 0,
    },
    libraryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentHistory: [feePaymentSchema],
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

feeSchema.index({ studentId: 1, semester: 1 }, { unique: true });

export default mongoose.model('Fee', feeSchema);
