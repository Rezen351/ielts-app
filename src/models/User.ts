import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  nativeLanguage: string;
  hobbies: string[];
  occupation: string;
  goalBand: number;
  progress: {
    [module: string]: {
      difficulty: 'Easy' | 'Medium' | 'Hard';
      level: number;
    };
  };
  createdAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please provide your full name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: [6, 'Password should be at least 6 characters long.'],
    select: false,
  },
  nativeLanguage: {
    type: String,
    default: 'id', // Default to Indonesia
  },
  hobbies: {
    type: [String],
    default: [],
  },
  occupation: {
    type: String,
    default: 'Student',
  },
  goalBand: {
    type: Number,
    default: 7.0,
  },
  progress: {
    type: Map,
    of: {
      difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy',
      },
      level: {
        type: Number,
        default: 1,
      },
    },
    default: {
      Listening: { difficulty: 'Easy', level: 1 },
      Reading: { difficulty: 'Easy', level: 1 },
      Writing: { difficulty: 'Easy', level: 1 },
      Speaking: { difficulty: 'Easy', level: 1 },
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.User) {
  delete (mongoose.models as any).User;
}

export default mongoose.model<IUser>('User', UserSchema);
