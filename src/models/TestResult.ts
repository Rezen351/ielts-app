import mongoose from 'mongoose';

export interface ITestResult extends mongoose.Document {
  candidateName: string;
  testType: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  score: number;
  date: Date;
}

const TestResultSchema = new mongoose.Schema<ITestResult>({
  candidateName: {
    type: String,
    required: [true, 'Please provide a candidate name.'],
  },
  testType: {
    type: String,
    required: [true, 'Please specify the test type.'],
    enum: ['Listening', 'Reading', 'Writing', 'Speaking'],
  },
  score: {
    type: Number,
    required: [true, 'Please provide the score.'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.TestResult || mongoose.model<ITestResult>('TestResult', TestResultSchema);
