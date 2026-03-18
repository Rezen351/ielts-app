import mongoose from 'mongoose';

export interface IIELTSContent extends mongoose.Document {
  module: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Examiner';
  title?: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: any; // Flexible JSON for different module formats
  createdAt: Date;
}

const IELTSContentSchema = new mongoose.Schema<IIELTSContent>({
  module: {
    type: String,
    required: true,
    enum: ['Listening', 'Reading', 'Writing', 'Speaking', 'Examiner'],
  },
  title: {
    type: String,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    default: 'Medium',
    enum: ['Easy', 'Medium', 'Hard'],
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Use the standard Next.js pattern to avoid re-compiling the model on hot-reloads
export default mongoose.models.IELTSContent || mongoose.model<IIELTSContent>('IELTSContent', IELTSContentSchema);
