/**
 * Header — Floating Capsule Pill (Premium EdTech)
 * -----------------------------------------------------------
 *  - max-w-7xl mx-auto rounded-full shadow-md border
 *  - 100% English navigation labels
 *  - Compact search + streak + notifications + user dropdown
 *  - Truly generic — does NOT contain page-specific content
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Receipt,
  LogOut,
  User,
  Settings,
  Search,
  Bell,
  LogIn,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';

export interface HeaderProps {
  className?: string;
}

interface NavItem {
  label: string;
  to: string;
  roles: UserRole[];
  hasDropdown?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'My Courses',
    to: '/my-courses',
    roles: ['USER', 'STUDENT', 'MENTOR'],
  },
  {
    label: 'Programs & Paths',
    to: '/courses',
    roles: ['GUEST', 'USER', 'STUDENT', 'MENTOR', 'ADMIN'],
    hasDropdown: true,
  },
  {
    label: 'Practice & Mock Tests',
    to: '/exams',
    roles: ['GUEST', 'USER', 'STUDENT', 'MENTOR', 'ADMIN'],
    hasDropdown: true,
  },
  {
    label: '1-on-1 Mentorship',
    to: '/schedule',
    roles: ['STUDENT', 'MENTOR'],
  },
  {
    label: 'Mentors',
    to: '/mentors',
    roles: ['GUEST', 'USER', 'STUDENT', 'MENTOR', 'ADMIN'],
  },
  {
    label: 'Admin Portal',
    to: '/admin',
    roles: ['ADMIN'],
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  GUEST: 'Guest',
  USER: 'Learner',
  STUDENT: 'Student',
  MENTOR: 'Mentor',
  ADMIN: 'Administrator',
};

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, userName, user, logout, isAuthenticated } = useAuthStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /**
   * Đồng bộ `keyword` của ô tìm kiếm với sàn khóa học.
   * Điều hướng tới `/courses?keyword=…` (đọc bởi CourseMarketplacePage).
   */
  useEffect(() => {
    if (location.pathname === '/courses') return;
    if (!keywordInput.trim()) return;
    const timer = window.setTimeout(() => {
      navigate(`/courses?keyword=${encodeURIComponent(keywordInput.trim())}`);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [keywordInput, navigate, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.fullName || userName || 'User';
  const displayEmail = user?.email || '';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const showAuthenticatedCluster = isAuthenticated && role !== 'GUEST';

  return (
    <header
      className={cn(
        'w-full max-w-7xl mx-auto',
        'bg-white rounded-full',
        'px-4 sm:px-6 py-2.5',
        'flex items-center justify-between gap-3',
        'shadow-md border border-slate-200/80',
        'mt-3 mb-2',
        className,
      )}
      style={{ fontFamily: "'Poppins', 'Be Vietnam Pro', sans-serif" }}
    >
      {/* ============== LOGO ============== */}
      <Link
        to="/"
        className="flex items-center gap-2.5 shrink-0"
        title="PrepMaster — Home"
      >
        <div
          className="w-9 h-9 rounded-lg bg-[#0052CC] text-white font-bold flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="leading-none text-base">P</span>
        </div>
        <span className="hidden sm:inline font-black text-xl tracking-tight text-slate-900">
          PREP <span className="text-[#0052CC]">MASTER</span>
        </span>
      </Link>

      {/* ============== NAV MENU ============== */}
      <nav
        className="hidden lg:flex items-center h-full"
        aria-label="Primary navigation"
      >
        <ul className="flex items-center gap-1">
          {visibleNav.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  'inline-flex items-center gap-1 px-3 h-10 rounded-full',
                  'text-sm font-semibold text-slate-700',
                  'hover:text-[#0052CC] hover:bg-blue-50/70',
                  'transition-colors',
                )}
              >
                {item.label}
                {item.hasDropdown && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ============== RIGHT CLUSTER ============== */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search bar — dẫn tới /courses?keyword= (GET /api/v1/courses?keyword=) */}
        <div className="hidden md:flex items-center gap-2 h-10 px-3.5 rounded-full bg-slate-50 border border-slate-200/80 focus-within:border-[#0052CC] focus-within:bg-white transition-colors min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keywordInput.trim()) {
                navigate(`/courses?keyword=${encodeURIComponent(keywordInput.trim())}`);
              }
            }}
            placeholder="Search courses, topics..."
            className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
            aria-label="Search courses, topics"
          />
        </div>

        {!showAuthenticatedCluster ? (
          <>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={cn(
                'hidden md:inline-flex items-center gap-1.5 h-10 px-4 rounded-full',
                'text-sm font-semibold text-slate-700',
                'hover:text-[#0052CC] hover:bg-slate-50',
                'transition-colors',
              )}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full',
                'bg-[#0052CC] hover:bg-[#0040A8] text-white',
                'px-5 py-2 font-bold text-sm shadow-sm',
                'transition-colors',
              )}
            >
              <GraduationCap className="w-4 h-4" />
              Start Learning
            </button>
          </>
        ) : (
          <>
            {/* Daily Streak */}
            <span
              className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 text-xs font-bold"
              title="Daily study streak"
            >
              <span aria-hidden="true">🔥</span>
              5 Days
            </span>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className={cn(
                  'relative w-10 h-10 rounded-full',
                  'hover:bg-slate-100 transition-colors',
                  'inline-flex items-center justify-center',
                )}
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={notifOpen}
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span
                  className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"
                  aria-hidden="true"
                />
              </button>
              {notifOpen && (
                <div
                  role="menu"
                  className={cn(
                    'absolute right-0 top-12 w-80 z-40',
                    'bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden',
                  )}
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      Notifications
                    </p>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      3 New
                    </span>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {[
                      {
                        title: 'New mock test available',
                        desc: 'IELTS Academic Mock #14 is now unlocked.',
                        time: '2m ago',
                      },
                      {
                        title: 'Mentor feedback ready',
                        desc: 'David Smith graded your Writing Task 2.',
                        time: '1h ago',
                      },
                      {
                        title: 'Weekly study report',
                        desc: 'You studied 6.5 hours this week. Keep going!',
                        time: 'Yesterday',
                      },
                    ].map((n, i) => (
                      <li
                        key={i}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {n.desc}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                          {n.time}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* User profile dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className={cn(
                  'inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full',
                  'border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                  'transition-colors',
                )}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span
                  className="w-7 h-7 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold text-xs shrink-0"
                  aria-hidden="true"
                >
                  {avatarInitial}
                </span>
                <span className="hidden md:inline text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown
                  className={cn(
                    'hidden md:block w-4 h-4 text-slate-400 transition-transform',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className={cn(
                    'absolute right-0 top-12 w-64 z-40',
                    'bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden',
                  )}
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {displayEmail}
                    </p>
                    <span className="inline-flex items-center mt-2 h-5 px-2 rounded-md bg-[#E0F2FE] text-[#0052CC] text-[10px] font-bold uppercase tracking-wider">
                      {ROLE_LABEL[role]}
                    </span>
                  </div>
                  <ul className="py-1">
                    {['USER', 'STUDENT'].includes(role) && <li><Link to="/payments" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><Receipt className="w-4 h-4 text-slate-400" />Payments</Link></li>}
                    <li>
                      <Link
                        to="/my-courses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        My Learning
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </Link>
                    </li>
                  </ul>
                  <div className="border-t border-slate-100 py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
