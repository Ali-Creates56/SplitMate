import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`}
      {...props}
    />
  );
}

export function SkeletonCircle({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-full ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = "", ...props }) {
  return (
    <div
      className={`bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 ${className}`}
      {...props}
    >
      <div className="flex gap-4 items-center mb-4">
        <SkeletonCircle className="w-12 h-12" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
           <SkeletonCircle className="w-10 h-10" />
           <div className="flex-1 space-y-2">
             <Skeleton className="h-4 w-3/4" />
             <Skeleton className="h-3 w-1/2" />
           </div>
        </div>
      ))}
    </div>
  );
}
