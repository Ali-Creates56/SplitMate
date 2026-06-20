import React, { useState, useEffect } from "react";
import { User, Currency } from "./types";
import Onboarding from "./components/Onboarding";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import GroupsList from "./components/GroupsList";
import GroupDetails from "./components/GroupDetails";
import AddExpense from "./components/AddExpense";
import Analytics from "./components/Analytics";
import { 
  Sparkles, 
  Home as HomeIcon, 
  Users as UsersIcon, 
  User as UserIcon, 
  Moon, 
  Sun, 
  Check, 
  PlusCircle, 
  LogOut, 
  Activity,
  UserCheck,
  ChevronRight,
  X
} from "lucide-react";

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [predefinedUsers, setPredefinedUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalExpenses: 0,
    amountOwed: 0,
    amountYouOwe: 0,
    netBalance: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [currency, setCurrency] = useState<Currency>("Rs.");
  const [darkMode, setDarkMode] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"home" | "groups" | "profile">("home");

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Create Group Form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCurrency, setNewGroupCurrency] = useState<Currency>("Rs.");
  const [newGroupBg, setNewGroupBg] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Profile Edit Form
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Run on mount
  useEffect(() => {
    // Check local preferences
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
    
    // Fetch users and current state
    fetchPredefinedUsers();
    fetchCurrentSession();
  }, []);

  // Update theme tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Sync state whenever active components or logged in session changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, activeTab]);

  const refreshData = async () => {
    try {
      // Parallel fetches for speed and reactivity
      const [resGroups, resStats, resAct] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/stats"),
        fetch("/api/notifications")
      ]);

      if (resGroups.ok) setGroups(await resGroups.json());
      if (resStats.ok) setStats(await resStats.json());
      if (resAct.ok) setActivities(await resAct.json());
    } catch (err) {
      console.error("Failed to refresh dashboard data schema", err);
    }
  };

  const fetchPredefinedUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setPredefinedUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentSession = async () => {
    try {
      const res = await fetch("/api/currentUser");
      if (res.ok) {
        const u = await res.json();
        if (u) {
          setCurrentUser(u);
          setProfileName(u.name);
          setProfileEmail(u.email);
          setProfileAvatar(u.avatarUrl);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfileAvatar(user.avatarUrl);
    refreshData();
  };

  const handleRegister = async (name: string, email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
      if (res.ok) {
        const data = await res.json();
        handleLogin(data.user);
        fetchPredefinedUsers();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleSwitchUser = async (id: string) => {
    try {
      const res = await fetch("/api/currentUser/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const active = await res.json();
        setCurrentUser(active);
        setProfileName(active.name);
        setProfileEmail(active.email);
        setProfileAvatar(active.avatarUrl);
        fetchPredefinedUsers();
        refreshData();
        setSelectedGroup(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          currency: newGroupCurrency,
          bgImage: newGroupBg || undefined,
          memberIds: selectedMembers
        })
      });

      if (res.ok) {
        setNewGroupName("");
        setNewGroupDesc("");
        setNewGroupBg("");
        setSelectedMembers([]);
        setShowCreateGroup(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          avatarUrl: profileAvatar
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setProfileSuccess(true);
        fetchPredefinedUsers();
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMemberSelection = (uid: string) => {
    setSelectedMembers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error("Failed to delete notification activity", err);
    }
  };

  // Render Logic Flow
  if (!onboarded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 transition-colors duration-300">
        <Onboarding onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 transition-colors duration-300">
        <Login 
          predefinedUsers={predefinedUsers}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Universal Floating Navigation bar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-205/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              S
            </div>
            <span className="font-display font-medium text-lg tracking-tight text-slate-850 dark:text-slate-100">
              SplitMate
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick launch floating button */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {selectedGroup ? (
          <GroupDetails 
            groupId={selectedGroup.id}
            onBack={() => {
              setSelectedGroup(null);
              refreshData();
            }}
            currency={currency}
            currentUser={currentUser}
            allUsers={predefinedUsers}
            onAddExpenseClick={() => setShowAddExpense(true)}
          />
        ) : (
          <div>
            {activeTab === "home" && (
              <Dashboard 
                stats={stats}
                currentUser={currentUser}
                activities={activities}
                onAddExpenseClick={() => setShowAddExpense(true)}
                onCreateGroupClick={() => setShowCreateGroup(true)}
                onSettleUpClick={() => {
                  // Direct to groups tab to pick group first or click settle on group
                  setActiveTab("groups");
                }}
                onViewReportsClick={() => setShowAnalytics(true)}
                currency={currency}
                onLogout={handleLogout}
                predefinedUsers={predefinedUsers}
                onSwitchUser={handleSwitchUser}
                onDeleteActivity={handleDeleteActivity}
              />
            )}

            {activeTab === "groups" && (
              <GroupsList 
                groups={groups}
                onGroupSelect={(g) => setSelectedGroup(g)}
                onCreateGroupClick={() => setShowCreateGroup(true)}
                currency={currency}
              />
            )}

            {activeTab === "profile" && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="pl-1">
                  <h2 className="font-display font-bold text-2xl text-slate-850 dark:text-slate-100">Account Preferences</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure profile details to sync on receipts</p>
                </div>

                {profileSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center">
                    Profile successfully updated in database!
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="bg-white/70 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col items-center gap-4 py-2 border-b border-slate-150/40 dark:border-slate-800/30">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 flex items-center justify-center shrink-0 bg-slate-100">
                      <img 
                        src={profileAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDThjmqH6fm5-FAys1g4tycG4MH6zoNkwX0W-tfGgJfbGAVFyybt5P6IGpMgXoZlhEgM8DNGFzTI89pPT3xkphC8gW9SAtvijZGLG2MLVAGeb63BFPDzHUXFehWxOdoNVQev6n-4xHO2PgM10ckZDOo9aWW-WVFHAVQz18uqPf5SOIa7C6dN98D8l2gVu6DGg4s24mfkPKujevAfER9KUCccVe80vNPQiVVnx38k_MrubwRwnBzP2t_umhnUqQBM8PJES09Xj79pac"} 
                        alt="Avatar" 
                        className="w-full h-full object-cover font-sans"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="w-full text-center">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">Upload Profile Picture</label>
                      <input 
                        type="file"
                        accept="image/*"
                        id="profile-pic-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="profile-pic-upload"
                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                      >
                        Choose Picture
                      </label>
                      {profileAvatar && (
                        <p className="text-[10px] text-slate-400 mt-1.5 truncate max-w-[200px] mx-auto font-sans">
                          Photo loaded successfully!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      style={{ backgroundColor: '#1b283c' }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs tracking-wide transition-colors shadow-md"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation Rails Tab Bar For Visual Parity */}
      <footer className="sticky bottom-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-3 py-3 font-display">
          <button 
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("home");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "home" && !selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Overview</span>
          </button>

          <button 
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("groups");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "groups" || selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Groups</span>
          </button>

          <button 
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("profile");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "profile" && !selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Profile</span>
          </button>
        </div>
      </footer>

      {/* Add Expense Dynamic Modal Slider */}
      {showAddExpense && (
        <AddExpense 
          groups={groups}
          currentUser={currentUser}
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            refreshData();
            if (selectedGroup) {
              // Trigger reload key in group details
              const temp = selectedGroup;
              setSelectedGroup(null);
              setTimeout(() => {
                setSelectedGroup(temp);
              }, 10);
            }
          }}
          initialGroupId={selectedGroup?.id}
          currency={currency}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end xs:items-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-202 dark:border-slate-800 animate-in slide-in-from-bottom-6 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <UsersIcon className="w-5 h-5 text-emerald-500" />
                <span>Create Expense Group</span>
              </h3>
              <button onClick={() => setShowCreateGroup(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Northern Odyssey '26"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Shared diesel, fuel and hotel bills"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Default Currency</label>
                  <select
                    value={newGroupCurrency}
                    onChange={(e) => setNewGroupCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    disabled
                  >
                    <option value="Rs.">Rs. PKR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Group Cover Picture</label>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <input 
                      type="file"
                      accept="image/*"
                      id="group-cover-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewGroupBg(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label 
                      htmlFor="group-cover-upload" 
                      className="cursor-pointer inline-flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-center text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
                    >
                      Choose Picture
                    </label>
                    {newGroupBg && (
                      <div className="w-full h-12 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-100 text-center flex items-center justify-center">
                        <img src={newGroupBg} alt="Preview" className="w-full h-full object-cover font-sans" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Members selection list */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Add Group Members</label>
                <div className="bg-slate-500/5 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[160px] overflow-y-auto no-scrollbar space-y-2">
                  {predefinedUsers.map((u) => {
                    const isSelected = selectedMembers.includes(u.id);
                    return (
                      <div 
                        key={u.id}
                        onClick={() => toggleMemberSelection(u.id)}
                        className={`flex justify-between items-center p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                          isSelected 
                            ? "bg-emerald-500/10 border border-emerald-500/15" 
                            : "bg-white/40 border border-slate-150/40 hover:bg-slate-50 dark:bg-slate-900/45 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <span className={`${isSelected ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-350"}`}>{u.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/15"
                >
                  Build Group
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <Analytics 
          groups={groups}
          currency={currency}
          onClose={() => setShowAnalytics(false)}
        />
      )}

    </div>
  );
}
