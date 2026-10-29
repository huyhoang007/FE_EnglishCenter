/**
 * Header — Floating Capsule Pill (Premium EdTech)
 * -----------------------------------------------------------
 *  - max-w-7xl mx-auto rounded-full shadow-md border
 *  - 100% English navigation labels
 *  - Compact search + notifications + user dropdown (đã bỏ streak giả "5 Days")
 *  - Truly generic — does NOT contain page-specific content
 *  - Menu theo role: MENTOR chỉ có Teaching Schedule, Exam Grading, Learning Paths
 *    (không có khóa học, thi thử, luyện đề AI, ô tìm khóa học)
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
  LogIn,
  GraduationCap,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';
import { NotificationBell } from '@/shared/components/NotificationBell';
import { CLIENT_ROUTES } from '@/shared/constants/routes';

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
  /* ---------- MENTOR: lịch dạy 1-1, chấm Writing/Speaking, xem lộ trình ---------- */
  {
    // Dev 5: mentor mở / quản lý khung giờ dạy ngay trong layout client
    label: 'Teaching Schedule',
    to: CLIENT_ROUTES.teachingSchedule,
    roles: ['MENTOR'],
  },
  {
    // Flow Dev 3: mentor chấm Writing / Speaking của bài kiểm tra năng lực
    label: 'Exam Grading',
    to: CLIENT_ROUTES.examGrading,
    roles: ['MENTOR'],
  },
  /* ---------- Người học + chung ---------- */
  {
    label: 'My Courses',
    to: CLIENT_ROUTES.myCourses,
    roles: ['USER', 'STUDENT'],
  },
  {
    label: 'Programs & Paths',
    to: '/courses',
    roles: ['GUEST', 'USER', 'STUDENT', 'ADMIN'],
    hasDropdown: true,
  },
  {
    label: 'Practice & Mock Tests',
    to: CLIENT_ROUTES.exams,
    roles: ['GUEST', 'USER', 'STUDENT', 'ADMIN'],
    hasDropdown: true,
  },
  {
    label: 'Learning Paths',
    to: CLIENT_ROUTES.learningPath,
    roles: ['STUDENT', 'MENTOR', 'ADMIN'],
  },
  {
    label: 'AI Practice',
    to: CLIENT_ROUTES.practice,
    roles: ['STUDENT', 'ADMIN'],
  },
  {
    // Học viên đặt lịch kèm 1-1 với mentor (Dev 5)
    label: 'Mentor Schedule',
    to: CLIENT_ROUTES.schedule,
    roles: ['STUDENT'],
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
  const [keywordInput, setKeywordInput] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  /** Mentor: không có ô tìm khóa học, My Learning; logo về lịch dạy */
  const isMentor = role === 'MENTOR';
  const isLearner = role === 'USER' || role === 'STUDENT';

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
        to={isMentor ? CLIENT_ROUTES.teachingSchedule : '/'}
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
        className={cn(
          'hidden lg:flex items-center h-full',
          // Mentor chỉ có 3 mục: dãn đều trên toàn bộ khoảng giữa logo và cụm bên phải
          isMentor && 'flex-1 mx-8',
        )}
        aria-label="Primary navigation"
      >
        <ul className={cn('flex items-center gap-1', isMentor && 'w-full justify-evenly')}>
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
        {/* Search bar — dẫn tới /courses?keyword= (GET /api/v1/courses?keyword=); mentor không có */}
        {!isMentor && (
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
        )}

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
            {/* Notifications (Dev 5 — API thật) */}
            <NotificationBell />

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
                    {isLearner && <li><Link to="/payments" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><Receipt className="w-4 h-4 text-slate-400" />Payments</Link></li>}
                    {/* Lịch học cá nhân (Dev 5 — TASK-D5-01): chỉ USER / STUDENT */}
                    {isLearner && (
                      <li>
                        <Link
                          to={CLIENT_ROUTES.studySchedule}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <CalendarClock className="w-4 h-4 text-slate-400" />
                          Study Schedule
                        </Link>
                      </li>
                    )}
                    {!isMentor && (
                      <li>
                        <Link
                          to={CLIENT_ROUTES.myCourses}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          My Learning
                        </Link>
                      </li>
                    )}
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
