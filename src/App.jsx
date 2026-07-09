import React, { useState, useEffect } from "react";
import { SplashScreen } from '@capacitor/splash-screen';

import Onboarding from "./components/Onboarding";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import GroupsList from "./components/GroupsList";
import GroupDetails from "./components/GroupDetails";
import AddExpense from "./components/AddExpense";
import Analytics from "./components/Analytics";
import AdminDashboard from "./components/AdminDashboard";
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
  X,
  ImagePlus,
  Trash2 } from
"lucide-react";

export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("splitmate_onboarded") === "true");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [predefinedUsers, setPredefinedUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const stats = {
    totalGroups: groups.length,
    totalExpenses: 0,
    amountOwed: groups.reduce((sum, g) => sum + (g.userBalance > 0 ? g.userBalance : 0), 0),
    amountYouOwe: groups.reduce((sum, g) => sum + (g.userBalance < 0 ? Math.abs(g.userBalance) : 0), 0),
    netBalance: groups.reduce((sum, g) => sum + (g.userBalance || 0), 0)
  };
  const [activities, setActivities] = useState([]);
  const [currency, setCurrency] = useState("Rs.");
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tab navigation
  const [activeTab, setActiveTab] = useState("home");

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Create Group Form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCurrency, setNewGroupCurrency] = useState("Rs.");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Profile Edit Form
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Friend Management Form
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [friendError, setFriendError] = useState("");

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

  // Background Cache Sync when internet is restored
  useEffect(() => {
    const handleOnline = () => {
      if (currentUser) {
        refreshData(true); // pass true for silent background refresh
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  const refreshData = async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const fetchPromise = Promise.all([
        fetch("/api/groups"),
        fetch("/api/notifications")
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 1500)
      );

      let results;
      try {
        results = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (e) {
        if (e.message === "Timeout") {
          // Snap to cache if server is too slow
          let hasCache = false;
          try {
            const cachedGroups = localStorage.getItem("sm_groups");
            const cachedAct = localStorage.getItem("sm_act");
            if (cachedGroups) {
              setGroups(JSON.parse(cachedGroups));
              hasCache = true;
            }
            if (cachedAct) setActivities(JSON.parse(cachedAct));
          } catch (err) {}
          
          if (hasCache) {
            setIsLoading(false);
          }

          // Now wait for the fetch to finish in the background
          results = await fetchPromise;
        } else {
          throw e;
        }
      }

      const [resGroups, resAct] = results;

      if (resGroups && resGroups.ok) {
        const data = await resGroups.json();
        setGroups(data);
        localStorage.setItem("sm_groups", JSON.stringify(data));
      }
      if (resAct && resAct.ok) {
        const data = await resAct.json();
        setActivities(data);
        localStorage.setItem("sm_act", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to refresh dashboard data schema", err);
    } finally {
      setIsLoading(false);
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
    let cachedUserStr = null;
    let cachedUser = null;
    try {
      cachedUserStr = localStorage.getItem("sm_currentUser");
      if (cachedUserStr) {
        cachedUser = JSON.parse(cachedUserStr);
      }
    } catch(err) {}

    try {
      const url = cachedUser ? `/api/currentUser?id=${cachedUser.id}` : "/api/currentUser";
      const fetchPromise = fetch(url);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 1000)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (res && res.ok) {
        const u = await res.json();
        if (u) {
          localStorage.setItem("sm_currentUser", JSON.stringify(u));
          setCurrentUser(u);
          setProfileName(u.name);
          setProfileEmail(u.email);
          setProfileAvatar(u.avatarUrl);
        }
      } else if (res && res.status === 401) {
        localStorage.removeItem("sm_currentUser");
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Network or Auth Error:", err);
      // Timeout or offline fallback
      if (cachedUser) {
        setCurrentUser(cachedUser);
        setProfileName(cachedUser.name);
        setProfileEmail(cachedUser.email);
        setProfileAvatar(cachedUser.avatarUrl);
      } else {
        setCurrentUser(null);
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = (user) => {
    localStorage.setItem("sm_currentUser", JSON.stringify(user));
    setCurrentUser(user);
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfileAvatar(user.avatarUrl);
    refreshData();
  };

  const handleRegister = async (name, email) => {
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

  const handleCreateGroup = async (e) => {
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
          memberIds: selectedMembers
        })
      });

      if (res.ok) {
        setNewGroupName("");
        setNewGroupDesc("");
        setSelectedMembers([]);
        setShowCreateGroup(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser.id,
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

  const toggleMemberSelection = (uid) => {
    setSelectedMembers((prev) =>
    prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFriendName, email: "" }) // Removed email
      });
      if (res.ok) {
        setNewFriendName("");
        fetchPredefinedUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFriend = async (id) => {
    setFriendError("");
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPredefinedUsers();
      } else {
        const errorData = await res.json();
        setFriendError(errorData.error || "Could not delete friend");
        setTimeout(() => setFriendError(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setFriendError("Server error.");
      setTimeout(() => setFriendError(""), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sm_currentUser");
    setCurrentUser(null);
  };

  const handleDeleteActivity = async (id) => {
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

  const handleBulkDeleteActivities = async (ids) => {
    try {
      const res = await fetch("/api/notifications/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error("Failed to bulk delete activities", err);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to request account deletion? You will have 10 days to reactivate it before it's permanently deleted.");
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/profile/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id })
      });
      if (res.ok) {
        alert("Account scheduled for deletion. Logging out.");
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      sessionStorage.clear();
      alert("App cache cleared successfully! Storage space freed.");
    } catch (err) {
      console.error("Cache clear failed", err);
      alert("Failed to clear cache completely.");
    }
  };

  // Render Logic Flow
  if (!onboarded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 transition-colors duration-300">
        <Onboarding onComplete={() => {
          localStorage.setItem("splitmate_onboarded", "true");
          setOnboarded(true);
        }} />
      </div>);

  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 transition-colors duration-300">
        <Login isCheckingAuth={true} onLogin={() => {}} onRegister={() => {}} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 transition-colors duration-300">
        <Login
          onLogin={handleLogin}
          onRegister={handleRegister} />
        
      </div>);

  }

  if (currentUser.role === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Universal Floating Navigation bar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-205/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 overflow-hidden flex items-center justify-center text-white font-bold text-base shadow-sm">
              <img src="/favicon.png" alt="Wallet Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-medium text-lg tracking-tight text-slate-850 dark:text-slate-100">
              SplitMate
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick launch floating button removed */}
          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-6 pb-24">
        {selectedGroup ?
        <GroupDetails
          groupId={selectedGroup.id}
          onBack={() => {
            setSelectedGroup(null);
            refreshData();
          }}
          currency={currency}
          currentUser={currentUser}
          allUsers={predefinedUsers}
          onAddExpenseClick={() => setShowAddExpense(true)} /> :


        <div>
            {activeTab === "home" &&
          <Dashboard
            stats={stats}
            currentUser={currentUser}
            activities={activities}
            isLoading={isLoading}
            onCreateGroupClick={() => setShowCreateGroup(true)}
            onSettleUpClick={() => {
              // Direct to groups tab to pick group first or click settle on group
              setActiveTab("groups");
            }}
            onViewReportsClick={() => setShowAnalytics(true)}
            currency={currency}
            onLogout={handleLogout}
            onDeleteActivity={handleDeleteActivity}
            onBulkDeleteActivities={handleBulkDeleteActivities} />

          }

            {activeTab === "groups" &&
          <GroupsList
            groups={groups}
            isLoading={isLoading}
            onGroupSelect={(g) => setSelectedGroup(g)}
            onCreateGroupClick={() => setShowCreateGroup(true)}
            currency={currency} />

          }
            {activeTab === "friends" &&
          <div className="space-y-6 max-w-md mx-auto">
                <div className="pl-1">
                  <h2 className="font-display font-bold text-2xl text-slate-850 dark:text-slate-100">Private Contacts</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your friends to add them to groups.</p>
                </div>
                
                {friendError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 text-center font-medium animate-in fade-in zoom-in duration-300">
                    {friendError}
                  </div>
                )}

                <form onSubmit={handleAddFriend} className="bg-white/70 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add New Friend</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Name</label>
                    <input
                  type="text"
                  required
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none" />
                  </div>

                  <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs tracking-wide transition-colors shadow-md">
                    Add Friend
                  </button>
                </form>

                <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Friends ({predefinedUsers.filter(u => u.id !== "you").length})</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {predefinedUsers.filter(u => u.id !== "you").map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
                            {u.email && <p className="text-[10px] text-slate-400">{u.email}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFriend(u.id)}
                          className="text-[10px] text-red-500 font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded-lg transition-colors">
                          Delete
                        </button>
                      </div>
                    ))}
                    {predefinedUsers.filter(u => u.id !== "you").length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">You haven't added any friends yet.</p>
                    )}
                  </div>
                </div>
              </div>
          }


            {activeTab === "profile" &&
          <div className="space-y-6 max-w-md mx-auto">
                <div className="pl-1">
                  <h2 className="font-display font-bold text-2xl text-slate-850 dark:text-slate-100">Account Preferences</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure profile details to sync on receipts</p>
                </div>

                {profileSuccess &&
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center">
                    Profile successfully updated in database!
                  </div>
            }

                <form onSubmit={handleUpdateProfile} className="bg-white/70 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col items-center gap-4 py-2 border-b border-slate-150/40 dark:border-slate-800/30">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 flex items-center justify-center shrink-0 bg-slate-100">
                      <img
                    src={profileAvatar || "/default_avatar.webp"}
                    alt="Avatar"
                    className="w-full h-full object-cover font-sans"
                    referrerPolicy="no-referrer" />
                  
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
                          setProfileAvatar(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden" />
                  
                      <label
                    htmlFor="profile-pic-upload"
                    className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98">
                    
                        Choose Picture
                      </label>
                      {profileAvatar &&
                  <p className="text-[10px] text-slate-400 mt-1.5 truncate max-w-[200px] mx-auto font-sans">
                          Photo loaded successfully!
                        </p>
                  }
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Display Name</label>
                    <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none" />
                
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
                    <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  style={{ backgroundColor: '#1b283c' }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none" />
                
                  </div>

                  <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs tracking-wide transition-colors shadow-md">
                
                    Save Changes
                  </button>
                  <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-semibold rounded-xl text-xs tracking-wide transition-colors">
                
                    Delete Account
                  </button>
                  <button
                type="button"
                onClick={handleClearCache}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs tracking-wide transition-colors">
                    Clear App Cache Data
                  </button>
                </form>
              </div>
          }
          </div>
        }
      </main>

      {/* Navigation Rails Tab Bar For Visual Parity */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto grid grid-cols-4 py-3 font-display">
          <button
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("home");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === "home" && !selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`
            }>
            
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Home</span>
          </button>

          <button
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("groups");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === "groups" || selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`
            }>
            
            <UsersIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Groups</span>
          </button>

          <button
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("friends");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === "friends" && !selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`
            }>
            
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Friends</span>
          </button>

          <button
            onClick={() => {
              setSelectedGroup(null);
              setActiveTab("profile");
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
            activeTab === "profile" && !selectedGroup ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`
            }>
            
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Profile</span>
          </button>
        </div>
      </footer>

      {/* Add Expense Dynamic Modal Slider */}
      {showAddExpense &&
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
        currency={currency} />

      }

      {/* Create Group Modal */}
      {showCreateGroup &&
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500" />
              
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <input
                type="text"
                placeholder="e.g. Shared diesel, fuel and hotel bills"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-xl font-body text-xs text-slate-800 dark:text-slate-100 focus:outline-none" />
              
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
                      isSelected ?
                      "bg-emerald-500/10 border border-emerald-500/15" :
                      "bg-white/40 border border-slate-150/40 hover:bg-slate-50 dark:bg-slate-900/45 dark:border-slate-800"}`
                      }>
                      
                        <div className="flex items-center gap-2">
                          <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <span className={`${isSelected ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-350"}`}>{u.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>);

                })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                type="button"
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName("");
                  setNewGroupDesc("");
                  setSelectedMembers([]);
                }}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/15">
                
                  Build Group
                </button>
              </div>

            </form>
          </div>
        </div>
      }

      {/* Analytics Modal */}
      {showAnalytics &&
      <Analytics
        groups={groups}
        currency={currency}
        onClose={() => setShowAnalytics(false)} />

      }

    </div>);

}