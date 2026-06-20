import React, { useState, useEffect } from "react";
import { User, Group, Currency } from "../types";
import { Sparkles, HelpCircle, Check, DollarSign, SplitSquareVertical, Receipt, X } from "lucide-react";
import { formatCurrency } from "../utils";

interface AddExpenseProps {
  groups: any[];
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  initialGroupId?: string;
  currency: Currency;
}

export default function AddExpense({
  groups,
  currentUser,
  onClose,
  onSuccess,
  initialGroupId,
  currency
}: AddExpenseProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || groups[0]?.id || "");
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>("Rs.");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [paidBy, setPaidBy] = useState("you");
  const [splitType, setSplitType] = useState<"equal" | "unequal" | "percentage">("equal");
  
  // Custom shares mapping: user_id -> custom value (ratio or absolute amount)
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiDetails, setAIDetails] = useState("");

  const activeGroup = groups.find(g => g.id === selectedGroupId);
  const members = activeGroup?.members || [];

  useEffect(() => {
    if (activeGroup) {
      setExpenseCurrency(activeGroup.currency);
    }
  }, [selectedGroupId]);

  // Re-seed equal custom shares when group or amount changes
  useEffect(() => {
    if (members.length > 0) {
      const initial: Record<string, number> = {};
      members.forEach((m: any) => {
        initial[m.id] = splitType === "percentage" ? Number((100 / members.length).toFixed(0)) : 0;
      });
      setCustomShares(initial);
    }
  }, [selectedGroupId, splitType]);

  // AI Predict category from entered text
  const handleAIPredict = async () => {
    if (!description.trim()) {
      alert("Please enter a short description to analyze first!");
      return;
    }
    setIsAILoading(true);
    setAIDetails("");
    try {
      const res = await fetch("/api/ai/analyze-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) setCategory(data.category);
        if (data.reasoning) setAIDetails(data.reasoning);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleCustomShareChange = (uid: string, value: string) => {
    const num = Number(value);
    setCustomShares(prev => ({
      ...prev,
      [uid]: isNaN(num) ? 0 : num
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      alert("Please select a group first!");
      return;
    }
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount)) {
      alert("Please enter a valid expense amount!");
      return;
    }

    // Safety checks for percentage or unequal splits
    if (splitType === "percentage") {
      const sum = (Object.values(customShares) as number[]).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 1) {
        alert(`Percentage ratios must sum to 100%! Current sum: ${sum}%`);
        return;
      }
    } else if (splitType === "unequal") {
      const sum = (Object.values(customShares) as number[]).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - parsedAmount) > 1) {
        alert(`Unequal absolute splits must sum to the total bill amount (${parsedAmount})! Current sum: ${sum}`);
        return;
      }
    }

    // Format shares payload to matching ratios API schema
    const formattedShares = members.map((m: any) => ({
      userId: m.id,
      ratio: customShares[m.id] || 0
    }));

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          amount: parsedAmount,
          currency: expenseCurrency,
          description,
          category,
          paidBy,
          splitType,
          shares: formattedShares
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Submission error occurred");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live output calculation to show "Who owes what" as they type!
  const getLiveCalculations = () => {
    const parsedAmt = Number(amount) || 0;
    if (splitType === "equal") {
      const equalShare = Number((parsedAmt / Math.max(members.length, 1)).toFixed(2));
      return members.map((m: any) => ({
        name: m.name,
        owed: equalShare
      }));
    } else if (splitType === "percentage") {
      return members.map((m: any) => {
        const ratio = customShares[m.id] || 0;
        return {
          name: m.name,
          owed: Number((ratio * parsedAmt / 100).toFixed(2))
        };
      });
    } else {
      return members.map((m: any) => {
        const absolute = customShares[m.id] || 0;
        return {
          name: m.name,
          owed: absolute
        };
      });
    }
  };

  const calculatedShares = getLiveCalculations();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display font-bold text-xl text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            Add Shared Expense
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Group Choice */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.currency})</option>
              ))}
            </select>
          </div>

          {/* Amount and Currency Displays */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currency</label>
              <select
                value={expenseCurrency}
                onChange={(e) => setExpenseCurrency(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                disabled
              >
                <option value="Rs.">Rs. PKR</option>
              </select>
            </div>

            <div className="space-y-1 col-span-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bill Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-xs">
                  {expenseCurrency}
                </span>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1 col-span-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-105 focus:outline-none focus:border-emerald-500"
              >
                <option value="you">{currentUser.name} (You)</option>
                {members.filter((m: any) => m.id !== "you").map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Gemini smart guesser */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
              <button
                type="button"
                onClick={handleAIPredict}
                disabled={isAILoading}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:opacity-85 flex items-center gap-1.5"
                title="Generates category recommendation from Gemini"
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>{isAILoading ? "Calling AI..." : "AI Auto-Categorize"}</span>
              </button>
            </div>
            <input 
              type="text"
              required
              placeholder="e.g. Weekly organic food shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {aiDetails && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 mt-1 font-mono">
                💡 AI: {aiDetails}
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {["Food & Dining", "Transport", "Housing", "Entertainment", "Education/Project", "General"].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                    category === cat 
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Split Rules Tab Toggle */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Split Option</label>
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setSplitType("equal")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  splitType === "equal" 
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Split Equally
              </button>
              <button
                type="button"
                onClick={() => setSplitType("unequal")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  splitType === "unequal" 
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Unequal
              </button>
              <button
                type="button"
                onClick={() => setSplitType("percentage")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  splitType === "percentage" 
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-200" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Sub-inputs based on split type selected */}
          {splitType !== "equal" && members.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 max-h-[160px] overflow-y-auto no-scrollbar space-y-2.5">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {splitType === "percentage" ? "Enter % Split Share (Sums to 100%)" : "Enter Absolute Share Owed"}
              </p>
              {members.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <img src={m.avatarUrl} alt={m.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                  </div>
                  <div className="relative w-24">
                    <input
                      type="number"
                      placeholder="0"
                      value={customShares[m.id] || ""}
                      onChange={(e) => handleCustomShareChange(m.id, e.target.value)}
                      className="w-full text-right pr-6 py-1 bg-white dark:bg-slate-800/55 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                      {splitType === "percentage" ? "%" : (activeGroup?.currency || "Rs.")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Display Table showing individual live share calculations */}
          <div className="bg-slate-500/5 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Live Split Share calculations
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {calculatedShares.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/30 pb-1">
                  <span className="text-slate-655 dark:text-slate-400 truncate max-w-[120px]">{item.name}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {formatCurrency(item.owed, activeGroup?.currency || currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-755 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/10"
            >
              Record Bill
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
