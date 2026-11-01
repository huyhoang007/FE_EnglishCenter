/**
 * Auth Store (Zustand)
 * -----------------------------------------------------------
 * Quản lý trạng thái xác thực toàn cục (dữ liệu thật từ Backend):
 *   - user, accessToken, refreshToken
 *   - isAuthenticated
 *   - role (từ User entity do Backend trả về: ADMIN, MENTOR, STUDENT, USER, GUEST)
 *   - login() / register() / activate() / logout()
 *   - fetchMyProfile()
 *
 * Lưu ý luồng mới: đăng ký KHÔNG auto-login — register() tạo tài khoản (kèm mật khẩu
 * người dùng chọn) + gửi email kích hoạt; activate() (trang /activate) mới set phiên đăng nhập.
 *
 * Trạng thái được lưu vào localStorage để giữ phiên khi reload trang.
 */

import { create } from 'zustand';
import { queryClient } from '@/shared/api/queryClient';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  activateApi,
  getMyProfileApi,
  loginApi,
  logoutApi,
  registerApi,
} from '@/shared/auth/authService';
import type {
  AuthData,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '@/shared/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** Role của người dùng hiện tại do Backend xác thực */
  role: UserRole;
  /** Tên đầy đủ của người dùng */
  userName: string;

  /** Actions */
  login: (payload: LoginRequest) => Promise<AuthUser>;
  /** Đăng ký (kèm mật khẩu): tạo tài khoản chưa kích hoạt + gửi email kích hoạt, không set phiên. */
  register: (payload: RegisterRequest) => Promise<void>;
  /** Bấm link email → xác minh + kích hoạt + tự đăng nhập (set phiên như login). */
  activate: (token: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Lấy lại thông tin user mới nhất từ BE */
  fetchMyProfile: () => Promise<AuthUser | null>;
  clearError: () => void;
  /** Reset state khi cần */
  reset: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: 'GUEST' as UserRole,
  userName: '',
};

/** Apply a JWT session (from login or activate) into the store. */
function sessionState(data: AuthData) {
  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    isAuthenticated: true,
    role: data.user.role,
    userName: data.user.fullName,
    isLoading: false,
    error: null,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      clearError: () => set({ error: null }),

      reset: () => set({ ...initialState }),

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await loginApi(payload);
          if (!res.success || !res.data) {
            set({ isLoading: false, error: res.message });
            throw new Error(res.message);
          }
          set(sessionState(res.data));
          return res.data.user;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await registerApi(payload);
          if (!res.success) {
            set({ isLoading: false, error: res.message });
            throw new Error(res.message);
          }
          set({ isLoading: false, error: null });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      activate: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const res = await activateApi(token);
          if (!res.success || !res.data) {
            set({ isLoading: false, error: res.message });
            throw new Error(res.message);
          }
          set(sessionState(res.data));
          return res.data.user;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Kích hoạt tài khoản thất bại. Vui lòng thử lại.';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      /** Lấy lại thông tin user mới nhất từ BE */
      fetchMyProfile: async () => {
        const accessToken = _get().accessToken;
        if (!accessToken) return null;
        const res = await getMyProfileApi(accessToken);
        if (!res.success || !res.data) return null;
        set({
          user: res.data,
          role: res.data.role,
          userName: res.data.fullName,
        });
        return res.data;
      },

      logout: async () => {
        try {
          await logoutApi();
        } catch {
          /* ignore — vẫn clear state phía client */
        }
        localStorage.removeItem('prepmaster-ai-auth');
        set({ ...initialState });
      },
    }),
    {
      name: 'prepmaster-ai-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        userName: state.userName,
      }),
    },
  ),
);

/* ------------ Selectors tiện ích ------------ */
export const selectUser = (s: AuthState) => s.user;
export const selectRole = (s: AuthState): UserRole => s.role;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectUserName = (s: AuthState) => s.userName;

// Discard user-dependent course data when signing in, out, or switching accounts.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id || state.isAuthenticated !== previous.isAuthenticated) {
    void queryClient.cancelQueries();
    queryClient.clear();
    localStorage.removeItem('prepmaster-ai-enrollments');
  } else if (state.role !== previous.role) {
    void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
  }
});
