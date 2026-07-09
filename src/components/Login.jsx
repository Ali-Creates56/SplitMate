import React, { useState } from "react";
import { Sparkles, User, Mail, Lock, Key } from "lucide-react";
import { useHardwareBack } from "../hooks/useHardwareBack";

export default function Login({ onLogin, onRegister, isCheckingAuth }) {
  const [mode, setMode] = useState("login"); // 'login', 'register', 'forgot'
  const [step, setStep] = useState("initial"); // 'initial', 'otp'
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState(false);

  // Hardware Back Button Interception
  useHardwareBack(step === "otp", () => setStep("initial"));
  useHardwareBack(step === "initial" && mode !== "login", () => setMode("login"));

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please enter email and password.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else if (data.reactivate) {
        if (window.confirm(`Your account is scheduled for deletion in ${data.daysRemaining} days. Do you want to reactivate it?`)) {
          const reactivateRes = await fetch("/api/profile/reactivate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          if (reactivateRes.ok) {
            alert("Account reactivated successfully. Please log in again.");
          } else {
            setError("Failed to reactivate account.");
          }
        }
      } else {
        setError(data.error || "Login failed.");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("No internet connection");
      } else {
        setError("Server error.");
      }
    }
    setLoading(false);
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) return setError("Please fill all fields.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSimulated(data.simulated);
        setStep("otp");
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("No internet connection");
      } else {
        setError("Server error.");
      }
    }
    setLoading(false);
  };

  const handleRegisterVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp) return setError("Please enter OTP.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || "Invalid OTP.");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("No internet connection");
      } else {
        setError("Server error.");
      }
    }
    setLoading(false);
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
      } else {
        setError(data.error || "Request failed.");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("No internet connection");
      } else {
        setError("Server error.");
      }
    }
    setLoading(false);
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || !password) return setError("Please enter OTP and new password.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        setMode("login");
        setStep("initial");
        setPassword("");
        setError("Password reset successfully! Please login.");
      } else {
        setError(data.error || "Reset failed.");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("No internet connection");
      } else {
        setError("Server error.");
      }
    }
    setLoading(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center animate-pulse"></div>
          <div className="mt-6 h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto animate-pulse"></div>
          <div className="mt-2 h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mx-auto animate-pulse"></div>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-100 dark:border-slate-800">
            <div className="space-y-6">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse"></div>
              <div className="h-12 bg-emerald-200 dark:bg-emerald-900/50 rounded w-full animate-pulse mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-slate-800/50 relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 dark:bg-emerald-400/10 overflow-hidden flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-md shadow-emerald-500/10">
            <img src="/favicon.png" alt="Wallet Logo" className="w-12 h-12 object-cover" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100">SplitMate</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Smart expense management</p>
        </div>

        {/* Tabs for Login / Register */}
        {mode !== "forgot" && step === "initial" && (
          <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'login' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => { setMode('login'); setError(""); setOtp(""); setPassword(""); }}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'register' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => { setMode('register'); setError(""); setOtp(""); setPassword(""); }}
            >
              Register
            </button>
          </div>
        )}

        {error && (
          <div className={`mb-4 p-3 rounded-lg border text-xs text-center font-medium ${error.includes('successfully') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
            {error}
          </div>
        )}
        
        {simulated && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 text-center">
            Check your <b>server terminal</b> to see the printed OTP!
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && step === "initial" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-4 h-4" /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-4 h-4" /></span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="text-center mt-2">
              <button type="button" onClick={() => { setMode('forgot'); setError(""); setOtp(""); setPassword(""); }} className="text-xs text-emerald-600 hover:underline">Forgot password?</button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && step === "initial" && (
          <form onSubmit={handleRegisterRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4 h-4" /></span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-4 h-4" /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-4 h-4" /></span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">
              {loading ? "Sending OTP..." : "Create Account"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && step === "initial" && (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <h3 className="text-sm font-semibold text-center mb-2 text-slate-700">Reset Password</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-4 h-4" /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <div className="text-center mt-2">
              <button type="button" onClick={() => { setMode('login'); setError(""); setOtp(""); setPassword(""); }} className="text-xs text-slate-500 hover:underline">Back to Login</button>
            </div>
          </form>
        )}

        {/* OTP VERIFICATION (Used for Register and Forgot) */}
        {step === "otp" && (
          <form onSubmit={mode === 'register' ? handleRegisterVerify : handleForgotVerify} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase text-center block">Enter 6-Digit OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center tracking-[0.5em] text-lg text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
            </div>
            {mode === 'forgot' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">New Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Key className="w-4 h-4" /></span>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
            <button type="button" onClick={() => { setStep("initial"); setOtp(""); setPassword(""); }} className="w-full text-xs text-slate-500 hover:underline">
              Go Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}