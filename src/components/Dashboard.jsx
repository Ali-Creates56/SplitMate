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
  Trash2,
  LogOut,
  X } from
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
  isLoading
}) {
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
            Recent Activity
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time alerts</span>
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
            {activities.slice(0, 5).map((act) =>
          <div
            key={act.id}
            className="bg-white/70 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors group relative">
            
                <div className="flex items-center gap-3 mr-12">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 shrink-0">
                    {getCategoryIcon(act.content)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                      {act.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {act.groupName} • {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
              type="button"
              onClick={() => setActivityToDelete(act)}
              className="absolute right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              title="Delete Activity">
              
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
          )}
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
              "{activityToDelete.content}"
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