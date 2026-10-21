/**
 * LoginPage — Trang đăng nhập
 * -----------------------------------------------------------
 * - Nếu chưa đăng nhập: hiển thị LoginForm.
 * - Nếu đã có phiên đăng nhập hợp lệ: tự động điều hướng về portal tương ứng.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/portals/client/features/auth/components/LoginForm';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';

const redirectAfterLogin = (role: UserRole): string => {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/admin/mentors';
  if (role === 'STUDENT') return '/courses';
  return '/courses';
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirectAfterLogin(role), { replace: true });
    }
  }, [isAuthenticated, user, role, navigate]);

  return <LoginForm />;
};

export default LoginPage;
