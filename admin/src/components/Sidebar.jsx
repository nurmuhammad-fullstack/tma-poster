import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Send, Users, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/broadcast', label: 'Broadcast', icon: Send, end: false },
  { to: '/users', label: 'Foydalanuvchilar', icon: Users, end: false },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="w-60 flex flex-col bg-gray-900 border-r border-gray-800 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <span className="text-2xl">🏐</span>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
          <p className="text-gray-500 text-xs">Volleyball Poster Studio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
