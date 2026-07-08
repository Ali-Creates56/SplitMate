import React, { useState } from "react";
import { Sparkles, ArrowRight, HelpCircle } from "lucide-react";





export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
  {
    title: "Split Expenses Effortlessly",
    desc: "Split bills, groceries, and travel expenses directly with your flatmates or travel companions. Equal, unequal, or percentage splits are supported.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxClTOeuN85fpDZYze4OBvdocHLLqTiNP6JuH66u50j1-bxun9Krw6Gu1fznR0-tgzhs9Yzj3SzUBCvOqWYsl01habV9_3qZNe6AacEnvfHRtozFAGDOKfjxidkUZQKvpiS7t_0llwqTrrVM4813VnsQZd6plUtSWg-4vJOZgVldI6u2rgc_h9I42duvwCRtAVXhLz6rjEc2pQtQ7MxmmOXhXECWwNQT2fBKNryIk7eq5TWwgMTPJr1-PGtGJ8dNPkFKj6T5Vegq4"
  },
  {
    title: "Automatic Balance Tracking",
    desc: "No more messy spreadsheets. SplitMate's real-time engine keeps track of exact individual balances, credits, and debits automatically.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkIpYBsLuPqgc-ywhBeRepTi_CauU-oBuEI6z-0xS5eeYky1iZOa8cHK4Dzl-ik1vm2ieEGOZnNp0CJ2WOIwUstcNbYV92_zOS-Y7brIp13dR556X2AZCapV8K6gLd5P9aoqyqLf8gpERMoAeCPJKkOSAufJWf9y9QHJgRRzF5CXQ89qM60LJLDDl77368uQmOZBgnKsM1PYqAd95Bwb2-s8vWwYVlJvxWjyac4ohgoyZUCs3QODcDmmfhfJslEEPlX7G3FfWpB7g"
  },
  {
    title: "Settle Debts Intelligently",
    desc: "Get suggested payments optimized to minimize transaction complexity. Settle up and clear your balances instantly with a single click.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtf3lXPReiBek8D8pn3lDYZG0k3Yw-rqrpGImKHwBh-EPvCxElGw5uO6fPUL3perYP6QiLPWijHElqOJiqF-rmbZzFrGmSy4IEPa4yo8OXxTTTbVUguDheZI2Rv6J4Ur3Hgmw89jMox3A0MHFQ1Cja4xw3o1LRXvyh86fv78LChTX-SbiMfzjFIRyruHnZcfcjD0SJWmCKD7XJw8IOKeCiL4Lo8jGS40x8RTs7IsbRiomzaFristlRd9LBxIQOVCm_pJxoubg7GFI"
  }];


  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40 dark:border-slate-800/40 relative z-10">
        
        {/* Skip Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold font-display text-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>SplitMate</span>
          </div>
          <button
            onClick={onComplete}
            className="text-xs uppercase tracking-wider font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
            
            Skip
          </button>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex flex-col items-center text-center">
          <div className="w-full h-52 rounded-2xl overflow-hidden shadow-md mb-6 bg-slate-100 dark:bg-slate-800">
            <img
              src={steps[step].image}
              alt={steps[step].title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer" />
            
          </div>
          
          <h2 className="font-display font-bold text-2xl text-slate-850 dark:text-slate-100 mb-2 leading-tight">
            {steps[step].title}
          </h2>
          
          <p className="text-sm text-slate-600 dark:text-slate-350 min-h-[4.5rem] leading-relaxed">
            {steps[step].desc}
          </p>
        </div>

        {/* Carousel indicators & Button */}
        <div className="flex flex-col items-center gap-6 mt-4">
          <div className="flex gap-2 justify-center">
            {steps.map((_, idx) =>
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
              idx === step ?
              "w-6 bg-emerald-500" :
              "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"}`
              } />

            )}
          </div>

          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
            
            <span>{step === steps.length - 1 ? "Get Started" : "Next"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>);

}