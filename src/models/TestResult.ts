import mongoose from 'mongoose';

export interface ITestResult extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  module: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  topic: string;
  score: number;
  maxScore: number;
  data: any; // Detailed breakdown (e.g., criteria scores or question results)
  date: Date;
}

const TestResultSchema = new mongoose.Schema<ITestResult>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  module: {
    type: String,
    required: true,
    enum: ['Listening', 'Reading', 'Writing', 'Speaking'],
  },
  topic: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.TestResult || mongoose.model<ITestResult>('TestResult', TestResultSchema);
