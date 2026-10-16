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

import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/shared/utils';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';
import { Header } from './ClientHeader';
import { ClientFooter } from './ClientFooter';

/* =========================================================
 * Discreet Top Bar — compact role switcher strip
 * ========================================================= */
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'ADMIN', label: 'Admin' },
];

const TopBar: React.FC = () => {
  const { role, setRole } = useAuthStore();
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
        <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-slate-800/70 border border-slate-700/70">
          {ROLE_OPTIONS.map((opt) => {
            const active = role === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRole(opt.value)}
                className={cn(
                  'px-2.5 h-5 rounded-full text-[10px] font-semibold transition-colors',
                  active
                    ? 'bg-white text-[#0052CC]'
                    : 'text-slate-300 hover:text-white',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
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
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      <TopBar />
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
