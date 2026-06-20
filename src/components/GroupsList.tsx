import React from "react";
import { Group, Currency } from "../types";
import { Plus, Home, Plane, School, Compass, FolderOpen, ArrowRight } from "lucide-react";
import { formatCurrency } from "../utils";

interface GroupsListProps {
  groups: any[];
  onGroupSelect: (group: any) => void;
  onCreateGroupClick: () => void;
  currency: Currency;
}

export default function GroupsList({
  groups,
  onGroupSelect,
  onCreateGroupClick,
  currency
}: GroupsListProps) {

  // Since currency is strictly PKR now, no conversion is necessary.
  const conv = (amt: number) => {
    return amt;
  };

  const getGroupIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("room") || n.includes("home") || n.includes("flat") || n.includes("rent")) {
      return <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
    }
    if (n.includes("trip") || n.includes("travel") || n.includes("dubai") || n.includes("ibiza")) {
      return <Plane className="w-6 h-6 text-sky-600 dark:text-sky-400 rotate-45" />;
    }
    if (n.includes("team") || n.includes("fyp") || n.includes("university") || n.includes("project")) {
      return <School className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    }
    return <Compass className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center pl-1">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-850 dark:text-slate-100">Your Groups</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a group to see transaction details and suggested settlements</p>
        </div>
        <button
          onClick={onCreateGroupClick}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/10 active:scale-95 transition-transform"
          title="Create a new expense group"
        >
          <Plus className="w-5 h-5 font-bold" />
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50 rounded-2xl flex flex-col justify-center items-center">
          <FolderOpen className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-3" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No Groups Found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create an expense group to start splitting bills!</p>
          <button
            onClick={onCreateGroupClick}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs tracking-wide transition-all shadow-md active:scale-98"
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const hasOwed = group.userBalance > 0.01;
            const hasYouOwe = group.userBalance < -0.01;
            const isSettled = !hasOwed && !hasYouOwe;

            return (
              <div
                key={group.id}
                onClick={() => onGroupSelect(group)}
                className="bg-white/70 dark:bg-slate-900/55 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                {/* Upper block */}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {getGroupIcon(group.name)}
                  </div>
                  
                  {/* Member avatars list */}
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {group.members.slice(0, 3).map((m: any) => (
                      <img
                        key={m.id}
                        src={m.avatarUrl}
                        alt={m.name}
                        title={m.name}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                    {group.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-400 z-10">
                        +{group.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lower info block with responsive currency values */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-slate-850 dark:text-slate-100 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {group.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-150/40 dark:border-slate-800/40">
                    <div className="flex justify-between font-body text-xs">
                      <span className="text-slate-500 dark:text-slate-450">Total Spend</span>
                      <span className="text-slate-850 dark:text-slate-200 font-bold">
                        {formatCurrency(conv(group.totalSpend), currency)}
                      </span>
                    </div>
                    <div className="flex justify-between font-body text-xs">
                      <span className="text-slate-500 dark:text-slate-450">Your Status</span>
                      {hasOwed && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          To receive {formatCurrency(conv(group.userBalance), currency)}
                        </span>
                      )}
                      {hasYouOwe && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          To give {formatCurrency(Math.abs(conv(group.userBalance)), currency)}
                        </span>
                      )}
                      {isSettled && (
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          Settled up
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
