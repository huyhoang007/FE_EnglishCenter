/**
 * Auth Store (Zustand)
 * -----------------------------------------------------------
 * Quản lý trạng thái xác thực toàn cục (dữ liệu thật từ Backend):
 *   - user, accessToken, refreshToken
 *   - isAuthenticated
 *   - role (từ User entity do Backend trả về: ADMIN, MENTOR, STUDENT, USER, GUEST)
 *   - login() / register() / logout()
 *   - fetchMyProfile()
 *
 * Trạng thái được lưu vào localStorage để giữ phiên khi reload trang.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getMyProfileApi,
  loginApi,
  logoutApi,
  registerApi,
} from '@/shared/auth/authService';
import type {
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
  register: (payload: RegisterRequest) => Promise<AuthUser>;
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
          if (!res.success) {
            set({ isLoading: false, error: res.message });
            throw new Error(res.message);
          }
          const { user, accessToken, refreshToken } = res.data;
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            role: user.role,
            userName: user.fullName,
            isLoading: false,
            error: null,
          });
          return user;
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
          const { user, accessToken, refreshToken } = res.data;
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            role: user.role,
            userName: user.fullName,
            isLoading: false,
            error: null,
          });
          return user;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.';
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
