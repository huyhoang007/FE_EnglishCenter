/**
 * LoginPage — Trang đăng nhập (full-bleed 2-column, không dùng AppLayout)
 * -----------------------------------------------------------
 * Nghiệp vụ:
 *   - Nếu chưa đăng nhập: hiển thị LoginForm bình thường.
 *   - Nếu đã đăng nhập:
 *       + Mặc định (vào /login): KHÔNG redirect, hiển thị banner "Đang đăng nhập
 *         với role X" + nút "Đăng nhập tài khoản khác" / "Vào trang của tôi"
 *         để giảng viên dễ demo.
 *       + Có query `?reauth=1` (URL: /login?reauth=1): redirect sang trang
 *         tương ứng với role hiện tại, dùng cho flow chuyển account.
 */

import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LogIn, UserCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { LoginForm, useAuthStore, type UserRole } from '@/portals/client/features/auth';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';

const redirectAfterLogin = (role: UserRole): string => {
  if (role === 'STUDENT') return '/courses/ielts-intensive-mastery';
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/schedule';
  return '/';
};

const ROLE_LABEL: Record<UserRole, string> = {
  GUEST: 'Khách',
  STUDENT: 'Học viên',
  MENTOR: 'Mentor',
  ADMIN: 'Quản trị viên',
};

const ROLE_BADGE: Record<UserRole, 'primary' | 'ai' | 'warning' | 'neutral'> = {
  GUEST: 'neutral',
  STUDENT: 'primary',
  MENTOR: 'ai',
  ADMIN: 'warning',
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthenticated, user, role, logout, userName } = useAuthStore();

  // ?reauth=1 → buộc redirect theo role (dùng cho "Chuyển tài khoản")
  React.useEffect(() => {
    if (params.get('reauth') === '1' && isAuthenticated) {
      navigate(redirectAfterLogin(role), { replace: true });
    }
  }, [params, isAuthenticated, role, navigate]);

  // Đã đăng nhập + không có ?reauth=1 → hiển thị trang chọn (KHÔNG redirect)
  if (isAuthenticated && user && params.get('reauth') !== '1') {
    const target = redirectAfterLogin(role);
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-card border border-slate-200 shadow-elevation p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-ai-gradient flex items-center justify-center mx-auto shadow-ai-glow">
            <UserCircle2 className="w-8 h-8 text-white" />
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Phiên đang hoạt động
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">
              Xin chào, {userName}!
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <Badge variant={ROLE_BADGE[role]} size="md">
                {role}
              </Badge>
              <span className="text-xs text-slate-500">
                · {ROLE_LABEL[role]}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn đang đăng nhập với tài khoản <b>{user.email}</b>. Có thể tiếp tục
            vào trang của bạn hoặc chuyển sang tài khoản khác để demo.
          </p>

          <div className="space-y-2.5 pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={ArrowRight}
              onClick={() => navigate(target, { replace: true })}
            >
              Vào trang của tôi
            </Button>
            <Button
              variant="outline"
              size="md"
              fullWidth
              leftIcon={RotateCcw}
              onClick={async () => {
                await logout();
                navigate('/login?reauth=1', { replace: true });
                // Reload để chắc chắn state sạch
                window.location.reload();
              }}
            >
              Đăng nhập tài khoản khác
            </Button>
          </div>

          <Link
            to="/login?reauth=1"
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600"
            onClick={async (e) => {
              e.preventDefault();
              await logout();
              navigate('/login?reauth=1', { replace: true });
              window.location.reload();
            }}
          >
            <LogIn className="w-3 h-3" />
            Bỏ qua và đăng nhập lại từ đầu
          </Link>
        </div>
      </div>
    );
  }

  return <LoginForm />;
};

export default LoginPage;
