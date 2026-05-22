import React, { useState, useEffect, useCallback } from 'react';
import { Users, Activity, TrendingUp, Calendar, RefreshCw, Send } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Server xatosi');
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const statCards = [
    {
      label: 'Jami foydalanuvchilar',
      value: stats?.totalUsers,
      icon: Users,
      iconColor: 'text-blue-400',
    },
    {
      label: 'Bugun aktiv',
      value: stats?.activeToday,
      icon: Activity,
      iconColor: 'text-green-400',
    },
    {
      label: '7 kun aktiv',
      value: stats?.activeLast7,
      icon: TrendingUp,
      iconColor: 'text-purple-400',
    },
    {
      label: '30 kun aktiv',
      value: stats?.activeLast30,
      icon: Calendar,
      iconColor: 'text-orange-400',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {lastUpdated
              ? `Yangilangan: ${lastUpdated.toLocaleTimeString('uz-UZ')}`
              : 'Yuklanmoqda...'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Recent broadcasts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Send size={16} className="text-gray-400" />
          <h2 className="text-white font-semibold text-sm">So'nggi broadcastlar</h2>
        </div>

        {loading ? (
          <div className="px-6 py-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !stats?.recentBroadcasts?.length ? (
          <div className="px-6 py-12 text-center text-gray-600 text-sm">
            Hali broadcast yuborilmagan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Sana</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Xabar</th>
                  <th className="text-right text-gray-500 font-medium px-6 py-3">Jami</th>
                  <th className="text-right text-gray-500 font-medium px-6 py-3">Yuborildi</th>
                  <th className="text-right text-gray-500 font-medium px-6 py-3">Xato</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBroadcasts.map((b, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(b.sentAt)}
                    </td>
                    <td className="px-6 py-3 text-gray-300 max-w-xs truncate">
                      {b.message?.slice(0, 50)}{b.message?.length > 50 ? '…' : ''}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-300 tabular-nums">
                      {b.total ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-green-400 tabular-nums font-medium">
                      {b.success ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-red-400 tabular-nums">
                      {b.failed ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
