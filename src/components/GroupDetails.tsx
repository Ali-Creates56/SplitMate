import React, { useState, useEffect } from "react";
import { User, Group, Currency } from "../types";
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
  CheckCircle
} from "lucide-react";
import { formatCurrency, CATEGORIES } from "../utils";

interface GroupDetailsProps {
  groupId: string;
  onBack: () => void;
  currency: Currency;
  currentUser: User;
  allUsers: User[];
  onAddExpenseClick: () => void;
}

export default function GroupDetails({
  groupId,
  onBack,
  currency,
  currentUser,
  allUsers,
  onAddExpenseClick
}: GroupDetailsProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "members">("expenses");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [settlingPair, setSettlingPair] = useState<any>(null); // { fromUserId, toUserId, amount } for quick settle
  const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(null);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);

  // Fetch group data
  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
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
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Group not found.</p>
        <button onClick={onBack} className="text-emerald-500 font-bold mt-2">Go back</button>
      </div>
    );
  }

  const { group, totalSpend, expenses, settlements, balances, suggestedSettlements, members } = data;
  const userBalance = balances.find((b: any) => b.userId === "you")?.balance || 0;

  // Since currency is strictly PKR now, no conversion is necessary.
  const conv = (amt: number) => {
    return amt;
  };

  // Delete Expense handler
  const handleDeleteExpense = async (expId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expId}`, { method: "DELETE" });
      if (res.ok) {
        fetchGroupDetails();
      }
    } catch (err) {
      console.error(err);
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
        alert(errObj.error || "Could not delete group");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invite member
  const handleInviteUser = async (uid: string) => {
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

  // Execute quick settle settlement payment
  const handleConfirmSettle = async () => {
    if (!settlingPair) return;
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          fromUserId: settlingPair.fromUserId,
          toUserId: settlingPair.toUserId,
          amount: settlingPair.amount,
          currency: group.currency,
          notes: `Cleared balance via optimized suggested settlements`
        })
      });
      if (res.ok) {
        setSettlingPair(null);
        fetchGroupDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cover Backdrop Trip Photo Image with Sunset reflection */}
      <div className="relative w-full h-56 sm:h-72 rounded-3xl overflow-hidden shadow-md">
        <img 
          src={group.bgImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuCjze4an5dRuTUSf4agOA_qZ4AT6-KojfnkUADZgQEWhyObcd6gz_SVOSmwH1qS_zm5sAJX32ArjZ0MooqIo49QecyHGD2VciNwTksmOSA2aX_DjuhE5l4YQ1BfLNdBwPDjjGebqY2Ywg43yh0KBk5GsmJS95DbQtAVQvd-CsC4O-rI2pmBrvIGgxnvDQpvTBJj_B97_jRFo5yYIl9X30HxDkwyOXLSfu_nqPAFHv2mn4U__gyRaJvAhbji48MUQNjKtBC03c-XRvQ"} 
          alt={group.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        
        {/* Back navigation */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Delete group option - Author only */}
        {group.createdByEmail === currentUser?.email && (
          <button 
            type="button"
            onClick={() => setShowDeleteGroupConfirm(true)}
            className="absolute top-4 right-4 p-2.5 bg-red-600/30 hover:bg-red-600/80 text-white rounded-full transition-all backdrop-blur-md cursor-pointer border border-red-500/10"
            title={`Delete '${group.name}' completely (Creator only)`}
          >
            <Trash2 className="w-5 h-5 text-red-200" />
          </button>
        )}

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/80 text-white px-2 py-0.5 rounded leading-none">
              Group Active
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1 drop-shadow-md">
              {group.name}
            </h1>
            <p className="text-xs text-slate-200 opacity-90 mt-1">
              Created • {group.createdDate}
            </p>
          </div>

          {/* Member avatars horizontal list */}
          <div className="flex -space-x-3 bg-white/10 p-1.5 rounded-full backdrop-blur-md border border-white/10">
            {members.slice(0, 5).map((m: any) => (
              <img
                key={m.id}
                src={m.avatarUrl}
                alt={m.name}
                title={m.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-900"
                referrerPolicy="no-referrer"
              />
            ))}
            {members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold font-mono">
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Analytics block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#000000] rounded-2xl p-5 shadow-sm col-span-2 sm:col-span-1 border border-slate-800 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00d492]">Total Expenses</p>
          <p className="font-semibold text-xl text-white mt-1">
            {formatCurrency(conv(totalSpend), currency)}
          </p>
        </div>

        <div className="bg-[#000000] p-5 rounded-2xl col-span-1 border border-slate-800 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-85 text-slate-300">
            {userBalance >= 0 ? "To Receive" : "To Give"}
          </p>
          <p className="font-semibold text-xl mt-1 font-mono text-[#ffffff]">
            {formatCurrency(Math.abs(conv(userBalance)), currency)}
          </p>
        </div>

        <div className="bg-[#000000] rounded-2xl p-4 shadow-sm col-span-1 sm:col-span-2 flex items-center justify-between gap-4 border border-slate-800 text-white">
          <div className="hidden xs:block">
            <p className="text-xs text-slate-400">Net Balance</p>
            <p className={`font-semibold mt-1 ${userBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {userBalance >= 0 ? "+" : ""}{formatCurrency(conv(userBalance), currency)}
            </p>
          </div>
          {suggestedSettlements.length > 0 ? (
            <button
              onClick={() => {
                // Pre-populate some quick settle target if available
                const firstOpt = suggestedSettlements[0];
                setSettlingPair(firstOpt);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-transform"
            >
              Settle Debts
            </button>
          ) : (
            <span className="text-xs text-[#ffffff] font-mono italic">All Settled Up!</span>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <ul className="flex gap-6 overflow-x-auto no-scrollbar font-display">
          <button 
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 px-2 border-b-2 font-bold text-sm transition-all ${
              activeTab === "expenses" 
                ? "border-emerald-500 text-emerald-600" 
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
            }`}
          >
            Expenses Timeline
          </button>
          <button 
            onClick={() => setActiveTab("balances")}
            className={`pb-3 px-2 border-b-2 font-bold text-sm transition-all ${
              activeTab === "balances" 
                ? "border-emerald-500 text-emerald-600" 
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
            }`}
          >
            Balances & Debts
          </button>
          <button 
            onClick={() => setActiveTab("members")}
            className={`pb-3 px-2 border-b-2 font-bold text-sm transition-all ${
              activeTab === "members" 
                ? "border-emerald-500 text-emerald-600" 
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
            }`}
          >
            Members ({members.length})
          </button>
        </ul>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Logs</span>
              <button 
                onClick={onAddExpenseClick}
                className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-16 bg-white/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500 mt-2">No expenses paid yet.</p>
                <button 
                  onClick={onAddExpenseClick}
                  className="mt-3 px-4 py-2 border border-emerald-500/40 hover:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs"
                >
                  Post First Bill
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp: any) => {
                  const isYouPayer = exp.paidBy === "you";
                  const shareForYou = exp.shares.find((s: any) => s.userId === "you")?.amount || 0;

                  return (
                    <div 
                      key={exp.id}
                      className="bg-white/70 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors relative group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {exp.category?.includes("Dining") || exp.category?.includes("Food") ? (
                              <Utensils className="w-5 h-5 text-amber-500" />
                            ) : exp.category?.includes("Transport") || exp.category?.includes("Taxi") ? (
                              <Car className="w-5 h-5 text-sky-500" />
                            ) : exp.category?.includes("Housing") || exp.category?.includes("Villa") ? (
                              <Home className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Coins className="w-5 h-5 text-purple-500" />
                            )}
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
                          {isYouPayer 
                            ? `You lent ${formatCurrency(conv(exp.amount - shareForYou), currency)}` 
                            : `Your share was ${formatCurrency(conv(shareForYou), currency)}`
                          }
                        </span>
                        
                        <button
                          onClick={() => setExpenseIdToDelete(exp.id)}
                          className="p-1 px-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg opacity-80 hover:opacity-100 transition-opacity hover:bg-red-500/20 text-[10px] font-bold"
                          title="Delete expense"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "balances" && (
          <div className="space-y-6">
            {/* Suggested Settle up Debt Minimization */}
            {suggestedSettlements.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest font-mono">
                  Smart Suggested Settlements (Optimized)
                </h3>
                <p className="text-xs text-slate-500">The engine has run a greedy transaction optimization to eliminate redundant debts. Clear the balances with minimum transactions:</p>
                <div className="space-y-2.5">
                  {suggestedSettlements.map((sug: any, idx: number) => {
                    const fromUser = members.find((m: any) => m.id === sug.fromUserId);
                    const toUser = members.find((m: any) => m.id === sug.toUserId);
                    const isYouFrom = sug.fromUserId === "you";
                    const isYouTo = sug.toUserId === "you";

                    return (
                      <div 
                        key={idx}
                        className="bg-white/50 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/50 rounded-xl flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {isYouFrom ? "You" : (fromUser?.name || sug.fromUserId)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(conv(sug.amount), currency)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {isYouTo ? "You" : (toUser?.name || sug.toUserId)}
                          </span>
                        </div>

                        {/* Interactive settling tool */}
                        {(isYouFrom || isYouTo) && (
                          <button
                            onClick={() => setSettlingPair(sug)}
                            className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                          >
                            Mark Settled
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General raw balance list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 font-mono">
                Individual Balance Sheets
              </h3>
              <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-150/40 dark:divide-slate-800/40">
                {balances.map((b: any) => {
                  const hasOwed = b.balance > 0.01;
                  const hasYouOwe = b.balance < -0.01;
                  const isSettled = !hasOwed && !hasYouOwe;

                  return (
                    <div key={b.userId} className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={b.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDThjmqH6fm5-FAys1g4tycG4MH6zoNkwX0W-tfGgJfbGAVFyybt5P6IGpMgXoZlhEgM8DNGFzTI89pPT3xkphC8gW9SAtvijZGLG2MLVAGeb63BFPDzHUXFehWxOdoNVQev6n-4xHO2PgM10ckZDOo9aWW-WVFHAVQz18uqPf5SOIa7C6dN98D8l2gVu6DGg4s24mfkPKujevAfER9KUCccVe80vNPQiVVnx38k_MrubwRwnBzP2t_umhnUqQBM8PJES09Xj79pac"} 
                          alt={b.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{b.name} {b.userId === "you" && "(You)"}</p>
                          <p className="text-xs text-slate-400 mt-1">Group Member</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-semibold font-mono text-sm ${
                          hasOwed ? "text-emerald-600 dark:text-emerald-400" : hasYouOwe ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {hasOwed && "+"}
                          {formatCurrency(conv(b.balance), currency)}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {hasOwed ? "To receive" : hasYouOwe ? "To give" : "Fully Settled"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 font-mono">Group Members</span>
              <button 
                onClick={() => setInviteModal(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <UserCheck className="w-4 h-4" />
                <span>Invite Member</span>
              </button>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-150/40 dark:divide-slate-800/40">
              {members.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={m.avatarUrl} 
                      alt={m.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{m.name} {m.id === "you" && "(You)"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Member modal slider */}
      {inviteModal && (
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
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-4 transition-colors"
            />

            <div className="space-y-1 max-h-[160px] overflow-y-auto no-scrollbar">
              {allUsers
                .filter(u => {
                  const isQueryMatch = u.name.toLowerCase().includes(inviteQuery.toLowerCase()) || u.email.toLowerCase().includes(inviteQuery.toLowerCase());
                  const isAlreadyMember = members.some((m: any) => m.id === u.id);
                  return isQueryMatch && !isAlreadyMember;
                })
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleInviteUser(u.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={u.avatarUrl} 
                        alt={u.name} 
                        className="w-8 h-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-805 dark:text-slate-200 leading-none">{u.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                      Add +
                    </span>
                  </button>
                ))
              }
              {allUsers.filter(u => !members.some((m: any) => m.id === u.id)).length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center italic">All members are already in the group!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settle Up Dialog Confirmation Modal */}
      {settlingPair && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              Record Settlement
            </h3>
            
            <p className="text-xs text-slate-550 dark:text-slate-350 leading-relaxed mb-4">
              Are you sure you want to log a settlement of <strong>{formatCurrency(conv(settlingPair.amount), currency)}</strong> representing a physical transaction transfer?
            </p>

            <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl mb-4 border border-slate-200/50 dark:border-slate-800/50">
              <div className="text-center flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Payer</span>
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {members.find((m: any) => m.id === settlingPair.fromUserId)?.name || settlingPair.fromUserId}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-center flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Recipient</span>
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {members.find((m: any) => m.id === settlingPair.toUserId)?.name || settlingPair.toUserId}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setSettlingPair(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettle}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md animate-pulse"
              >
                Settle up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {expenseIdToDelete && (
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
              const expObj = expenses.find((e: any) => e.id === expenseIdToDelete);
              if (expObj) {
                return (
                  <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 mb-5 text-xs text-slate-600 dark:text-slate-350">
                    <p className="font-bold">{expObj.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Amount: {formatCurrency(conv(expObj.amount), currency)} • Paid by {expObj.paidBy === "you" ? "You" : expObj.payerName}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setExpenseIdToDelete(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors"
              >
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
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal (Author creator only) */}
      {showDeleteGroupConfirm && (
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
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200/90 dark:hover:bg-slate-750/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroupExecute}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-red-600/10"
              >
                Permanently Wipe Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
