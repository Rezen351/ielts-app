import mongoose from 'mongoose';

export interface IIELTSContent extends mongoose.Document {
  module: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: any; // Flexible JSON for different module formats
  createdAt: Date;
}

const IELTSContentSchema = new mongoose.Schema<IIELTSContent>({
  module: {
    type: String,
    required: true,
    enum: ['Listening', 'Reading', 'Writing', 'Speaking'],
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
  },
});

export default mongoose.models.IELTSContent || mongoose.model<IIELTSContent>('IELTSContent', IELTSContentSchema);
