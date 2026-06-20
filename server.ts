import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Firestore } from "@google-cloud/firestore";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "data.json");

// --- FIREBASE CONFIGURATION & INITIALIZATION ---
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = null;
let db: Firestore | null = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    console.log("Loaded Firebase Applet configuration for project:", firebaseConfig.projectId);
    db = new Firestore({
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId
    });
    console.log("Firestore client initialized with databaseID:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("Failed to parse firebase-applet-config.json", err);
  }
} else {
  console.log("No firebase-applet-config.json configuration found. Using fallback in-memory/JSON store.");
}

// Global cached state synced from Firestore on startup
let cachedState: DBState = {
  users: [],
  groups: [],
  expenses: [],
  settlements: [],
  notifications: []
};

// Known IDs in Firestore to compute deltas and deletions during background synchronization
const knownIds = {
  users: new Set<string>(),
  groups: new Set<string>(),
  expenses: new Set<string>(),
  settlements: new Set<string>(),
  notifications: new Set<string>()
};

// Initialize Gemini Client Lazily & Safely
let ai: any = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return ai;
}

app.use(express.json());

// --- IN-MEMORY & FILE PERSISTENCE STATE ---
interface DBState {
  users: any[];
  groups: any[];
  expenses: any[];
  settlements: any[];
  notifications: any[];
}

const DEFAULT_STATE: DBState = {
  users: [
    {
      id: "you",
      name: "Ali",
      email: "ma7114338@gmail.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBnA1LwLS-6-DZaYewtqh9s95R0dJWkWNMgruMNcrx4jB6-pkpMsI1UYJWYhfvinRHJMUCfO4Fl24jrGntOuDfDrjvQDkrwP6oz_FQv6yV906lQSwfoOsNcJetQNkVWxLBKQkqgmyrYtJlHfAvGkV9Bo6rYhV7H50J2tqMqB7XiQN1Vo4VfPdTd_imMW86UkO9Yk9usuU6tIW6JNAdFi-YtEds0iiFKUONv6PyQciurFCsF-PXCy3JjFiRZpge60FZrL8V2-9OlZQY"
    },
    {
      id: "sarah",
      name: "Sarah Jenkins",
      email: "sarah@splitmate.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMTZvmtbUorA4vpT5ttCLXi9TCt9EYp02ZArUNhZwrpBD57IsrA4akCHrICpSuAYv04JMCa0jxOiINCNd4UK1kiDhQM9TY74cmDJY-85d3YFaqx83Dq3sA1XFTrhSVAmxJloqitj3_DaxrHi8EPVQ4dpJPUIIJ99kljWa0xtMoNhdas_x8456Seb_41mRxv-cyjlAVHbDhZ4grHQy8wfEn-LYTeOjKHv8oSACKRYY-8Wv51gXhT0GnAaIs2ETEqF4RwK6D4AqScXM"
    },
    {
      id: "mike",
      name: "Mike Chen",
      email: "mike@splitmate.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuADIIP6OaGyl92ADQjzptTzZXdfnh53I-CKSu9cDcbYBtj0i5Stn0FYGvUsOks14vut1osiNG-itesA6UrEakt-TnbubdHH2vgUlMqs-NPRBzvNiUvChsp_ApH2eksQSPK3cYGudH-LHfjC28u4OHajNhC4Y2-SZB88ICOBhnK2WOOUEa-BeW3jU037Gdj8ftKB9L2s9vXLab_Y8pAZ_X_LoBlPwbdJE4-0uRgp9kB5LBnzZ4Ohz0Lyfvob336nfsIavTHjRthhLJE"
    },
    {
      id: "usman",
      name: "Usman Ahmed",
      email: "usman@splitmate.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBR7ArrY4lwQ4tmCQPwEynPkTElr9NpXpZ3i-S6d78O6rBH8CU3_q0rjOi4Vrh0k1Oqzo7MvYL6KlG2nS88DBGozJPKv-Z_TVs_duraffOBpnJc2pgzEgg_c_BJItk38OwqUyHyKGjDsyo6G3TuZEihbFKPTVwfdbV6p9CcR9DT-1pGoNSGJwWJVVN5K0Mb_ij1XZVby80tZi2mgTC05PT21Q2KnpZfJfhBO6mIvS0QpLblQS1PxEMPTp2OTPIrXczt_2d-jqG_zgI"
    },
    {
      id: "ahmed",
      name: "Ahmed",
      email: "ahmed@splitmate.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHAz3Ea7qRu2f3VL5fRlUBsnQnoNki3PnmVZqP-P3cPSueJuIiOTSEmcEraN3rjYOIyzXnOx5WeE7Q38XeRvQPz6a5XyQvWf9BmuOiVqb9lCI9iYqcs6wspK9M1sdefxAiiHBawJOM8twCdH-o83CyhhfYGdRUK4X4f36k8N5nPd4VKWbRBewFpYmLJFOqE0FfJszG9b11vGI4JTqzOUjj0Ey7NGFu15O5sFKaBORiq_LgJ6Nqc7cieDBCwNKx0YA1qLcK1YZsSC0"
    }
  ],
  groups: [
    {
      id: "roommates",
      name: "Roommates",
      description: "Apartment food, utility bills and rent split",
      createdDate: "2026-05-15",
      currency: "$",
      bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjze4an5dRuTUSf4agOA_qZ4AT6-KojfnkUADZgQEWhyObcd6gz_SVOSmwH1qS_zm5sAJX32ArjZ0MooqIo49QecyHGD2VciNwTksmOSA2aX_DjuhE5l4YQ1BfLNdBwPDjjGebqY2Ywg43yh0KBk5GsmJS95DbQtAVQvd-CsC4O-rI2pmBrvIGgxnvDQpvTBJj_B97_jRFo5yYIl9X30HxDkwyOXLSfu_nqPAFHv2mn4U__gyRaJvAhbji48MUQNjKtBC03c-XRvQ",
      memberIds: ["you", "sarah", "mike", "usman"],
      createdByEmail: "mike@splitmate.com"
    },
    {
      id: "dubai_trip",
      name: "Dubai Trip",
      description: "Dubai getaway, beach clubs & taxi bills",
      createdDate: "2026-06-12",
      currency: "$",
      bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCd0jnl2Wof2AUuNET3ez5S_d24F3ur-IPmQ7K0W9tB_VDQXQTqNDxYdW3oSu6Sc7B7iyu0MZwxhHTJFoJbYwoSKxKojFFaMrE4vnQCR_DQ5h0L5K4Zn5oKMt-MSVd3QnKZCm3kY3dF2KcdL-6Ljy9AfAp8gal36omAPLbJpFVduusvWRtDeqJiw2xvGAjlZie7qZOBajH6-amS_eUYOVnhcSXtP57sDIXv9-9Fo3WsUbHOhOFiTekPDCE0Pr91_QvDKXOYfRdcHSs",
      memberIds: ["you", "sarah", "mike"],
      createdByEmail: "sarah@splitmate.com"
    },
    {
      id: "fyp_team",
      name: "FYP Team",
      description: "Final Year Project printing & prototype costs",
      createdDate: "2026-06-10",
      currency: "Rs.",
      bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtf3lXPReiBek8D8pn3lDYZG0k3Yw-rqrpGImKHwBh-EPvCxElGw5uO6fPUL3perYP6QiLPWijHElqOJiqF-rmbZzFrGmSy4IEPa4yo8OXxTTTbVUguDheZI2Rv6J4Ur3Hgmw89jMox3A0MHFQ1Cja4xw3o1LRXvyh86fv78LChTX-SbiMfzjFIRyruHnZcfcjD0SJWmCKD7XJw8IOKeCiL4Lo8jGS40x8RTs7IsbRiomzaFristlRd9LBxIQOVCm_pJxoubg7GFI",
      memberIds: ["you", "usman"],
      createdByEmail: "ma7114338@gmail.com"
    }
  ],
  expenses: [
    {
      id: "exp1",
      groupId: "roommates",
      amount: 1200,
      currency: "$",
      description: "Monthly apartment rent block",
      category: "Housing",
      paidBy: "mike",
      date: "2026-06-01",
      splitType: "equal",
      shares: [
        { userId: "you", amount: 300 },
        { userId: "sarah", amount: 300 },
        { userId: "mike", amount: 300 },
        { userId: "usman", amount: 300 }
      ]
    },
    {
      id: "exp2",
      groupId: "roommates",
      amount: 40,
      currency: "$",
      description: "Pizza night roommate gathering",
      category: "Food",
      paidBy: "sarah",
      date: "2026-06-18",
      splitType: "equal",
      shares: [
        { userId: "you", amount: 10 },
        { userId: "sarah", amount: 10 },
        { userId: "mike", amount: 10 },
        { userId: "usman", amount: 10 }
      ]
    },
    {
      id: "exp3",
      groupId: "dubai_trip",
      amount: 3000,
      currency: "$",
      description: "Luxury hotel suite & villa booking",
      category: "Housing",
      paidBy: "you",
      date: "2026-06-13",
      splitType: "equal",
      shares: [
        { userId: "you", amount: 1000 },
        { userId: "sarah", amount: 1000 },
        { userId: "mike", amount: 1000 }
      ]
    },
    {
      id: "exp4",
      groupId: "dubai_trip",
      amount: 450,
      currency: "$",
      description: "Beach club sunset dinners",
      category: "Food",
      paidBy: "sarah",
      date: "2020-06-14",
      splitType: "unequal",
      shares: [
        { userId: "you", amount: 150 },
        { userId: "sarah", amount: 200 },
        { userId: "mike", amount: 100 }
      ]
    }
  ],
  settlements: [
    {
      id: "set1",
      groupId: "roommates",
      fromUserId: "you",
      toUserId: "mike",
      amount: 189.50,
      currency: "$",
      date: "2026-06-19",
      notes: "Settle rent partially"
    }
  ],
  notifications: [
    {
      id: "notif1",
      userId: "you",
      groupId: "roommates",
      groupName: "Roommates",
      content: "Mike Chen added a $1,200.00 expense for 'Monthly apartment rent block'",
      timestamp: "2026-06-01T10:00:00.000Z",
      type: "expense"
    },
    {
      id: "notif2",
      userId: "you",
      groupId: "dubai_trip",
      groupName: "Dubai Trip",
      content: "Sarah Jenkins added a $450.00 expense for 'Beach club sunset dinners'",
      timestamp: "2026-06-14T18:30:00.000Z",
      type: "expense"
    }
  ]
};

// Helper: load stateFromJsonFallback as a durable single-process safety net
function loadStateFromJsonFallback(): DBState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const state = JSON.parse(content);
      let changed = false;
      if (state && Array.isArray(state.groups)) {
        state.groups.forEach((g: any) => {
          if (g.currency !== "Rs.") {
            g.currency = "Rs.";
            changed = true;
          }
          if (!g.createdByEmail) {
            changed = true;
            if (g.id === "fyp_team") {
              g.createdByEmail = "ma7114338@gmail.com";
            } else if (g.id === "dubai_trip") {
              g.createdByEmail = "sarah@splitmate.com";
            } else {
              g.createdByEmail = "mike@splitmate.com";
            }
          }
        });
      }
      if (state && Array.isArray(state.expenses)) {
        state.expenses.forEach((e: any) => {
          if (e.currency !== "Rs.") {
            e.currency = "Rs.";
            changed = true;
          }
        });
      }
      if (state && Array.isArray(state.settlements)) {
        state.settlements.forEach((s: any) => {
          if (s.currency !== "Rs.") {
            s.currency = "Rs.";
            changed = true;
          }
        });
      }
      if (state && Array.isArray(state.notifications)) {
        state.notifications.forEach((n: any) => {
          if (n.content && n.content.includes("$")) {
            n.content = n.content.replace(/\$/g, "Rs. ");
            changed = true;
          }
        });
      }
      if (changed) {
        saveState(state);
      }
      return state;
    }
  } catch (err) {
    console.error("Failed to load persistence JSON state, resetting to default.", err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

// Helper: load state synchronously (reads from the global memory cache)
function loadState(): DBState {
  return cachedState;
}

// Seeding Default State to Cloud Firestore
async function seedDefaultStateToFirestore() {
  if (!db) return;
  console.log("Seeding default state into Cloud Firestore...");
  const batch = db.batch();

  DEFAULT_STATE.users.forEach(item => {
    const docRef = db!.collection("users").doc(item.id);
    batch.set(docRef, item);
  });

  DEFAULT_STATE.groups.forEach(item => {
    const docRef = db!.collection("groups").doc(item.id);
    batch.set(docRef, item);
  });

  DEFAULT_STATE.expenses.forEach(item => {
    const docRef = db!.collection("expenses").doc(item.id);
    batch.set(docRef, item);
  });

  DEFAULT_STATE.settlements.forEach(item => {
    const docRef = db!.collection("settlements").doc(item.id);
    batch.set(docRef, item);
  });

  DEFAULT_STATE.notifications.forEach(item => {
    const docRef = db!.collection("notifications").doc(item.id);
    batch.set(docRef, item);
  });

  await batch.commit();
}

// Fetch complete database state from Cloud Firestore
async function loadStateFromFirestore(): Promise<DBState> {
  if (!db) {
    return loadStateFromJsonFallback();
  }

  try {
    console.log("Loading all collections from Cloud Firestore...");
    const usersSnapshot = await db.collection("users").get();
    const groupsSnapshot = await db.collection("groups").get();
    const expensesSnapshot = await db.collection("expenses").get();
    const settlementsSnapshot = await db.collection("settlements").get();
    const notificationsSnapshot = await db.collection("notifications").get();

    const users = usersSnapshot.docs.map(doc => doc.data());
    const groups = groupsSnapshot.docs.map(doc => doc.data());
    const expenses = expensesSnapshot.docs.map(doc => doc.data());
    const settlements = settlementsSnapshot.docs.map(doc => doc.data());
    const notifications = notificationsSnapshot.docs.map(doc => doc.data());

    // Clean and standardise currencies to Rs.
    const cleanGroups = groups.map((g: any) => ({ ...g, currency: "Rs." }));
    const cleanExpenses = expenses.map((e: any) => ({ ...e, currency: "Rs." }));
    const cleanSettlements = settlements.map((s: any) => ({ ...s, currency: "Rs." }));
    const cleanNotifications = notifications.map((n: any) => {
      if (n.content && n.content.includes("$")) {
        return { ...n, content: n.content.replace(/\$/g, "Rs. ") };
      }
      return n;
    });

    if (cleanGroups.length === 0 && cleanExpenses.length === 0) {
      await seedDefaultStateToFirestore();
      
      // Seed local backup as well
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STATE, null, 2), "utf-8");
      } catch (e) {}

      knownIds.users = new Set(DEFAULT_STATE.users.map(u => u.id));
      knownIds.groups = new Set(DEFAULT_STATE.groups.map(g => g.id));
      knownIds.expenses = new Set(DEFAULT_STATE.expenses.map(e => e.id));
      knownIds.settlements = new Set(DEFAULT_STATE.settlements.map(s => s.id));
      knownIds.notifications = new Set(DEFAULT_STATE.notifications.map(n => n.id));

      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    knownIds.users = new Set(users.map((u: any) => u.id));
    knownIds.groups = new Set(cleanGroups.map((g: any) => g.id));
    knownIds.expenses = new Set(cleanExpenses.map((e: any) => e.id));
    knownIds.settlements = new Set(cleanSettlements.map((s: any) => s.id));
    knownIds.notifications = new Set(cleanNotifications.map((n: any) => n.id));

    console.log(`Cloud Firestore loaded successfully: ${users.length} users, ${cleanGroups.length} groups, ${cleanExpenses.length} expenses.`);

    return {
      users: users.length > 0 ? users : DEFAULT_STATE.users,
      groups: cleanGroups,
      expenses: cleanExpenses,
      settlements: cleanSettlements,
      notifications: cleanNotifications
    };
  } catch (err) {
    console.error("Error reading from Firestore, falling back to JSON:", err);
    return loadStateFromJsonFallback();
  }
}

// Synchronize in-memory cache state changes to Firestore in the background
async function syncToFirestore(state: DBState) {
  if (!db) return;

  const collections = [
    { key: "users", data: state.users },
    { key: "groups", data: state.groups },
    { key: "expenses", data: state.expenses },
    { key: "settlements", data: state.settlements },
    { key: "notifications", data: state.notifications }
  ] as const;

  for (const col of collections) {
    const key = col.key;
    const items = col.data;
    const currentIds = new Set(items.map(item => item.id));
    const prevIds = knownIds[key];

    const promises: Promise<any>[] = [];

    // Add or update
    for (const item of items) {
      promises.push(db.collection(key).doc(item.id).set(item));
    }

    // Delete
    for (const prevId of prevIds) {
      if (!currentIds.has(prevId)) {
        promises.push(db.collection(key).doc(prevId).delete());
      }
    }

    await Promise.all(promises);
    knownIds[key] = currentIds;
  }
}

// Helper: save state (synchronously updates cache, triggers async cloud sync)
function saveState(state: DBState) {
  cachedState = state;

  if (db) {
    syncToFirestore(state).catch(err => {
      console.error("Async Firestore synchronization failed:", err);
    });
  }

  // Double write safety local backup
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save state to data.json", err);
  }
}

// Net Balance Calculator engine
// Computes how much each user has paid minus what they owe (combines expenses and settlements)
function calculateNetBalances(groupId: string, state: DBState) {
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return {};

  const balances: Record<string, number> = {};
  group.memberIds.forEach((id: string) => {
    balances[id] = 0;
  });

  // Calculate expenses paid (+) and shares owed (-)
  const groupExpenses = state.expenses.filter(e => e.groupId === groupId);
  groupExpenses.forEach(exp => {
    // Payer gets credited the whole paid amount
    const payer = exp.paidBy;
    if (balances[payer] !== undefined) {
      balances[payer] += exp.amount;
    }
    // Every share is a debt (-) for the respective user
    exp.shares.forEach((share: any) => {
      const debtor = share.userId;
      if (balances[debtor] !== undefined) {
        balances[debtor] -= share.amount;
      }
    });
  });

  // Factor in settlements
  // If fromUserId pays toUserId -> fromUserId gets credited (+), toUserId gets debited (-)
  const groupSettlements = state.settlements.filter(s => s.groupId === groupId);
  groupSettlements.forEach(set => {
    if (balances[set.fromUserId] !== undefined) {
      balances[set.fromUserId] += set.amount;
    }
    if (balances[set.toUserId] !== undefined) {
      balances[set.toUserId] -= set.amount;
    }
  });

  return balances;
}

// Debt Optimization Engine (Greedy approach)
// Yields the minimum number of suggested bank transfers to bring everyone back to zero balance.
function getSuggestedSettlements(groupId: string, state: DBState) {
  const balances = calculateNetBalances(groupId, state);
  
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  Object.entries(balances).forEach(([userId, bal]) => {
    if (bal > 0.01) {
      creditors.push({ userId, amount: bal });
    } else if (bal < -0.01) {
      debtors.push({ userId, amount: Math.abs(bal) });
    }
  });

  // Sort descending to optimize and match large credits with large debts
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const suggested: { fromUserId: string; toUserId: string; amount: number }[] = [];

  let cIdx = 0;
  let dIdx = 0;

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

// --- REST API ENDPOINTS ---

// Get current session user
app.get("/api/currentUser", (req, res) => {
  const state = loadState();
  // We assume user is 'you' (Ali) for simplicity, or we let them toggle logged in user
  const loggedInUser = state.users.find(u => u.id === "you");
  res.json(loggedInUser);
});

// Switch currently logged in emulation user if wanted
app.post("/api/currentUser/switch", (req, res) => {
  const { id } = req.body;
  const state = loadState();
  const userExists = state.users.find(u => u.id === id);
  if (!userExists) {
    return res.status(404).json({ error: "User not found" });
  }
  // Change their id role temporarily in data by swapping 'you' handle
  const formerYou = state.users.find(u => u.id === "you");
  if (formerYou && formerYou.id !== id) {
    formerYou.id = "former_you";
  }
  userExists.id = "you";
  saveState(state);
  res.json(userExists);
});

// Update Profile
app.post("/api/profile/update", (req, res) => {
  const { name, email, avatarUrl } = req.body;
  const state = loadState();
  const user = state.users.find(u => u.id === "you");
  if (user) {
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    saveState(state);
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: "Current user context not found" });
});

// All Users search selection list
app.get("/api/users", (req, res) => {
  const state = loadState();
  res.json(state.users);
});

// Register user
app.post("/api/register", (req, res) => {
  const { name, email, avatarUrl } = req.body;
  const state = loadState();
  const emailTaken = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailTaken) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const newUser = {
    id: name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000),
    name,
    email,
    avatarUrl: avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDThjmqH6fm5-FAys1g4tycG4MH6zoNkwX0W-tfGgJfbGAVFyybt5P6IGpMgXoZlhEgM8DNGFzTI89pPT3xkphC8gW9SAtvijZGLG2MLVAGeb63BFPDzHUXFehWxOdoNVQev6n-4xHO2PgM10ckZDOo9aWW-WVFHAVQz18uqPf5SOIa7C6dN98D8l2gVu6DGg4s24mfkPKujevAfER9KUCccVe80vNPQiVVnx38k_MrubwRwnBzP2t_umhnUqQBM8PJES09Xj79pac"
  };
  state.users.push(newUser);
  saveState(state);
  res.json({ success: true, user: newUser });
});

// Get User Groups
app.get("/api/groups", (req, res) => {
  const state = loadState();
  // Filter groups where the current emulated user is a member
  const userGroups = state.groups.filter(g => g.memberIds.includes("you"));
  
  // Attach current real-time total spend and state for each group
  const formattedGroups = userGroups.map(g => {
    const groupExpenses = state.expenses.filter(e => e.groupId === g.id);
    const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

    const balances = calculateNetBalances(g.id, state);
    const userBalance = balances["you"] || 0;

    // Map member structures
    const members = state.users.filter(u => g.memberIds.includes(u.id));

    return {
      ...g,
      totalSpend,
      userBalance,
      members
    };
  });

  res.json(formattedGroups);
});

// Specific Group details (with dynamic optimization balances)
app.get("/api/groups/:id", (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const group = state.groups.find(g => g.id === id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const groupExpenses = state.expenses.filter(e => e.groupId === id);
  const groupSettlements = state.settlements.filter(s => s.groupId === id);
  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  const balances = calculateNetBalances(id, state);
  const suggestedSettlements = getSuggestedSettlements(id, state);

  // Hydrate usernames for quick UI rendering
  const hydratedBalances = Object.entries(balances).map(([userId, bal]) => {
    const user = state.users.find(u => u.id === userId);
    return {
      userId,
      name: user ? user.name : userId,
      avatarUrl: user ? user.avatarUrl : "",
      balance: bal
    };
  });

  const hydratedExpenses = groupExpenses.map(exp => {
    const payer = state.users.find(u => u.id === exp.paidBy);
    return {
      ...exp,
      payerName: payer ? payer.name : exp.paidBy,
      payerAvatar: payer ? payer.avatarUrl : ""
    };
  });

  const hydratedSettlements = groupSettlements.map(set => {
    const fromUser = state.users.find(u => u.id === set.fromUserId);
    const toUser = state.users.find(u => u.id === set.toUserId);
    return {
      ...set,
      fromName: fromUser ? fromUser.name : set.fromUserId,
      toName: toUser ? toUser.name : set.toUserId
    };
  });

  const members = state.users.filter(u => group.memberIds.includes(u.id));

  res.json({
    group,
    totalSpend,
    expenses: hydratedExpenses,
    settlements: hydratedSettlements,
    balances: hydratedBalances,
    suggestedSettlements,
    members
  });
});

// Delete Group (Only the author can delete)
app.delete("/api/groups/:id", (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const group = state.groups.find(g => g.id === id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const currentUser = state.users.find(u => u.id === "you");
  if (!currentUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (group.createdByEmail !== currentUser.email) {
    return res.status(403).json({ error: "Only the group author can delete this group!" });
  }

  // Delete group and its dependencies manually to free memory
  state.groups = state.groups.filter(g => g.id !== id);
  state.expenses = state.expenses.filter(e => e.groupId !== id);
  state.settlements = state.settlements.filter(s => s.groupId !== id);

  state.notifications.push({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: id,
    groupName: group.name,
    content: `Group '${group.name}' has been deleted by its author ${currentUser.name}.`,
    timestamp: new Date().toISOString(),
    type: "group_delete"
  });

  saveState(state);
  res.json({ success: true });
});

// Create Group
app.post("/api/groups", (req, res) => {
  const { name, description, currency, memberIds, bgImage } = req.body;
  const state = loadState();
  const currentUser = state.users.find(u => u.id === "you");

  const freshGroup = {
    id: name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now(),
    name,
    description: description || "Direct expense calculations",
    createdDate: new Date().toISOString().split('T')[0],
    currency: currency || "Rs.",
    bgImage: bgImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuCjze4an5dRuTUSf4agOA_qZ4AT6-KojfnkUADZgQEWhyObcd6gz_SVOSmwH1qS_zm5sAJX32ArjZ0MooqIo49QecyHGD2VciNwTksmOSA2aX_DjuhE5l4YQ1BfLNdBwPDjjGebqY2Ywg43yh0KBk5GsmJS95DbQtAVQvd-CsC4O-rI2pmBrvIGgxnvDQpvTBJj_B97_jRFo5yYIl9X30HxDkwyOXLSfu_nqPAFHv2mn4U__gyRaJvAhbji48MUQNjKtBC03c-XRvQ",
    memberIds: Array.from(new Set(["you", ...(memberIds || [])])),
    createdByEmail: currentUser ? currentUser.email : "ma7114338@gmail.com"
  };

  state.groups.push(freshGroup);
  
  // Notification hook
  state.notifications.push({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: freshGroup.id,
    groupName: freshGroup.name,
    content: `You created a new group: '${freshGroup.name}'`,
    timestamp: new Date().toISOString(),
    type: "group_add"
  });

  saveState(state);
  res.json({ success: true, group: freshGroup });
});

// Invite / Add members to Group
app.post("/api/groups/:id/members", (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  const state = loadState();
  const group = state.groups.find(g => g.id === id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (userIds && Array.isArray(userIds)) {
    userIds.forEach(uid => {
      if (!group.memberIds.includes(uid)) {
        group.memberIds.push(uid);
      }
    });

    state.notifications.push({
      id: "notif_" + Date.now(),
      userId: "you",
      groupId: group.id,
      groupName: group.name,
      content: `New members joined '${group.name}'`,
      timestamp: new Date().toISOString(),
      type: "group_add"
    });

    saveState(state);
    return res.json({ success: true, group });
  }
  res.status(400).json({ error: "Invalid userIds provided" });
});

// Add New Expense
app.post("/api/expenses", (req, res) => {
  const { groupId, amount, currency, description, category, paidBy, splitType, shares } = req.body;
  const state = loadState();

  const group = state.groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(444).json({ error: "Group does not exist" });
  }

  const numericalAmount = Number(amount);
  if (!numericalAmount || isNaN(numericalAmount)) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  // Auto split engine calculation logic
  let finalShares: any[] = [];
  const participants = group.memberIds;

  if (splitType === "equal") {
    const equalShare = Number((numericalAmount / participants.length).toFixed(2));
    finalShares = participants.map(uid => ({
      userId: uid,
      amount: equalShare
    }));
  } else if (splitType === "percentage") {
    // shares are expected as list of { userId, ratio (indicating percentage % out of 100) }
    finalShares = participants.map(uid => {
      const userShareRatio = shares?.find((s: any) => s.userId === uid)?.ratio || 0;
      const calculatedAmount = Number((userShareRatio * numericalAmount / 100).toFixed(2));
      return {
        userId: uid,
        amount: calculatedAmount,
        ratio: userShareRatio
      };
    });
  } else if (splitType === "unequal") {
    // shares are expected as absolute values { userId, ratio (indicating absolute balance owed) }
    finalShares = participants.map(uid => {
      const absoluteAmount = Number(shares?.find((s: any) => s.userId === uid)?.ratio || 0);
      return {
        userId: uid,
        amount: absoluteAmount,
        ratio: absoluteAmount
      };
    });
  }

  const finalExpense = {
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
  };

  state.expenses.push(finalExpense);

  // Hook notification
  const payerName = state.users.find(u => u.id === finalExpense.paidBy)?.name || "Someone";
  state.notifications.push({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: group.id,
    groupName: group.name,
    content: `${payerName} added a ${finalExpense.currency}${finalExpense.amount} expense for '${finalExpense.description}'`,
    timestamp: new Date().toISOString(),
    type: "expense"
  });

  saveState(state);
  res.json({ success: true, expense: finalExpense });
});

// Delete Expense
app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const expenseIndex = state.expenses.findIndex(e => e.id === id);
  if (expenseIndex === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const expDep = state.expenses[expenseIndex];
  state.expenses.splice(expenseIndex, 1);

  state.notifications.push({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: expDep.groupId,
    groupName: "Group",
    content: `Expense '${expDep.description}' of ${expDep.currency}${expDep.amount} was deleted.`,
    timestamp: new Date().toISOString(),
    type: "expense"
  });

  saveState(state);
  res.json({ success: true });
});

// Post a settlement
app.post("/api/settlements", (req, res) => {
  const { groupId, fromUserId, toUserId, amount, currency, notes } = req.body;
  const state = loadState();

  const group = state.groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(444).json({ error: "Group does not exist" });
  }

  // Security checks: a user can only settle their own balances and debts
  const senderId = fromUserId || "you";
  if (senderId !== "you" && toUserId !== "you") {
    return res.status(403).json({ error: "You can only settle your own debts and balances, not of other members!" });
  }

  const numericalAmount = Number(amount);
  if (!numericalAmount || isNaN(numericalAmount)) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  const freshSettlement = {
    id: "set_" + Date.now(),
    groupId,
    fromUserId: senderId,
    toUserId,
    amount: numericalAmount,
    currency: currency || group.currency,
    date: new Date().toISOString().split('T')[0],
    notes: notes || "Balances Settled"
  };

  state.settlements.push(freshSettlement);

  const senderName = state.users.find(u => u.id === freshSettlement.fromUserId)?.name || "A user";
  const receiverName = state.users.find(u => u.id === freshSettlement.toUserId)?.name || "receiver";
  
  state.notifications.push({
    id: "notif_" + Date.now(),
    userId: "you",
    groupId: group.id,
    groupName: group.name,
    content: `${senderName} settled ${freshSettlement.currency}${freshSettlement.amount} with ${receiverName}`,
    timestamp: new Date().toISOString(),
    type: "settlement"
  });

  // Check if fully settled (after optimization, suggestions array matches zero length)
  const remainingSuggestions = getSuggestedSettlements(groupId, state);
  if (remainingSuggestions.length === 0) {
    // Automatically delete expenses in timeline when everyone is settled up!
    state.expenses = state.expenses.filter(e => e.groupId !== groupId);
    // Add automatic cleanup system alert
    state.notifications.push({
      id: "notif_clean_" + Date.now(),
      userId: "you",
      groupId: group.id,
      groupName: group.name,
      content: `Memory cleared: All expenses inside '${group.name}' were automatically recycled after full settlement!`,
      timestamp: new Date().toISOString(),
      type: "group_sys"
    });
  }

  saveState(state);
  res.json({ success: true, settlement: freshSettlement });
});

// Get User Notifications/Recent activities
app.get("/api/notifications", (req, res) => {
  const state = loadState();
  res.json(state.notifications);
});

// Delete Recent Activity/Notification
app.delete("/api/notifications/:id", (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const index = state.notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    state.notifications.splice(index, 1);
    saveState(state);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Activity not found" });
});

// Get User General Dashboard statistics across all groups
app.get("/api/stats", (req, res) => {
  const state = loadState();
  const userGroups = state.groups.filter(g => g.memberIds.includes("you"));
  
  let owerSum = 0; // Receive (+)
  let oweeSum = 0; // Owe (-)
  let totalExpensesCount = 0;

  userGroups.forEach(g => {
    const balances = calculateNetBalances(g.id, state);
    const userBal = balances["you"] || 0;
    if (userBal > 0) {
      owerSum += userBal;
    } else {
      oweeSum += Math.abs(userBal);
    }

    const groupExpenses = state.expenses.filter(e => e.groupId === g.id);
    totalExpensesCount += groupExpenses.length;
  });

  const netBalance = owerSum - oweeSum;

  res.json({
    totalGroups: userGroups.length,
    totalExpenses: totalExpensesCount,
    amountOwed: owerSum,
    amountYouOwe: oweeSum,
    netBalance
  });
});

// Get Suggested Categories / Scan Text via Gemini AI
// Highly polished server-side proxy route ensuring key safety.
app.post("/api/ai/analyze-description", async (req, res) => {
  const { description, amount } = req.body;
  
  const client = getGeminiClient();
  if (!client) {
    // If no key, fallback gracefully to a smart heuristics router
    const lower = (description || "").toLowerCase();
    let computedCategory = "General";
    if (lower.includes("food") || lower.includes("dinner") || lower.includes("lunch") || lower.includes("pizza") || lower.includes("nandos") || lower.includes("beach")) {
      computedCategory = "Food & Dining";
    } else if (lower.includes("taxi") || lower.includes("uber") || lower.includes("ride") || lower.includes("flight") || lower.includes("airport")) {
      computedCategory = "Transport";
    } else if (lower.includes("rent") || lower.includes("stay") || lower.includes("room") || lower.includes("house") || lower.includes("airbnb")) {
      computedCategory = "Housing";
    } else if (lower.includes("paper") || lower.includes("print") || lower.includes("design") || lower.includes("software")) {
      computedCategory = "Education/Project";
    }
    return res.json({ category: computedCategory, reasoning: "Local heuristics engine (API key not active)" });
  }

  try {
    const prompt = `You are a financial advisor categorized router. Please look at this expense metadata:
Description: "${description}"
Amount: "${amount}"

Predict the best category for it among these choices: "Food & Dining", "Transport", "Housing", "Entertainment", "Education/Project", "General".

Respond ONLY with a valid JSON block of this schema:
{
  "category": "String matching one of the categories exactly",
  "reasoning": "A simple 1-sentence explanation matching modern conversation"
}`;

    const geminiResponse = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const bodyText = geminiResponse.text?.trim() || "";
    const parsed = JSON.parse(bodyText);
    res.json(parsed);
  } catch (err) {
    console.error("Gemini suggestion failed:", err);
    res.status(500).json({ error: "Gemini calculation failed", category: "General", reasoning: "An error occurred with GenAI" });
  }
});


// Load and instantiate Vite Middleware or serve static built files
async function start() {
  // Load persistent cloud state from Firestore before booting the web server
  cachedState = await loadStateFromFirestore();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SplitMate Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
