import React from 'react';

export default function CardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-xl animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}
