/**
 * AppRouter — top-level route composition
 * -----------------------------------------------------------
 * - Client portal mounted at /*
 * - Mentor portal mounted at /mentor/*
 * - Admin portal mounted at /admin/*
 * - Each portal is a Suspense-wrapped React.lazy() for code splitting.
 */

import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const ClientRoutes = lazy(() => import('@/portals/client/routes'));
const MentorRoutes = lazy(() => import('@/portals/mentor/routes'));
const AdminRoutes = lazy(() => import('@/portals/admin/routes'));

const LoadingShell: React.FC = () => (
  <div
    className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm"
    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
  >
    <div className="flex items-center gap-3">
      <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-[#0052CC] rounded-full animate-spin" />
      <span>Loading workspace…</span>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingShell />}>
      <Routes>
        {/* Mentor portal */}
        <Route path="/mentor/*" element={<MentorRoutes />} />

        {/* Admin portal */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Client portal (default — must be last so it catches /*) */}
        <Route path="/*" element={<ClientRoutes />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
