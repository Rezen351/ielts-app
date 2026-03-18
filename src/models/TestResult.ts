import mongoose from 'mongoose';

export interface ITestResult extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  module: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  topic: string;
  score: number;
  maxScore: number;
  data: any;
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
    index: true,
  },
});

TestResultSchema.index({ userId: 1, date: -1 });

// Use a unique name or clear the model if it exists to force update the schema
// Next.js hot reloading often keeps the old schema in memory
if (mongoose.models.TestResult) {
  delete (mongoose.models as any).TestResult;
}

export default mongoose.model<ITestResult>('TestResult', TestResultSchema);
