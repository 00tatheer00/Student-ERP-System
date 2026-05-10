import mongoose from 'mongoose';

const examHallSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('ExamHall', examHallSchema);
