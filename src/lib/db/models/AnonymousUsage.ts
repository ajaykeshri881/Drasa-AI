import mongoose from 'mongoose';

export interface IAnonymousUsage extends mongoose.Document {
  ip: string;
  tokensUsedThisMonth: number;
  tokensUsedToday: number;
  lastMonthlyResetDate: Date;
  lastDailyResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnonymousUsageSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tokensUsedThisMonth: {
    type: Number,
    default: 0,
  },
  tokensUsedToday: {
    type: Number,
    default: 0,
  },
  lastMonthlyResetDate: {
    type: Date,
    default: Date.now,
  },
  lastDailyResetDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const AnonymousUsage = mongoose.models.AnonymousUsage || mongoose.model<IAnonymousUsage>('AnonymousUsage', AnonymousUsageSchema);
