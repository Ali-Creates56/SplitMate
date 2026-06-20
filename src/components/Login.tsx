import React, { useState } from "react";
import { Sparkles, User, Mail, Plus } from "lucide-react";

interface LoginProps {
  predefinedUsers: any[];
  onLogin: (user: any) => void;
  onRegister: (name: string, email: string) => Promise<boolean>;
}

export default function Login({ predefinedUsers, onLogin, onRegister }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newName.trim() || !newEmail.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    const success = await onRegister(newName, newEmail);
    setLoading(false);
    if (success) {
      setIsRegistering(false);
      setNewName("");
      setNewEmail("");
    } else {
      setError("Email already exists or is invalid.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-slate-800/50 relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-md shadow-emerald-500/10">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100">Welcome to SplitMate</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Group expense management made simple</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 text-center font-medium">
            {error}
          </div>
        )}

        {!isRegistering ? (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                Quick Login as Predefined Member:
              </label>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {predefinedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-150 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800/50 group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{user.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Login
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 border-t border-slate-200 dark:border-slate-800" />
              <span className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-widest">Or create new</span>
            </div>

            <button
              onClick={() => setIsRegistering(true)}
              className="w-full py-3 border border-dashed border-emerald-500/50 hover:border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Profile</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="reg-name" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4 h-4" /></span>
                <input 
                  id="reg-name"
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ali Ahmed" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-4 h-4" /></span>
                <input 
                  id="reg-email"
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md disabled:bg-emerald-600/50 transition-colors text-sm"
              >
                {loading ? "Creating Profile..." : "Register & Login"}
              </button>
              
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="w-full py-2.5 text-center text-xs text-slate-500 hover:text-slate-850 dark:text-slate-400 transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
