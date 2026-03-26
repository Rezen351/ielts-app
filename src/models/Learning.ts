import mongoose from 'mongoose';

// 1. Model for individual learning topics/materials
export interface ILearningMaterial extends mongoose.Document {
  topicId: string; // e.g., 'writing-task-2-cohesion'
  title: string;
  category: 'Writing' | 'Speaking' | 'Reading' | 'Listening' | 'Grammar' | 'Vocabulary';
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  content: {
    sections: {
      heading: string;
      body: string;
      miniExplainer?: string;
    }[];
  };
  quickCheck: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  flashcards: {
    front: string;
    back: string;
    tag: string;
  }[];
  createdAt: Date;
}

const LearningMaterialSchema = new mongoose.Schema<ILearningMaterial>({
  topicId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Writing', 'Speaking', 'Reading', 'Listening', 'Grammar', 'Vocabulary'],
    required: true 
  },
  difficultyLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true 
  },
  content: {
    sections: [{
      heading: String,
      body: String,
      miniExplainer: String
    }]
  },
  quickCheck: [{
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String
  }],
  flashcards: [{
    front: String,
    back: String,
    tag: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// 2. Model for User's Personalized Roadmap
export interface IUserRoadmap extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  baselineBand: number; // Calculated from diagnostic
  status: 'Diagnostic_Pending' | 'Active' | 'Completed' | 'Milestone_Pending' | 'Remedial';
  topics: {
    topicId: string;
    title: string;
    status: 'Locked' | 'Available' | 'Completed';
    order: number;
    score?: number; // From quick check
  }[];
  masteryScore?: number;
  masteryAnalysis?: string; // AI generated feedback on weaknesses
  milestoneQuiz?: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      topicId: string; // To track which topic this question belongs to
    }[];
    userAnswers?: string[];
  };
  milestonePassed?: boolean;
  lastUpdated: Date;
}

const UserRoadmapSchema = new mongoose.Schema<IUserRoadmap>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  baselineBand: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Diagnostic_Pending', 'Active', 'Completed', 'Milestone_Pending', 'Remedial'],
    default: 'Diagnostic_Pending' 
  },
  topics: [{
    topicId: String,
    title: String,
    status: { type: String, enum: ['Locked', 'Available', 'Completed'], default: 'Locked' },
    order: Number,
    score: Number
  }],
  masteryScore: Number,
  masteryAnalysis: String,
  milestoneQuiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String,
      topicId: String
    }],
    userAnswers: [String]
  },
  milestonePassed: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});

export const LearningMaterial = mongoose.models.LearningMaterial || mongoose.model<ILearningMaterial>('LearningMaterial', LearningMaterialSchema);
export const UserRoadmap = mongoose.models.UserRoadmap || mongoose.model<IUserRoadmap>('UserRoadmap', UserRoadmapSchema);
