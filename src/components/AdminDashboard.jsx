import React, { useState, useEffect } from "react";
import { Users, LayoutDashboard, Wallet, LogOut, Loader2, ArrowRight } from "lucide-react";

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-xs">Loading Admin Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            </div>
            <p className="text-sm text-slate-400 mt-2">Platform-wide Telemetry & Analytics</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-rose-500 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
            <Users className="w-6 h-6 text-emerald-500 mb-4" />
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Registered Users</p>
            <p className="text-4xl font-bold text-white mt-2 font-display">{stats?.totalUsers || 0}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-sky-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-sky-500/20" />
            <Users className="w-6 h-6 text-sky-500 mb-4" />
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Active Groups</p>
            <p className="text-4xl font-bold text-white mt-2 font-display">{stats?.totalGroups || 0}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/20" />
            <Wallet className="w-6 h-6 text-amber-500 mb-4" />
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Ecosystem Volume</p>
            <p className="text-3xl font-bold text-white mt-2 font-display flex items-end gap-1">
              <span className="text-lg text-slate-500 font-normal">Rs.</span>
              {(stats?.totalVolume || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center">
          <p className="text-slate-400 text-sm mb-4">You are logged in with God Mode access.</p>
          <div className="inline-flex items-center justify-center p-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-xs font-mono text-slate-300">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               System Operational
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
