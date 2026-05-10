import mongoose from 'mongoose';

const serviceLedgerSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    module: { type: String, enum: ['library', 'hostel', 'transport'], required: true },
    entryType: { type: String, enum: ['charge', 'payment', 'adjustment'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    reference: { type: String, default: '' },
  },
  { timestamps: true }
);

serviceLedgerSchema.index({ studentId: 1, module: 1, createdAt: -1 });

export default mongoose.model('ServiceLedger', serviceLedgerSchema);
