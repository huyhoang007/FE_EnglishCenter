/**
 * AdminLayout — Modern White Executive Theme for English Center Admin
 * Designed to replicate the reference SaaS School/Center management UI
 */

import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Settings,
  Bell,
  Mail,
  Search,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/shared/auth/useAuthStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const MANAGEMENT_NAV: NavItem[] = [
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/mentors', label: 'Mentors', icon: GraduationCap },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
];

const OTHER_NAV: NavItem[] = [
  { to: '/admin/accounts', label: 'Users & Roles', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { userName, role, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Determine current active page title for breadcrumb
  const currentNav =
    location.pathname === '/admin'
      ? { label: 'Admin Dashboard' }
      : [...MANAGEMENT_NAV, ...OTHER_NAV].find((n) => location.pathname.startsWith(n.to)) || {
          label: 'Admin Portal',
        };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-800 flex"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo Section */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-black text-lg shadow-sm">
              P
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-slate-900 text-base tracking-tight">PREP</span>
                <span className="font-black text-[#0052CC] text-base tracking-tight">MASTER</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">
                English Center
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main: Dashboard */}
          <div>
            <NavLink
              to="/admin"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all',
                  isActive
                    ? 'bg-[#0052CC] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* Group: MANAGEMENT */}
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              MANAGEMENT
            </p>
            <nav className="space-y-1">
              {MANAGEMENT_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Group: OTHER */}
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              OTHER
            </p>
            <nav className="space-y-1">
              {OTHER_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-[#0052CC] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom: User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0052CC] font-bold text-xs flex items-center justify-center">
                {userName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {userName || 'Admin User'}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold truncate uppercase">
                {role === 'ADMIN' ? 'Super Admin' : role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center pt-1 font-medium">
            © 2025 PrepMaster. All rights reserved.
          </p>
        </div>
      </aside>

      {/* ===================== MAIN WRAPPER ===================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Link to="/admin" className="hover:text-slate-600">
                  Dashboard
                </Link>
                {location.pathname !== '/admin' && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-slate-600 font-semibold">
                      {currentNav.label}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {currentNav.label}
              </h2>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center gap-2 h-9 px-3.5 bg-slate-50 border border-slate-200/80 rounded-full text-slate-400 text-xs min-w-[280px] lg:min-w-[340px] focus-within:bg-white focus-within:border-[#0052CC] focus-within:text-slate-700 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search anything across courses, students, mentors..."
              className="bg-transparent outline-none w-full placeholder:text-slate-400 text-slate-700 text-xs"
            />
          </div>

          {/* Right: Notification, Mail, Admin Chip */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notifications */}
            <button
              type="button"
              className="relative w-9 h-9 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Messages */}
            <button
              type="button"
              className="relative w-9 h-9 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
              title="Messages"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {userName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {userName || 'Admin User'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {role === 'ADMIN' ? 'Super Admin' : role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
