/**
 * MentorLayout — shell for Mentor portal (/mentor/*)
 * -----------------------------------------------------------
 * Lightweight admin-style shell: sidebar + topbar + content.
 * Tái sử dụng các shared component (Card, Badge, Button) và
 * chuẩn typography Prep.vn.
 */

import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  Search,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/shared/auth/useAuthStore';

const NAV_ITEMS = [
  { to: '/mentor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/mentor/grading', label: 'Grading Queue', icon: ClipboardList, end: false },
];

export const MentorLayout: React.FC = () => {
  const { userName, role, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 grid grid-cols-1 lg:grid-cols-[260px_1fr]"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* ============= SIDEBAR ============= */}
      <aside className="hidden lg:flex flex-col bg-white border-r border-slate-200 px-4 py-5">
        <Link to="/mentor" className="flex items-center gap-2.5 px-2 mb-7">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0052CC] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            P
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-slate-900 text-sm tracking-tight">
              PrepMaster
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Mentor Console
            </p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[#0052CC] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
              {userName?.[0]?.toUpperCase() ?? 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">
                {userName ?? 'Mentor'}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {role}
              </p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============= MAIN ============= */}
      <div className="flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Mentor</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-bold">
              {NAV_ITEMS.find((n) => n.to === location.pathname)?.label ??
                'Console'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 h-8 bg-slate-100 rounded-full text-xs text-slate-500 min-w-[220px]">
              <Search className="w-3.5 h-3.5" />
              <span>Search submissions, learners…</span>
            </div>
            <button
              type="button"
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MentorLayout;
