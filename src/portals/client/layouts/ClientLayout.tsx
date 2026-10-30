/**
 * ClientLayout — Global Master Layout for the Client Portal
 * -----------------------------------------------------------
 * Composition (shared by ALL client pages):
 *   1. Discreet Top Bar with Role Switcher (slim dark slate strip)
 *   2. Floating Capsule Header (ClientHeader)
 *   3. <main> renders <Outlet /> — page-specific content
 *   4. Premium Dark Slate Footer (ClientFooter)
 *
 *  - No page-specific banners, no hero, no hardcoded headings
 *  - 100% English copy
 *  - Be Vietnam Pro typography
 *  - mt-auto footer → never causes page overflow
 */

import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { Header } from './ClientHeader';
import { ClientFooter } from './ClientFooter';

/* =========================================================
 * Free Level Test Banner (TASK DEV1 - T3)
 * ========================================================= */
const FreeLevelTestBanner: React.FC = () => {
  const { role, user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  if (role !== 'USER' || user?.currentLevel || dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-xs sm:text-sm py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
          <span className="truncate">
            Bạn chưa biết trình độ của mình?
          </span>
          <Link
            to={CLIENT_ROUTES.practice}
            className="inline-flex items-center gap-1 font-bold underline hover:text-blue-100 transition-colors shrink-0 ml-1"
          >
            Làm test miễn phí <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
 * Discreet Top Bar — compact role switcher strip
 * ========================================================= */
const TopBar: React.FC = () => {
  const { role, user } = useAuthStore();
  if (!user) return null;
  return (
    <div
      className="w-full bg-slate-900 text-[11px] text-slate-400 py-1 px-4"
      role="region"
      aria-label="Workspace role switcher"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span className="font-semibold tracking-wider uppercase">
          Workspace View Mode
        </span>
        <span className="px-2.5 h-5 rounded-full bg-white/10 text-slate-200 text-[10px] font-semibold">
          {user.fullName} · {role}
        </span>
      </div>
    </div>
  );
};

/* =========================================================
 * AppLayout — root shared layout (aliased for legacy imports)
 * ========================================================= */
export const AppLayout: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col"
      style={{ fontFamily: "'Poppins', 'Be Vietnam Pro', sans-serif" }}
    >
      <TopBar />
      <FreeLevelTestBanner />
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <Header />
      </div>
      <main className="flex-1 w-full flex flex-col min-h-0">
        <Outlet />
      </main>
      <ClientFooter />
    </div>
  );
};

export const ClientLayout = AppLayout;
export default AppLayout;
