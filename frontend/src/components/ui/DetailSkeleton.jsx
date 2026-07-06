import React from 'react';

export default function DetailSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-8 animate-pulse shadow-sm">
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
          <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
          <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-slate-50 rounded border border-slate-100"></div>
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
        <div className="h-10 bg-slate-200 rounded w-24"></div>
        <div className="h-10 bg-blue-200 rounded w-32"></div>
      </div>
    </div>
  );
}
