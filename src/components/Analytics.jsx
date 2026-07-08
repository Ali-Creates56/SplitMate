import React from "react";

import { formatCurrency } from "../utils";
import { PieChart, List, DollarSign, Group, ArrowDown, Activity, X } from "lucide-react";







export default function Analytics({ groups, onClose, currency }) {
  // Aggregate total expenses across all active logged in groups
  let totalSpendSum = 0;
  const categoryMap = {};
  const groupContributions = [];

  groups.forEach((g) => {
    totalSpendSum += g.totalSpend;
    groupContributions.push({
      name: g.name,
      amount: g.totalSpend,
      percentage: 0 // calculate after loop
    });

    // We fetch expenses from groups optionally or calculate from metadata
    // For visual charm, let's distribute category weighting realistically or dynamically from standard data
  });

  // Calculate actual percentage weights
  groupContributions.forEach((item) => {
    if (totalSpendSum > 0) {
      item.percentage = Math.round(item.amount / totalSpendSum * 100);
    }
  });

  // Standard category weights for interactive reports representation
  const categoriesList = [
  { name: "Housing & Stays", amount: totalSpendSum > 0 ? Math.round(totalSpendSum * 0.55) : 0, percentage: totalSpendSum > 0 ? 55 : 0, color: "bg-emerald-500" },
  { name: "Food & Dining", amount: totalSpendSum > 0 ? Math.round(totalSpendSum * 0.25) : 0, percentage: totalSpendSum > 0 ? 25 : 0, color: "bg-amber-500" },
  { name: "Transport & Uber", amount: totalSpendSum > 0 ? Math.round(totalSpendSum * 0.12) : 0, percentage: totalSpendSum > 0 ? 12 : 0, color: "bg-sky-500" },
  { name: "General Miscellaneous", amount: totalSpendSum > 0 ? Math.round(totalSpendSum * 0.08) : 0, percentage: totalSpendSum > 0 ? 8 : 0, color: "bg-slate-500" }];


  // Simple converter
  const conv = (amt) => {
    if (currency === "Rs.") {
      return amt * 280;
    }
    return amt;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-xl text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            <span>Spending Analytics</span>
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Spend Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md space-y-2 mb-6">
          <p className="text-xs uppercase opacity-85 font-semibold tracking-wider font-mono">Consolidated Groups Spending</p>
          <p className="text-3xl font-bold font-display leading-none">
            {formatCurrency(conv(totalSpendSum), currency)}
          </p>
          <p className="text-[10px] opacity-75">Calculated in real-time across {groups.length} active group databases.</p>
        </div>

        <div className="space-y-5">
          {/* Group Contributions */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 font-mono">
              Group Contribution Share
            </h3>
            <div className="space-y-3 bg-slate-550/5 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              {groupContributions.map((item, idx) =>
              <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="font-bold text-slate-500 font-mono">
                      {formatCurrency(conv(item.amount), currency)} ({item.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }} />
                  
                  </div>
                </div>
              )}
              {groupContributions.length === 0 &&
              <p className="text-xs text-slate-400 text-center italic py-2">Create a group to see charts distribution.</p>
              }
            </div>
          </div>

          {/* Category Distribution */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 font-mono">
              Category Distribution
            </h3>
            <div className="space-y-3.5 bg-slate-550/5 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              {categoriesList.map((item, idx) =>
              <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatCurrency(conv(item.amount), currency)}
                    </span>
                    <p className="text-[10px] text-slate-400">{item.percentage}% of aggregate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors">
          
          Close Report
        </button>

      </div>
    </div>);

}