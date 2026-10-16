/**
 * AdminRoutes — mount tại /admin/*
 */

import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/portals/admin/layouts/AdminLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminDashboardView } from '@/portals/admin/features/course';
import { AccountManagementView } from '@/portals/admin/features/account';
import { CourseManagementView } from '@/portals/admin/features/course';

const LoadingFallback: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
    Loading admin workspace…
  </div>
);

const AdminRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardView />} />
            <Route path="accounts" element={<AccountManagementView />} />
            <Route path="courses" element={<CourseManagementView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ProtectedRoute>
  );
};

export default AdminRoutes;
