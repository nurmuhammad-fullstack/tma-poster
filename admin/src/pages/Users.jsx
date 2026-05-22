import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users as UsersIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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

function timeAgo(isoString) {
  if (!isoString) return '—';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hozirgina';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} kun oldin`;
    const months = Math.floor(days / 30);
    return `${months} oy oldin`;
  } catch {
    return isoString;
  }
}

const PAGE_SIZE = 50;

export default function Users() {
  const [allUsers, setAllUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      // Fetch all users (limit=1000 to get full list for client-side search)
      const res = await fetch('/api/users?page=1&limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Server xatosi');
      const data = await res.json();
      setAllUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.chatId || '').includes(q)
    );
  }, [allUsers, search]);

  // Reset to page 1 on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Foydalanuvchilar</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Jami:{' '}
            <span className="text-white font-medium">
              {loading ? '...' : total.toLocaleString()}
            </span>{' '}
            ta
            {search && ` · Filtr: ${filtered.length} ta`}
          </p>
        </div>
        <button
          onClick={fetchUsers}
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

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki username bo'yicha qidiring..."
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <UsersIcon size={40} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'Natija topilmadi' : 'Foydalanuvchilar yo\'q'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 w-12">#</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Ism</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">Username</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 hidden md:table-cell">
                    Chat ID
                  </th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 hidden lg:table-cell">
                    Qo'shilgan sana
                  </th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3">
                    Oxirgi faollik
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user, idx) => {
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={user.chatId}
                      className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-gray-600 tabular-nums">{rowNum}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                            {user.firstName ? user.firstName[0].toUpperCase() : '?'}
                          </div>
                          <span className="text-white font-medium">
                            {user.firstName || <span className="text-gray-600 italic">Nomsiz</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {user.username ? (
                          <a
                            href={`https://t.me/${user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            @{user.username}
                          </a>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                        {user.chatId}
                      </td>
                      <td className="px-6 py-3 text-gray-400 whitespace-nowrap hidden lg:table-cell">
                        {formatDate(user.joinedAt)}
                      </td>
                      <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                        {timeAgo(user.lastActive)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-gray-500 text-sm">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} /{' '}
            {filtered.length} ta
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-gray-900 border border-gray-800 hover:border-gray-700 disabled:opacity-40 text-gray-400 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      page === p
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-gray-900 border border-gray-800 hover:border-gray-700 disabled:opacity-40 text-gray-400 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
