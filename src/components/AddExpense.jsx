import React, { useState, useEffect } from "react";

import { Sparkles, HelpCircle, Check, DollarSign, SplitSquareVertical, Receipt, X } from "lucide-react";
import { formatCurrency } from "../utils";
import { useHardwareBack } from "../hooks/useHardwareBack";










export default function AddExpense({
  groups,
  currentUser,
  onClose,
  onSuccess,
  initialGroupId,
  currency
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || groups[0]?.id || "");
  const [expenseCurrency, setExpenseCurrency] = useState("Rs.");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [splitType, setSplitType] = useState("equal");

  // Custom shares mapping: user_id -> custom value (ratio or absolute amount)
  const [customShares, setCustomShares] = useState({});

  const [customCategories, setCustomCategories] = useState([]);
  const [showNewCategoryPrompt, setShowNewCategoryPrompt] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Hardware Back Button Interception
  useHardwareBack(showNewCategoryPrompt, () => setShowNewCategoryPrompt(false));

  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const members = activeGroup?.members || [];
  
  // Track involved members (excluding 'you', since 'you' are always included as payer)
  const [checkedMembers, setCheckedMembers] = useState(members.filter(m => m.id !== "you").map(m => m.id));

  useEffect(() => {
    if (activeGroup) {
      setExpenseCurrency(activeGroup.currency);
    }
  }, [selectedGroupId]);

  // Re-seed equal custom shares when group or amount changes
  useEffect(() => {
    if (members.length > 0) {
      const initial = {};
      members.forEach((m) => {
        initial[m.id] = splitType === "percentage" ? Number((100 / members.length).toFixed(0)) : 0;
      });
      setCustomShares(initial);
    }
  }, [selectedGroupId, splitType]);

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim() && !customCategories.includes(newCategoryName.trim())) {
      setCustomCategories([...customCategories, newCategoryName.trim()]);
      setCategory(newCategoryName.trim());
    }
    setNewCategoryName("");
    setShowNewCategoryPrompt(false);
  };

  const handleCustomShareChange = (uid, value) => {
    const num = Number(value);
    setCustomShares((prev) => ({
      ...prev,
      [uid]: isNaN(num) ? 0 : num
    }));
  };

  const handleSubmit = async (e) => {
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
      const sum = Object.values(customShares).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 1) {
        alert(`Percentage ratios must sum to 100%! Current sum: ${sum}%`);
        return;
      }
    } else if (splitType === "unequal") {
      const sum = Object.values(customShares).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - parsedAmount) > 1) {
        alert(`Unequal absolute splits must sum to the total bill amount (${parsedAmount})! Current sum: ${sum}`);
        return;
      }
    }

    // Format shares payload to matching ratios API schema
    const formattedShares = members.map((m) => ({
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
          paidBy: "you",
          splitType,
          shares: formattedShares,
          involvedMembers: [...checkedMembers, "you"]
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
    const involved = members.filter(m => checkedMembers.includes(m.id) || m.id === "you");
    
    if (splitType === "equal") {
      const equalShare = Number((parsedAmt / Math.max(involved.length, 1)).toFixed(2));
      return members.map((m) => ({
        name: m.name,
        owed: involved.includes(m) ? equalShare : 0
      }));
    } else if (splitType === "percentage") {
      return members.map((m) => {
        const ratio = customShares[m.id] || 0;
        return {
          name: m.name,
          owed: Number((ratio * parsedAmt / 100).toFixed(2))
        };
      });
    } else {
      return members.map((m) => {
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
          
          {/* Amount Only (Paid By is strictly 'You') */}
          <div className="grid grid-cols-1 gap-3">

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bill Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-xs">
                  {expenseCurrency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly organic food shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          
          {/* Members Involved Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Members Involved</label>
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto no-scrollbar space-y-2">
              <div className="flex items-center gap-3 opacity-60">
                <input type="checkbox" checked disabled className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-transparent" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentUser.name} (You - Payer)</span>
              </div>
              {members.filter(m => m.id !== "you").map(m => (
                <label key={m.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={checkedMembers.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) setCheckedMembers([...checkedMembers, m.id]);
                      else setCheckedMembers(checkedMembers.filter(id => id !== m.id));
                    }}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {[...["Food & Dining", "Transport", "Housing", "Entertainment", "Education/Project", "General"], ...customCategories].map((cat) =>
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                category === cat ?
                "bg-emerald-500 text-white border-emerald-500 shadow-sm" :
                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200"}`
                }>
                
                  {cat}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setShowNewCategoryPrompt(!showNewCategoryPrompt)}
                className="text-xs px-2.5 py-1.5 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 transition-all font-bold">
                +
              </button>
            </div>
            
            {showNewCategoryPrompt && (
              <div className="absolute top-full left-0 mt-2 z-10 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 flex gap-2 animate-in fade-in zoom-in-95">
                <input 
                  type="text"
                  placeholder="New Category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Split Rules Tab Toggle */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Split Option</label>
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setSplitType("equal")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                splitType === "equal" ?
                "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-200" :
                "text-slate-500 hover:text-slate-700"}`
                }>
                
                Split Equally
              </button>
              <button
                type="button"
                onClick={() => setSplitType("unequal")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                splitType === "unequal" ?
                "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-200" :
                "text-slate-500 hover:text-slate-700"}`
                }>
                
                Unequal
              </button>
              <button
                type="button"
                onClick={() => setSplitType("percentage")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                splitType === "percentage" ?
                "bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-200" :
                "text-slate-500 hover:text-slate-700"}`
                }>
                
                Percentage
              </button>
            </div>
          </div>

          {/* Sub-inputs based on split type selected */}
          {splitType !== "equal" && members.length > 0 &&
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 max-h-[160px] overflow-y-auto no-scrollbar space-y-2.5">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {splitType === "percentage" ? "Enter % Split Share (Sums to 100%)" : "Enter Absolute Share Owed"}
              </p>
              {members.map((m) =>
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
                  className="w-full text-right pr-6 py-1 bg-white dark:bg-slate-800/55 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs focus:outline-none" />
                
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                      {splitType === "percentage" ? "%" : activeGroup?.currency || "Rs."}
                    </span>
                  </div>
                </div>
            )}
            </div>
          }

          {/* Real-time Display Table showing individual live share calculations */}
          <div className="bg-slate-500/5 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Live Split Share calculations
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {calculatedShares.map((item, idx) =>
              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/30 pb-1">
                  <span className="text-slate-655 dark:text-slate-400 truncate max-w-[120px]">{item.name}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {formatCurrency(item.owed, activeGroup?.currency || currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
              
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-755 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/10">
              
              Record Bill
            </button>
          </div>

        </form>
      </div>
    </div>);

}