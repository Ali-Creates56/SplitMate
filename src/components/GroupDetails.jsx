import React, { useState, useEffect } from "react";
import { Skeleton, SkeletonCard, SkeletonList } from "./Skeleton";

import {
  ArrowLeft,
  Trash2,
  Plus,
  Check,
  DollarSign,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Utensils,
  Car,
  Home,
  Coins,
  FileText,
  X,
  CheckCircle,
  Receipt } from
"lucide-react";
import { formatCurrency, CATEGORIES } from "../utils";










export default function GroupDetails({
  groupId,
  onBack,
  currency,
  currentUser,
  allUsers,
  onAddExpenseClick
}) {
  const [activeTab, setActiveTab] = useState("expenses");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [selectedExpenseForSettlement, setSelectedExpenseForSettlement] = useState(null);
  const [expenseIdToSettleConfirm, setExpenseIdToSettleConfirm] = useState(null);
  const [settleMemberId, setSettleMemberId] = useState(null);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState(null);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const fetchPromise = fetch(`/api/groups/${groupId}`);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 1500)
      );

      let res;
      try {
        res = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (e) {
        if (e.message === "Timeout") {
          // Fallback to cache
          let hasCache = false;
          try {
            const cachedGroup = localStorage.getItem(`sm_group_${groupId}`);
            if (cachedGroup) {
              setData(JSON.parse(cachedGroup));
              hasCache = true;
            }
          } catch (err) {}
          
          if (hasCache) {
            setLoading(false);
          }
          
          // Wait for background fetch
          res = await fetchPromise;
        } else {
          throw e;
        }
      }

      if (res && res.ok) {
        const json = await res.json();
        setData(json);
        localStorage.setItem(`sm_group_${groupId}`, JSON.stringify(json));
      }
    } catch (err) {
      console.error("Error loading group details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-6 mt-4">
        <SkeletonCard className="h-40 w-full" />
        <SkeletonList count={4} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Group not found.</p>
        <button onClick={onBack} className="text-emerald-500 font-bold mt-2">Go back</button>
      </div>);

  }

  const { group, totalSpend, expenses, settlements, balances, suggestedSettlements, members } = data;
  const userBalance = balances.find((b) => b.userId === "you")?.balance || 0;

  // Since currency is strictly PKR now, no conversion is necessary.
  const conv = (amt) => {
    return amt;
  };

  // Delete Expense handler
  const handleDeleteExpense = async (expId) => {
    const expObj = data?.expenses?.find(e => e.id === expId);
    
    // Optimistic UI Update
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== expId),
        totalSpend: prev.totalSpend - (expObj ? expObj.amount : 0)
      };
    });

    try {
      const res = await fetch(`/api/expenses/${expId}`, { method: "DELETE" });
      if (res.ok) {
        fetchGroupDetails(); // silently resyncs exact balances
      } else {
        fetchGroupDetails(); // revert on error
      }
    } catch (err) {
      console.error(err);
      fetchGroupDetails(); // revert on error
    }
  };

  // Delete Group handler (Authorized Author creator only)
  const handleDeleteGroupExecute = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (res.ok) {
        onBack();
      } else {
        const errObj = await res.json();
        setShowDeleteGroupConfirm(false);
        setDeleteError(errObj.error || "Could not delete group");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invite member
  const handleInviteUser = async (uid) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [uid] })
      });
      if (res.ok) {
        fetchGroupDetails();
        setInviteModal(false);
        setInviteQuery("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark a member as settled for a specific expense
  const handleSettleExpenseMember = async () => {
    if (!expenseIdToSettleConfirm || !settleMemberId) return;
    try {
      const res = await fetch(`/api/expenses/${expenseIdToSettleConfirm}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: settleMemberId })
      });
      if (res.ok) {
        setExpenseIdToSettleConfirm(null);
        setSettleMemberId(null);
        fetchGroupDetails();
        
        // Update local modal state without full unmount
        if (selectedExpenseForSettlement) {
           setSelectedExpenseForSettlement(prev => {
             const newExp = { ...prev };
             if (!newExp.settledMembers) newExp.settledMembers = [];
             newExp.settledMembers.push(settleMemberId);
             return newExp;
           });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="space-y-6 pb-12">
      {/* Cover Header */}
      <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-sm bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 flex items-end">
        
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors backdrop-blur-md">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Delete group option - Author only */}
        {group.createdByEmail === currentUser?.email &&
        <button
          type="button"
          onClick={() => setShowDeleteGroupConfirm(true)}
          className="absolute top-4 right-4 p-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full transition-all backdrop-blur-md cursor-pointer border border-red-200 dark:border-red-500/20"
          title={`Delete '${group.name}' completely (Creator only)`}>
            <Trash2 className="w-5 h-5" />
          </button>
        }

        <div className="w-full p-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mt-12">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded leading-none">
              Group Active
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-850 dark:text-slate-100 mt-2">
              {group.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Created • {group.createdDate}
            </p>
          </div>

          {/* Member avatars horizontal list */}
          <div className="flex -space-x-3 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full backdrop-blur-md border border-slate-200 dark:border-slate-700">
            {members.slice(0, 5).map((m) =>
            <img
              key={m.id}
              src={m.avatarUrl}
              alt={m.name}
              title={m.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-slate-900"
              referrerPolicy="no-referrer" />
            )}
            {members.length > 5 &&
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold font-mono border-2 border-white dark:border-slate-900">
                +{members.length - 5}
              </div>
            }
          </div>
        </div>
      </div>

      {/* Summary Analytics block */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#000000] rounded-2xl p-5 shadow-sm border border-slate-800 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00d492]">Total Expenses</p>
          <p className="font-semibold text-xl text-white mt-1">
            {formatCurrency(conv(totalSpend), currency)}
          </p>
        </div>

        <div className="bg-[#000000] p-5 rounded-2xl border border-slate-800 text-white">
          <p className={`text-xs font-semibold uppercase tracking-wider opacity-85 ${userBalance < -0.01 ? "text-red-400" : "text-slate-300"}`}>
            {userBalance < -0.01 ? "To Pay" : "To Receive"}
          </p>
          <p className={`font-semibold text-xl mt-1 font-mono ${userBalance < -0.01 ? "text-red-400" : "text-[#ffffff]"}`}>
            {formatCurrency(Math.abs(conv(userBalance)), currency)}
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <ul className="flex gap-6 overflow-x-auto no-scrollbar font-display">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 px-2 border-b-2 font-bold text-sm transition-all ${
            activeTab === "expenses" ?
            "border-emerald-500 text-emerald-600" :
            "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"}`
            }>
            
            Expenses Timeline
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`pb-3 px-2 border-b-2 font-bold text-sm transition-all ${
            activeTab === "members" ?
            "border-emerald-500 text-emerald-600" :
            "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"}`
            }>
            
            Members ({members.length})
          </button>
        </ul>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "expenses" &&
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Logs</span>
              <button
              onClick={onAddExpenseClick}
              className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
              
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            {expenses.length === 0 ?
          <div className="text-center py-16 bg-white/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500 mt-2">No expenses paid yet.</p>
                <button
              onClick={onAddExpenseClick}
              className="mt-3 px-4 py-2 border border-emerald-500/40 hover:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs">
              
                  Post First Bill
                </button>
              </div> :

          <div className="space-y-3">
                {expenses.map((exp) => {
              const isYouPayer = exp.paidBy === "you";
              const shareForYou = exp.shares.find((s) => s.userId === "you")?.amount || 0;

              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpenseForSettlement(exp)}
                  className="bg-white/70 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors relative group cursor-pointer shadow-sm hover:shadow-md">
                  
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {exp.category?.includes("Dining") || exp.category?.includes("Food") ?
                        <Utensils className="w-5 h-5 text-amber-500" /> :
                        exp.category?.includes("Transport") || exp.category?.includes("Taxi") ?
                        <Car className="w-5 h-5 text-sky-500" /> :
                        exp.category?.includes("Housing") || exp.category?.includes("Villa") ?
                        <Home className="w-5 h-5 text-emerald-500" /> :

                        <Coins className="w-5 h-5 text-purple-500" />
                        }
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-100 leading-tight">
                              {exp.description}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              Paid by <strong className="text-slate-750 dark:text-slate-300 font-medium">{isYouPayer ? "You" : exp.payerName}</strong> • {exp.date}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(conv(exp.amount), currency)}
                          </p>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                            {exp.splitType} split
                          </span>
                        </div>
                      </div>

                      {/* Share indicator */}
                      <div className="mt-3.5 pt-3.5 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          {isYouPayer ?
                      `You lent ${formatCurrency(conv(exp.amount - shareForYou), currency)}` :
                      `Your share was ${formatCurrency(conv(shareForYou), currency)}`
                      }
                        </span>
                        
                        {(() => {
                          const involved = (exp.shares || []).filter(s => s.userId !== "you" && s.amount > 0);
                          const unsettled = involved.filter(s => !(exp.settledMembers || []).includes(s.userId));
                          const isFullySettled = involved.length === 0 || unsettled.length === 0;
                          
                          if (!isFullySettled) {
                            return (
                              <span className="text-[10px] font-bold text-slate-400 italic px-2">
                                {unsettled.length} Pending
                              </span>
                            );
                          }
                          
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpenseIdToDelete(exp.id); }}
                              className="p-1 px-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg opacity-80 hover:opacity-100 transition-opacity hover:bg-red-500/20 text-[10px] font-bold"
                              title="Delete expense">
                              Delete
                            </button>
                          );
                        })()}
                      </div>
                    </div>);

            })}
              </div>
          }
          </div>
        }

        {activeTab === "members" &&
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 font-mono">Group Members</span>
              <button
              onClick={() => setInviteModal(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              
                <UserCheck className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-150/40 dark:divide-slate-800/40">
              {members.map((m) =>
            <div key={m.id} className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-3">
                    <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                  referrerPolicy="no-referrer" />
                
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{m.name} {m.id === "you" && "(You)"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.email}</p>
                    </div>
                  </div>
                </div>
            )}
            </div>
          </div>
        }
      </div>

      {/* Invite Member modal slider */}
      {inviteModal &&
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:items-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">Add to Group</h3>
              <button onClick={() => setInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
            type="text"
            placeholder="Search by name or email..."
            value={inviteQuery}
            onChange={(e) => setInviteQuery(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-4 transition-colors" />
          

            <div className="space-y-1 max-h-[160px] overflow-y-auto no-scrollbar">
              {allUsers.
            filter((u) => {
              const isQueryMatch = u.name.toLowerCase().includes(inviteQuery.toLowerCase()) || u.email.toLowerCase().includes(inviteQuery.toLowerCase());
              const isAlreadyMember = members.some((m) => m.id === u.id);
              return isQueryMatch && !isAlreadyMember;
            }).
            map((u) =>
            <button
              key={u.id}
              onClick={() => handleInviteUser(u.id)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
              
                    <div className="flex items-center gap-2.5">
                      <img
                  src={u.avatarUrl}
                  alt={u.name}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer" />
                
                      <div>
                        <p className="text-xs font-semibold text-slate-805 dark:text-slate-200 leading-none">{u.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                      Add +
                    </span>
                  </button>
            )
            }
              {allUsers.filter((u) => !members.some((m) => m.id === u.id)).length === 0 &&
            <p className="text-xs text-slate-400 py-4 text-center italic">All members are already in the group!</p>
            }
            </div>
          </div>
        </div>
      }



      {/* Delete Expense Confirmation Modal */}
      {expenseIdToDelete &&
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-bold text-base text-slate-850 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Confirm Expense Deletion</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to delete this expense? This action is permanent, and balances will re-calculate instantly.
            </p>
            {(() => {
            const expObj = expenses.find((e) => e.id === expenseIdToDelete);
            if (expObj) {
              return (
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 mb-5 text-xs text-slate-600 dark:text-slate-350">
                    <p className="font-bold">{expObj.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Amount: {formatCurrency(conv(expObj.amount), currency)} • Paid by {expObj.paidBy === "you" ? "You" : expObj.payerName}
                    </p>
                  </div>);

            }
            return null;
          })()}
            <div className="flex gap-2.5">
              <button
              type="button"
              onClick={() => setExpenseIdToDelete(null)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
              
                Cancel
              </button>
              <button
              type="button"
              onClick={async () => {
                if (expenseIdToDelete) {
                  await handleDeleteExpense(expenseIdToDelete);
                  setExpenseIdToDelete(null);
                }
              }}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md">
              
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      }

      {/* Delete Group Confirmation Modal (Author creator only) */}
      {showDeleteGroupConfirm &&
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-bold text-base text-red-650 dark:text-red-450 mb-2 flex items-center gap-2">
              <Trash2 className="w-4.5 h-4.5 text-red-500" />
              <span>Delete Entire Group</span>
            </h4>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to delete <strong>'{group.name}'</strong>? All associated expenses, receipt files, and suggested optimized debt settle arrangements will be permanently wiped out. This cannot be undone!
            </p>
            <div className="flex gap-2.5">
              <button
              type="button"
              onClick={() => setShowDeleteGroupConfirm(false)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200/90 dark:hover:bg-slate-750/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
              
                Cancel
              </button>
              <button
              type="button"
              onClick={handleDeleteGroupExecute}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-red-600/10">
              
                Permanently Wipe Group
              </button>
            </div>
          </div>
        </div>
      }

      {/* Delete Error Modal */}
      {deleteError && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-red-500/20 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 mb-4 mx-auto">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="font-display font-bold text-lg text-center text-slate-800 dark:text-slate-100 mb-2">
              Cannot Delete Group
            </h4>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {deleteError}
            </p>
            <button
              type="button"
              onClick={() => setDeleteError("")}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-xl text-sm transition-colors"
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}
      {/* Settlement Detail Modal */}
      {selectedExpenseForSettlement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:items-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <span>{selectedExpenseForSettlement.description}</span>
              </h3>
              <button onClick={() => setSelectedExpenseForSettlement(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 shrink-0">
              Total Amount: {formatCurrency(conv(selectedExpenseForSettlement.amount), currency)}<br />
              Paid by: {selectedExpenseForSettlement.paidBy === "you" ? "You" : selectedExpenseForSettlement.payerName || "Someone"}
            </p>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Unsettled Members</h4>
              
              {(() => {
                const involved = (selectedExpenseForSettlement.shares || []).filter(s => s.userId !== "you" && s.amount > 0);
                const unsettled = involved.filter(s => !(selectedExpenseForSettlement.settledMembers || []).includes(s.userId));
                
                if (unsettled.length === 0) {
                  return (
                    <div className="p-6 text-center border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                      <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All members have settled this expense!</p>
                    </div>
                  );
                }

                return unsettled.map(s => {
                  const m = members.find(mem => mem.id === s.userId);
                  return (
                    <div key={s.userId} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <img src={m?.avatarUrl} alt={m?.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m?.name}</p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Owes {formatCurrency(conv(s.amount), currency)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setExpenseIdToSettleConfirm(selectedExpenseForSettlement.id);
                          setSettleMemberId(s.userId);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Mark Settled
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Settle Confirm Modal */}
      {expenseIdToSettleConfirm && settleMemberId && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Check className="w-4.5 h-4.5 text-emerald-500" />
              <span>Confirm Settlement</span>
            </h4>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to mark this member's debt for this expense as fully settled? This action will remove them from the unsettled list.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setExpenseIdToSettleConfirm(null);
                  setSettleMemberId(null);
                }}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSettleExpenseMember}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}