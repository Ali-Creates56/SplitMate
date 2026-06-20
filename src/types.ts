export type Currency = "Rs." | "$";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  currency: Currency;
  bgImage?: string;
  memberIds: string[];
}

export type SplitType = "equal" | "unequal" | "percentage";

export interface ExpenseShare {
  userId: string;
  amount: number; // The calculated raw monetary value in PKR or USD
  ratio?: number; // e.g., percentage or absolute value if unequal
}

export interface Expense {
  id: string;
  groupId: string;
  amount: number; // Total amount paid
  currency: Currency;
  description: string;
  category: string;
  paidBy: string; // User ID who paid
  date: string;
  splitType: SplitType;
  shares: ExpenseShare[]; // Split share for each group member involved
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string; // The person owing and paying
  toUserId: string;   // The person receiving
  amount: number;
  currency: Currency;
  date: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  groupId: string;
  groupName: string;
  content: string;
  timestamp: string;
  type: "expense" | "settlement" | "group_add";
}

// Optimization suggestion structure
export interface SuggestedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// Complete dashboard stats
export interface UserDashboardStats {
  totalGroups: number;
  totalExpenses: number;
  amountOwed: number; // Positive (Others owe you)
  amountYouOwe: number; // Negative (You owe others)
  netBalance: number;
}
