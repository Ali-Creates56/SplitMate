import React, { useState } from "react";
import { Skeleton, SkeletonCircle, SkeletonCard, SkeletonList } from "./Skeleton";

import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  UserPlus,
  Coins,
  BarChart3,
  ChevronRight,
  Utensils,
  Car,
  Home,
  Lightbulb,
  CheckCircle,
  FileText,
  UserCheck,
  LogOut,
  X,
  CheckSquare,
  Square,
  Check,
  Receipt } from
"lucide-react";
import { formatCurrency, CATEGORIES } from "../utils";






















export default function Dashboard({
  stats,
  currentUser,
  activities,
  onCreateGroupClick,
  onSettleUpClick,
  onViewReportsClick,
  currency,
  onLogout,
  onDeleteActivity,
  onBulkDeleteActivities,
  isLoading
}) {
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Since currency is strictly PKR now, no conversion is necessary.
  const conv = (amt) => {
    return amt;
  };

  const getCategoryIcon = (desc) => {
    const d = desc.toLowerCase();
    if (d.includes("pacha") || d.includes("dinner") || d.includes("luigi") || d.includes("pizza") || d.includes("food")) {
      return <Utensils className="w-5 h-5 text-amber-500" />;
    }
    if (d.includes("taxi") || d.includes("uber") || d.includes("airport") || d.includes("car")) {
      return <Car className="w-5 h-5 text-sky-500" />;
    }
    if (d.includes("rent") || d.includes("apartment") || d.includes("villa") || d.includes("airbnb")) {
      return <Home className="w-5 h-5 text-emerald-500" />;
    }
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Section */}
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm cursor-default">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Welcome Back</p>
            </div>
            <h1 className="font-display font-bold text-xl text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
              <span>{currentUser.name}</span>
            </h1>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
            title="Logout Session">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Net Balance Premium Glassmorphism Card */}
      {isLoading ? (
        <SkeletonCard className="h-32 w-full" />
      ) : (
      <div id="net-balance-card" style={{ backgroundColor: '#000000' }} className="glass dark:dark-glass rounded-3xl p-6 shadow-lg shadow-emerald-950/5 relative overflow-hidden">
        {/* Breakdown bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium whitespace-nowrap">To receive</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {formatCurrency(conv(stats.amountOwed), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest pl-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          
          <button
            onClick={onCreateGroupClick}
            className="p-4 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all text-center">
            
            <UserPlus className="w-6 h-6 text-sky-500" />
            <span className="text-xs font-semibold tracking-wide">Create Group</span>
          </button>
          
          <button
            onClick={onSettleUpClick}
            className="p-4 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all text-center">
            
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <span className="text-xs font-semibold tracking-wide">Settle Up</span>
          </button>
          
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pl-1">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              Recent Activity
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time alerts</span>
          </div>
          
          {activities.length > 0 && (
            <div className="flex items-center gap-2">
              {isSelectionMode && selectedIds.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Delete ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedIds([]);
                }}
                className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isSelectionMode ? "Cancel" : "Select"}
              </button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <SkeletonList count={3} />
        ) : activities.length === 0 ? (
        <div className="text-center py-10 bg-white/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
            <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No recent activity detected.</p>
          </div>
        ) : (
        <div className="flex flex-col gap-2.5">
            {activities.slice(0, 5).map((act) => {
              const isSelected = selectedIds.includes(act.id);
              const hasPayload = !!act.payload;
              const toggleSelect = () => {
                if (isSelected) setSelectedIds(selectedIds.filter(id => id !== act.id));
                else setSelectedIds([...selectedIds, act.id]);
              };

              return (
              <div
                key={act.id}
                onClick={() => { if(isSelectionMode) toggleSelect(); }}
                className={`bg-white/70 dark:bg-slate-900/40 p-4 border rounded-2xl flex justify-between items-center transition-colors relative group ${isSelectionMode ? 'cursor-pointer hover:border-emerald-500/50' : ''} ${isSelected ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/80'}`}>
                
                {isSelectionMode && (
                  <div className="mr-3 shrink-0 text-slate-400">
                    {isSelected ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5" />}
                  </div>
                )}

                {hasPayload && act.type === "expense" ? (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getCategoryIcon(act.payload.category || act.payload.description || "")}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-100 leading-tight truncate">
                            {act.payload.description}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            Paid by <strong className="text-slate-750 dark:text-slate-300 font-medium">{act.payload.paidBy === "you" ? "You" : act.payload.payerName}</strong> • {new Date(act.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {formatCurrency(conv(act.payload.amount), currency)}
                        </p>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 truncate max-w-[60px] block">
                          {act.groupName}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : hasPayload && act.type === "settlement" ? (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-100 leading-tight truncate">
                            Settlement
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            <strong className="text-slate-750 dark:text-slate-300 font-medium">{act.payload.fromUserId === "you" ? "You" : act.payload.fromName}</strong> paid <strong className="text-slate-750 dark:text-slate-300 font-medium">{act.payload.toUserId === "you" ? "You" : act.payload.toName}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(conv(act.payload.amount), currency)}
                        </p>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 truncate max-w-[60px] block">
                          {act.groupName}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 shrink-0">
                      {getCategoryIcon(act.content)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {act.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {act.groupName} • {new Date(act.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {!isSelectionMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActivityToDelete(act); }}
                    className="absolute right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Delete Activity">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal for Deleting Activity */}
      {activityToDelete &&
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-2">
              Confirm Activity Deletion
            </h4>
            <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed mb-4">
              Do you want to delete this activity?
            </p>
            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 mb-4 text-xs italic text-slate-650 dark:text-slate-300 truncate">
              "{activityToDelete.content || (activityToDelete.payload && activityToDelete.payload.description) || "Activity"}"
            </div>
            <div className="flex gap-2.5">
              <button
              type="button"
              onClick={() => setActivityToDelete(null)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
              
                Cancel
              </button>
              <button
              type="button"
              onClick={async () => {
                await onDeleteActivity(activityToDelete.id);
                setActivityToDelete(null);
              }}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-red-500/10">
              
                Delete
              </button>
            </div>
          </div>
        </div>
      }

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm &&
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-2">
              Delete Selected Activities
            </h4>
            <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to delete {selectedIds.length} selected activities?
            </p>
            <div className="flex gap-2.5">
              <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
                Cancel
              </button>
              <button
              type="button"
              onClick={async () => {
                if (onBulkDeleteActivities) {
                  await onBulkDeleteActivities(selectedIds);
                }
                setShowBulkDeleteConfirm(false);
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-red-500/10">
                Delete ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      }
    {showLogoutConfirm &&
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 mb-2">
              Sign Out
            </h4>
            <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-2.5">
              <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
                Cancel
              </button>
              <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(false);
                onLogout();
              }}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-red-500/10">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}