import React from 'react';

export default function StatCard({ label, value, icon: Icon, iconColor, loading }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-gray-800 ${iconColor}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs uppercase tracking-wide font-medium truncate">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-16 bg-gray-800 rounded animate-pulse" />
        ) : (
          <p className="text-white text-2xl font-bold mt-0.5 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
          </p>
        )}
      </div>
    </div>
  );
}
