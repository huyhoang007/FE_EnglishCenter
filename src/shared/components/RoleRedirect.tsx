/**
 * RoleRedirect — chặn một số role khỏi route công khai
 * -----------------------------------------------------------
 * Khác ProtectedRoute: KHÔNG bắt đăng nhập (khách vẫn xem được).
 * Chỉ khi đã đăng nhập và role nằm trong deniedRoles thì chuyển hướng về `to`.
 * Vd: mentor không vào ngân hàng đề / luyện đề / đặt lịch của học viên.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';

export interface RoleRedirectProps {
  /** Các role không được vào route này */
  deniedRoles: UserRole[];
  /** Đích chuyển hướng khi bị chặn */
  to: string;
  children: React.ReactNode;
}

export const RoleRedirect: React.FC<RoleRedirectProps> = ({ deniedRoles, to, children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  if (isAuthenticated && deniedRoles.includes(role)) {
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
};

export default RoleRedirect;
