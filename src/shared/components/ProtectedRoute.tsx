/**
 * ProtectedRoute — Gate phân quyền
 * -----------------------------------------------------------
 * Bọc một route/component và kiểm tra:
 *   1. Nếu chưa đăng nhập → redirect tới /login
 *   2. Nếu role không thuộc allowedRoles → redirect về "/" (hoặc fallback)
 *   3. Nếu OK → render children
 *
 * Bạn có thể truyền `fallbackPath` để tuỳ biến đích redirect.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  /** Đường dẫn redirect khi chưa đăng nhập. Mặc định: /login */
  loginPath?: string;
  /** Đường dẫn redirect khi role không đủ quyền. Mặc định: "/" */
  fallbackPath?: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  loginPath = '/login',
  fallbackPath = '/',
  children,
}) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
