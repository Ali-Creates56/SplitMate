import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // custom id to match frontend
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String }, // Hashed password
  avatarUrl: { type: String },
  isContact: { type: Boolean, default: false },
  deletionRequestedAt: { type: Date }
});

const GroupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  createdDate: { type: String },
  currency: { type: String, default: "Rs." },
  bgImage: { type: String },
  memberIds: [{ type: String }],
  createdByEmail: { type: String }
});

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "Rs." },
  description: { type: String },
  category: { type: String },
  paidBy: { type: String },
  date: { type: String },
  splitType: { type: String },
  shares: [{
    userId: String,
    amount: Number
  }],
  settledMembers: [{ type: String }]
});

const SettlementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true, index: true },
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "Rs." },
  date: { type: String },
  notes: { type: String }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  groupId: { type: String, index: true },
  groupName: { type: String },
  content: { type: String },
  timestamp: { type: String },
  type: { type: String },
  payload: { type: Object }
});

export const User = mongoose.model('User', UserSchema);
export const Group = mongoose.model('Group', GroupSchema);
export const Expense = mongoose.model('Expense', ExpenseSchema);
export const Settlement = mongoose.model('Settlement', SettlementSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
export { connectDB };
