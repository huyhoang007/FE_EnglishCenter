/**
 * AdminLayout — Modern White Executive Theme for English Center Admin
 * Designed to replicate the reference SaaS School/Center management UI
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Users,
  GraduationCap,
  BookOpen,
  BookA,
  Award,
  ShieldCheck,
  Settings,
  CalendarDays,
  Route,
  Sparkles,
  FileCheck2,
  Search,
  ChevronDown,
  KeyRound,
  Languages,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { NotificationBell } from '@/shared/components/NotificationBell';
import { ChangePasswordForm } from '@/shared/components/ChangePasswordForm';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { LOCALES, LOCALE_LABEL, type TranslationKey } from '@/shared/i18n/config';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const MANAGEMENT_NAV: NavItem[] = [
  { to: '/admin/payments', labelKey: 'admin.nav.payments', icon: Receipt },
  { to: '/admin/bookings', labelKey: 'admin.nav.bookings', icon: CalendarDays },
  { to: '/admin/students', labelKey: 'admin.nav.students', icon: Users },
  { to: '/admin/mentors', labelKey: 'admin.nav.mentors', icon: GraduationCap },
  { to: '/admin/courses', labelKey: 'admin.nav.courses', icon: BookOpen },
  { to: '/admin/vocabularies', labelKey: 'admin.nav.vocabulary', icon: BookA },
  { to: '/admin/certificates', labelKey: 'admin.nav.certificates', icon: Award },
  { to: '/admin/learning-paths', labelKey: 'admin.nav.learningPaths', icon: Route },
  { to: '/admin/practice-exams', labelKey: 'admin.nav.aiPractice', icon: Sparkles },
  { to: '/admin/exams', labelKey: 'admin.nav.exams', icon: FileCheck2 },
];

const OTHER_NAV: NavItem[] = [
  { to: '/admin/accounts', labelKey: 'admin.nav.accounts', icon: ShieldCheck },
  { to: '/admin/settings', labelKey: 'admin.nav.settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { userName, role, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, setLocale, t } = useTranslation();
  // Menu avatar: đổi mật khẩu, ngôn ngữ, đăng xuất
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Determine current active page title for breadcrumb
  const matchedNav = [...MANAGEMENT_NAV, ...OTHER_NAV].find((n) => location.pathname.startsWith(n.to));
  const currentNav = {
    label:
      location.pathname === '/admin'
        ? t('admin.layout.dashboardTitle')
        : matchedNav
          ? t(matchedNav.labelKey)
          : t('admin.layout.portal'),
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-800 flex"
      style={{ fontFamily: "'Poppins', 'Be Vietnam Pro', sans-serif" }}
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
              <span>{t('admin.nav.dashboard')}</span>
            </NavLink>
          </div>

          {/* Group: MANAGEMENT */}
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              {t('admin.nav.groupManagement')}
            </p>
            <nav className="space-y-1">
              {MANAGEMENT_NAV.map(({ to, labelKey, icon: Icon }) => (
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
                  <span>{t(labelKey)}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Group: OTHER */}
          <div>
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              {t('admin.nav.groupOther')}
            </p>
            <nav className="space-y-1">
              {OTHER_NAV.map(({ to, labelKey, icon: Icon }) => (
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
                  <span>{t(labelKey)}</span>
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
                {userName || t('admin.layout.adminUser')}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold truncate uppercase">
                {role === 'ADMIN' ? t('admin.layout.superAdmin') : role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('admin.layout.logout')}</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center pt-1 font-medium">
            {t('admin.layout.copyright')}
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
                  {t('admin.nav.dashboard')}
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
              placeholder={t('admin.layout.searchPlaceholder')}
              className="bg-transparent outline-none w-full placeholder:text-slate-400 text-slate-700 text-xs"
            />
          </div>

          {/* Right: Notification, Admin menu (đổi mật khẩu, ngôn ngữ, đăng xuất) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notifications (Dev 5 — API thật) */}
            <NotificationBell />

            {/* Profile Avatar + menu */}
            <div className="relative pl-2 border-l border-slate-200" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-slate-100 transition-colors"
                aria-label={t('admin.layout.accountMenu')}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {userName || t('admin.layout.adminUser')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {role === 'ADMIN' ? t('admin.layout.superAdmin') : role}
                  </p>
                </div>
                <ChevronDown
                  className={cn('hidden sm:block w-4 h-4 text-slate-400 transition-transform', profileMenuOpen && 'rotate-180')}
                />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-60 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                >
                  <ul className="py-1">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setChangePasswordOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        {t('admin.layout.changePassword')}
                      </button>
                    </li>
                    <li className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700">
                      <Languages className="w-4 h-4 text-slate-400" />
                      <span className="flex-1">{t('lang.label')}</span>
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                        {LOCALES.map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLocale(l)}
                            className={cn(
                              'h-6 px-2 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-colors',
                              locale === l ? 'bg-[#0052CC] text-white' : 'text-slate-500 hover:bg-slate-100',
                            )}
                          >
                            {LOCALE_LABEL[l]}
                          </button>
                        ))}
                      </div>
                    </li>
                  </ul>
                  <div className="border-t border-slate-100 py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('admin.layout.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Modal đổi mật khẩu (mở từ menu avatar) */}
        {changePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{t('admin.layout.changePassword')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ChangePasswordForm onCancel={() => setChangePasswordOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
