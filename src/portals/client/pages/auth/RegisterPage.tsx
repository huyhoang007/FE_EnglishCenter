/**
 * RegisterPage — Trang đăng ký học viên
 * -----------------------------------------------------------
 * Bao bọc RegisterForm trong layout responsive.
 * Đăng ký thành công → Student role → chuyển đến /my-learning.
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, GraduationCap } from 'lucide-react';
import { RegisterForm, useAuthStore } from '@/portals/client/features/auth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col">
      {/* Top bar */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Về trang chủ
        </Link>
        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
          <GraduationCap className="w-4 h-4 text-brand-600" />
          <span className="hidden sm:inline">Đã có tài khoản?</span>
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* Form area */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 flex items-start sm:items-center justify-center">
        <div className="w-full">
          <RegisterForm onSuccessRedirect={() => '/my-learning'} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 px-6 text-center text-xs text-slate-400 border-t border-slate-200/70 bg-white/40">
        © 2026 English Center Platform. Hệ thống đào tạo & Khảo thí chuẩn hoá.
      </footer>
    </div>
  );
};

export default RegisterPage;
