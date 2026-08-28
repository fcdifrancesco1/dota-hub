import React from 'react';

export function SkeletonCard({ rows = 3, className = "" }) {
  return (
    <div className={`p-4 rounded-xl bg-dota-surface/60 border border-dota-border/50 animate-pulse space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="h-3.5 bg-white/10 rounded w-1/3" />
        <div className="h-3 bg-white/10 rounded w-12" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-4 bg-white/10 rounded w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full bg-dota-surface/50 border border-dota-border/60 rounded-xl overflow-hidden animate-pulse">
      <div className="bg-dota-card/60 p-3 border-b border-dota-border/50 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-white/10 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-white/5 p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="py-3 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-3.5 bg-white/10 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
