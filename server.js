import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { connectDB, User, Group, Expense, Settlement, Notification } from "./db.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({ origin: "*" })); // Allow Capacitor mobile clients to connect
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
}
app.use(mongoSanitize());
app.use(express.json({ limit: "50mb" }));

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Memory store for OTPs
const otps = {};

// Gemini Client removed

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_EMAIL || "", pass: process.env.SMTP_PASSWORD || "" }
});

const sendProfessionalEmail = async (to, subject, otp, message) => {
  const htmlTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="cid:splitmate_logo" alt="SplitMate Logo" style="width: 80px; height: 80px; border-radius: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);" />
    <h1 style="color: #0f172a; margin-top: 16px; font-size: 24px; font-weight: 700;">SplitMate</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); text-align: center;">
    <h2 style="color: #334155; font-size: 20px; margin-bottom: 16px;">${subject}</h2>
    <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">${message}</p>
    
    <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${otp}</span>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px;">This code will expire in 10 minutes. Please do not share it with anyone.</p>
  </div>
  
  <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px; line-height: 1.6;">
    <p>© ${new Date().getFullYear()} SplitMate Inc. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</div>`;

  await transporter.sendMail({
    from: '"SplitMate Support" <noreply@splitmate.com>',
    replyTo: "noreply@splitmate.com",
    to,
    subject,
    html: htmlTemplate,
    attachments: [{
      filename: 'favicon.png',
      path: path.join(process.cwd(), 'public', 'favicon.png'),
      cid: 'splitmate_logo'
    }]
  });
};

// Net Balance Calculator (Async Database Query)
async function calculateGroupBalances(groupId, preFetchedGroup, preFetchedExpenses, preFetchedSettlements) {
  const group = preFetchedGroup || await Group.findOne({ id: groupId });
  if (!group) return {};
  const balances = {};
  group.memberIds.forEach((id) => balances[id] = 0);
  
  const groupExpenses = preFetchedExpenses || await Expense.find({ groupId });
  groupExpenses.forEach((exp) => {
    const payer = exp.paidBy;
    if (balances[payer] !== undefined) balances[payer] += exp.amount;
    exp.shares.forEach((share) => {
      const debtor = share.userId;
      if (balances[debtor] !== undefined) balances[debtor] -= share.amount;
      
      // Feature: If the debtor has marked their share as settled for this specific expense
      // we act as if a settlement of 'share.amount' happened from debtor to payer.
      if (exp.settledMembers && exp.settledMembers.includes(debtor)) {
        if (balances[debtor] !== undefined) balances[debtor] += share.amount; // debtor's balance is restored
        if (balances[payer] !== undefined) balances[payer] -= share.amount;   // payer's expected receive is reduced
      }
    });
  });

  const groupSettlements = preFetchedSettlements || await Settlement.find({ groupId });
  groupSettlements.forEach((set) => {
    if (balances[set.fromUserId] !== undefined) balances[set.fromUserId] += set.amount;
    if (balances[set.toUserId] !== undefined) balances[set.toUserId] -= set.amount;
  });
  return balances;
}

async function getSuggestedGroupSettlements(groupId, preFetchedGroup, preFetchedExpenses, preFetchedSettlements) {
  const balances = await calculateGroupBalances(groupId, preFetchedGroup, preFetchedExpenses, preFetchedSettlements);
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([userId, bal]) => {
    if (bal > 0.01) creditors.push({ userId, amount: bal });
    else if (bal < -0.01) debtors.push({ userId, amount: Math.abs(bal) });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const suggested = [];
  let cIdx = 0, dIdx = 0;
  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];
    const payAmount = Math.min(creditor.amount, debtor.amount);
    if (payAmount > 0.01) {
      suggested.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Number(payAmount.toFixed(2))
      });
    }
    creditor.amount -= payAmount;
    debtor.amount -= payAmount;
    if (creditor.amount <= 0.01) cIdx++;
    if (debtor.amount <= 0.01) dIdx++;
  }
  return suggested;
}

// API ENDPOINTS

app.get("/api/currentUser", async (req, res) => {
  const userId = req.query.id;
  if (!userId) return res.status(401).json({ error: "Not logged in" });
  const user = await User.findOne({ id: userId });
  if (!user) return res.status(401).json({ error: "Not logged in" });
  res.json(user);
});

app.post("/api/profile/update", async (req, res) => {
  const { id, name, email, avatarUrl } = req.body;
  const user = await User.findOneAndUpdate({ id }, { name, email, avatarUrl }, { new: true });
  if (user) return res.json({ success: true, user });
  res.status(404).json({ error: "Current user not found" });
});

app.post("/api/profile/delete-request", async (req, res) => {
  const { id } = req.body;
  const user = await User.findOneAndUpdate({ id }, { deletionRequestedAt: new Date() }, { new: true });
  if (user) return res.json({ success: true, user });
  res.status(404).json({ error: "User not found" });
});

app.post("/api/profile/reactivate", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { $unset: { deletionRequestedAt: 1 } }, { new: true });
  if (user) return res.json({ success: true, user });
  res.status(404).json({ error: "User not found" });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// --- AUTHENTICATION ---
app.post("/api/auth/register-request", async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "Name, Email, and Password required" });
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ error: "Email already registered" });
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email.toLowerCase()] = { otp, name, password }; // temporarily store password
  
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    await sendProfessionalEmail(
      email, 
      "Secure Registration OTP", 
      otp, 
      "Welcome to SplitMate! To complete your secure account registration, please use the following One-Time Password."
    );
  } else {
    console.log(`[SIMULATED EMAIL] To: ${email} | OTP: ${otp}`);
  }
  res.json({ success: true, simulated: !process.env.SMTP_EMAIL });
});

app.post("/api/auth/register-verify", async (req, res) => {
  const { email, otp } = req.body;
  const target = email.toLowerCase();
  const session = otps[target];
  if (!session || session.otp !== otp) return res.status(400).json({ error: "Invalid or expired OTP" });
  
  const hashedPassword = await bcrypt.hash(session.password, 10);
  
  // Wipe only dummy data (Groups, Expenses, Settlements, Notifications) to give the new user a clean slate
  await Group.deleteMany({});
  await Expense.deleteMany({});
  await Settlement.deleteMany({});
  await Notification.deleteMany({});

  const newUser = new User({
    id: "you",
    name: session.name,
    email: target,
    password: hashedPassword,
    avatarUrl: "/default_avatar.webp"
  });
  await newUser.save();
  delete otps[target];
  res.json({ success: true, user: newUser });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // Hardcoded Admin Access
  if (email.toLowerCase() === "learner12you@gmail.com" && password === "ChalmeraPutt") {
    return res.json({ success: true, user: { id: "admin", role: "admin", email: "learner12you@gmail.com", name: "Admin" } });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ error: "User not registered. Please register to login." });
  if (!user.password) return res.status(400).json({ error: "Invalid Username or Password" });
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid Username or Password" });

  // Soft Deletion Check (10-day cooldown)
  if (user.deletionRequestedAt) {
    const daysSinceDeletion = (Date.now() - new Date(user.deletionRequestedAt).getTime()) / (1000 * 3600 * 24);
    if (daysSinceDeletion > 10) {
      // Past 10 days - delete permanently
      await User.deleteOne({ id: user.id });
      return res.status(400).json({ error: "Account has been permanently deleted after 10 days." });
    } else {
      // Within 10 days - prompt for reactivation
      return res.json({ success: false, reactivate: true, daysRemaining: Math.ceil(10 - daysSinceDeletion), email: user.email });
    }
  }
  
  res.json({ success: true, user });
});

app.post("/api/auth/forgot-password-request", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ error: "Email not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email.toLowerCase()] = { otp, reset: true };

  if (process.env.SMTP_EMAIL) {
    await sendProfessionalEmail(
      email, 
      "Password Reset Request", 
      otp, 
      "We received a request to reset the password for your SplitMate account. Please use the following One-Time Password to proceed."
    );
  } else {
    console.log(`[SIMULATED EMAIL] To: ${email} | RESET OTP: ${otp}`);
  }
  res.json({ success: true });
});

app.post("/api/auth/forgot-password-verify", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const target = email.toLowerCase();
  const session = otps[target];
  if (!session || session.otp !== otp || !session.reset) return res.status(400).json({ error: "Invalid OTP" });
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email: target }, { password: hashedPassword });
  delete otps[target];
  res.json({ success: true });
});

// --- ADMIN ENDPOINTS ---
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGroups = await Group.countDocuments();
    const expenses = await Expense.find({});
    const totalVolume = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ success: true, totalUsers, totalGroups, totalVolume });
  } catch (err) {
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

// --- CORE API ENDPOINTS ---

app.get("/api/groups", async (req, res) => {
  console.time('api_groups');
  console.time('groups_query');
  const userGroups = await Group.find({ memberIds: "you" });
  console.timeEnd('groups_query');

  console.time('users_query');
  const allUsers = await User.find({});
  console.timeEnd('users_query');

  const formattedGroups = await Promise.all(userGroups.map(async (g) => {
    const groupExpenses = await Expense.find({ groupId: g.id });
    const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balances = await calculateGroupBalances(g.id, g, groupExpenses, null);
    const userBalance = balances["you"] || 0;
    const members = allUsers.filter((u) => g.memberIds.includes(u.id));
    return { ...g.toObject(), totalSpend, userBalance, members };
  }));
  
  console.timeEnd('api_groups');
  res.json(formattedGroups);
});

app.get("/api/groups/:id", async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ id });
  if (!group) return res.status(404).json({ error: "Group not found" });

  const [groupExpenses, groupSettlements, allUsers] = await Promise.all([
    Expense.find({ groupId: id }),
    Settlement.find({ groupId: id }),
    User.find({ id: { $in: group.memberIds } }) // Optimization: Only load members
  ]);
  
  // Need users who paid for expenses or made settlements even if they left the group?
  // Let's just load all users for the hydration since it's a small collection usually, 
  // but to be safe, let's load all users.
  const users = await User.find({});

  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balances = await calculateGroupBalances(id, group, groupExpenses, groupSettlements);
  const suggestedSettlements = await getSuggestedGroupSettlements(id, group, groupExpenses, groupSettlements);

  const hydratedBalances = Object.entries(balances).map(([userId, bal]) => {
    const user = users.find((u) => u.id === userId);
    return { userId, name: user ? user.name : userId, avatarUrl: user ? user.avatarUrl : "", balance: bal };
  });

  const hydratedExpenses = groupExpenses.map((exp) => {
    const payer = users.find((u) => u.id === exp.paidBy);
    return { ...exp.toObject(), payerName: payer ? payer.name : exp.paidBy, payerAvatar: payer ? payer.avatarUrl : "" };
  });

  const hydratedSettlements = groupSettlements.map((set) => {
    const fromUser = users.find((u) => u.id === set.fromUserId);
    const toUser = users.find((u) => u.id === set.toUserId);
    return { ...set.toObject(), fromName: fromUser ? fromUser.name : set.fromUserId, toName: toUser ? toUser.name : set.toUserId };
  });

  const members = users.filter((u) => group.memberIds.includes(u.id));
  res.json({ group: group.toObject(), totalSpend, expenses: hydratedExpenses, settlements: hydratedSettlements, balances: hydratedBalances, suggestedSettlements, members });
});

app.post("/api/groups", async (req, res) => {
  const { name, description, currency, memberIds } = req.body;
  const currentUser = await User.findOne({ id: "you" });

  const freshGroup = new Group({
    id: name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now(),
    name,
    description: description || "Direct expense calculations",
    createdDate: new Date().toISOString().split('T')[0],
    currency: currency || "Rs.",
    memberIds: Array.from(new Set(["you", ...(memberIds || [])])),
    createdByEmail: currentUser ? currentUser.email : "ma7114338@gmail.com"
  });
  await freshGroup.save();

  const notif = new Notification({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: freshGroup.id,
    groupName: freshGroup.name,
    content: `You created a new group: '${freshGroup.name}'`,
    timestamp: new Date().toISOString(),
    type: "group_add"
  });
  await notif.save();
  res.json({ success: true, group: freshGroup.toObject() });
});

app.post("/api/groups/:id/members", async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  const group = await Group.findOne({ id });
  if (!group) return res.status(404).json({ error: "Group not found" });

  if (userIds && Array.isArray(userIds)) {
    userIds.forEach((uid) => {
      if (!group.memberIds.includes(uid)) group.memberIds.push(uid);
    });
    await group.save();
    const notif = new Notification({
      id: "notif_" + Date.now(),
      userId: "you",
      groupId: group.id,
      groupName: group.name,
      content: `New members joined '${group.name}'`,
      timestamp: new Date().toISOString(),
      type: "group_add"
    });
    await notif.save();
    return res.json({ success: true, group: group.toObject() });
  }
  res.status(400).json({ error: "Invalid userIds provided" });
});

app.delete("/api/groups/:id", async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ id });
  if (!group) return res.status(404).json({ error: "Group not found" });

  const currentUser = await User.findOne({ id: "you" });
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

  if (group.createdByEmail !== currentUser.email) {
    return res.status(403).json({ error: "Only the group author can delete this group!" });
  }

  // VALIDATION: Check if payments are balanced
  const balances = await calculateGroupBalances(id, group, null, null);
  const unbalanced = Object.values(balances).some(bal => Math.abs(bal) > 0.01);
  if (unbalanced) {
    return res.status(400).json({ error: "Cannot delete group. All member balances must be zero (fully settled) first." });
  }

  await Group.deleteOne({ id });
  await Expense.deleteMany({ groupId: id });
  await Settlement.deleteMany({ groupId: id });

  const notif = new Notification({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: id,
    groupName: group.name,
    content: `Group '${group.name}' has been deleted by its author ${currentUser.name}.`,
    timestamp: new Date().toISOString(),
    type: "group_delete"
  });
  await notif.save();
  res.json({ success: true });
});

// --- EXPENSES, SETTLEMENTS, CONTACTS & MORE ---

app.post("/api/expenses", async (req, res) => {
  const { groupId, amount, currency, description, category, paidBy, splitType, shares, involvedMembers } = req.body;
  const group = await Group.findOne({ id: groupId });
  if (!group) return res.status(444).json({ error: "Group does not exist" });

  const numericalAmount = Number(amount);
  if (!numericalAmount || isNaN(numericalAmount)) return res.status(400).json({ error: "Valid amount is required" });

  let finalShares = [];
  const participants = involvedMembers && Array.isArray(involvedMembers) ? involvedMembers : group.memberIds;

  if (splitType === "equal") {
    const equalShare = Number((numericalAmount / participants.length).toFixed(2));
    finalShares = participants.map((uid) => ({ userId: uid, amount: equalShare }));
  } else if (splitType === "percentage") {
    finalShares = participants.map((uid) => {
      const userShareRatio = shares?.find((s) => s.userId === uid)?.ratio || 0;
      return { userId: uid, amount: Number((userShareRatio * numericalAmount / 100).toFixed(2)) };
    });
  } else if (splitType === "unequal") {
    finalShares = participants.map((uid) => {
      const absoluteAmount = Number(shares?.find((s) => s.userId === uid)?.ratio || 0);
      return { userId: uid, amount: absoluteAmount };
    });
  }

  const finalExpense = new Expense({
    id: "exp_" + Date.now(),
    groupId,
    amount: numericalAmount,
    currency: currency || group.currency,
    description: description || "Shared expense block",
    category: category || "General",
    paidBy: paidBy || "you",
    date: new Date().toISOString().split('T')[0],
    splitType,
    shares: finalShares
  });
  await finalExpense.save();

  const payer = await User.findOne({ id: finalExpense.paidBy });
  const notif = new Notification({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: group.id,
    groupName: group.name,
    content: `${payer ? payer.name : "Someone"} added a ${finalExpense.currency}${finalExpense.amount} expense for '${finalExpense.description}'`,
    timestamp: new Date().toISOString(),
    type: "expense",
    payload: {
      ...finalExpense.toObject(),
      payerName: payer ? payer.name : "Someone"
    }
  });
  await notif.save();
  res.json({ success: true, expense: finalExpense.toObject() });
});

app.post("/api/expenses/:id/settle", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const exp = await Expense.findOne({ id });
  if (!exp) return res.status(404).json({ error: "Expense not found" });

  if (!exp.settledMembers) {
    // Force set it directly if undefined on mongoose doc
    exp.set('settledMembers', []);
  }
  if (!exp.settledMembers.includes(userId)) {
    exp.settledMembers.push(userId);
    exp.markModified('settledMembers');
    await exp.save();
  }
  res.json({ success: true, expense: exp.toObject() });
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const exp = await Expense.findOne({ id });
  if (!exp) return res.status(404).json({ error: "Expense not found" });

  await Expense.deleteOne({ id });
  const notif = new Notification({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: exp.groupId,
    groupName: "Group",
    content: `Expense '${exp.description}' of ${exp.currency}${exp.amount} was deleted.`,
    timestamp: new Date().toISOString(),
    type: "expense"
  });
  await notif.save();
  res.json({ success: true });
});

app.post("/api/settlements", async (req, res) => {
  const { groupId, fromUserId, toUserId, amount, currency, notes } = req.body;
  const group = await Group.findOne({ id: groupId });
  if (!group) return res.status(444).json({ error: "Group does not exist" });

  const senderId = fromUserId || "you";
  if (senderId !== "you" && toUserId !== "you") {
    return res.status(403).json({ error: "You can only settle your own debts and balances!" });
  }

  const numericalAmount = Number(amount);
  if (!numericalAmount || isNaN(numericalAmount)) return res.status(400).json({ error: "Valid amount is required" });

  const freshSettlement = new Settlement({
    id: "set_" + Date.now(),
    groupId,
    fromUserId: senderId,
    toUserId,
    amount: numericalAmount,
    currency: currency || group.currency,
    date: new Date().toISOString().split('T')[0],
    notes: notes || "Balances Settled"
  });
  await freshSettlement.save();

  const sender = await User.findOne({ id: freshSettlement.fromUserId });
  const receiver = await User.findOne({ id: freshSettlement.toUserId });

  const notif = new Notification({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: group.id,
    groupName: group.name,
    content: `${sender ? sender.name : "A user"} settled ${freshSettlement.currency}${freshSettlement.amount} with ${receiver ? receiver.name : "receiver"}`,
    timestamp: new Date().toISOString(),
    type: "settlement",
    payload: {
      ...freshSettlement.toObject(),
      fromName: sender ? sender.name : "A user",
      toName: receiver ? receiver.name : "receiver"
    }
  });
  await notif.save();

  const remainingSuggestions = await getSuggestedGroupSettlements(groupId);
  if (remainingSuggestions.length === 0) {
    await Expense.deleteMany({ groupId });
    const cleanNotif = new Notification({
      id: "notif_clean_" + Date.now(),
      userId: "you",
      groupId: group.id,
      groupName: group.name,
      content: `Memory cleared: All expenses inside '${group.name}' were automatically recycled after full settlement!`,
      timestamp: new Date().toISOString(),
      type: "group_sys"
    });
    await cleanNotif.save();
  }

  res.json({ success: true, settlement: freshSettlement.toObject() });
});

app.post("/api/contacts", async (req, res) => {
  const { name, email, avatarUrl } = req.body;
  const newContact = new User({
    id: name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000),
    name,
    email: email || "",
    avatarUrl: avatarUrl || "/default_avatar.webp",
    isContact: true
  });
  await newContact.save();
  res.json({ success: true, contact: newContact.toObject() });
});

app.delete("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "you") return res.status(400).json({ error: "Cannot delete the profile owner" });

  const groupsWithUser = await Group.find({ memberIds: id });
  let hasBalance = false;
  for (const group of groupsWithUser) {
    const balances = await calculateGroupBalances(group.id, group, null, null);
    const userBal = balances[id] || 0;
    if (Math.abs(userBal) > 0.01) {
      hasBalance = true;
      break;
    }
  }

  if (hasBalance) {
    return res.status(400).json({ error: "Cannot delete member. They have an outstanding balance." });
  }

  await User.deleteOne({ id });
  for (const group of groupsWithUser) {
    await Group.findOneAndUpdate({ id: group.id }, { $pull: { memberIds: id } });
  }
  res.json({ success: true });
});

app.get("/api/notifications", async (req, res) => {
  const notifs = await Notification.find({}).sort({ timestamp: -1 });
  res.json(notifs);
});

app.delete("/api/notifications/:id", async (req, res) => {
  const { id } = req.params;
  await Notification.deleteOne({ id });
  res.json({ success: true });
});

app.post("/api/notifications/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "Invalid IDs" });
  await Notification.deleteMany({ id: { $in: ids } });
  res.json({ success: true });
});




async function start() {
  if (process.env.VERCEL) return; // Do not start the listener in Vercel Serverless environment

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SplitMate Server running on http://localhost:${PORT}`);
  });
}

start();

export default app;
