/**
 * Auth Store (Zustand)
 * -----------------------------------------------------------
 * Quản lý trạng thái xác thực toàn cục:
 *   - user, accessToken, refreshToken
 *   - isAuthenticated
 *   - role (mock — dùng cho Role Switcher trên cùng để demo phân quyền)
 *   - userName (mock — hiển thị khi GUEST hoặc khi chưa có user thật)
 *   - login() / register() / logout()
 *   - mockLogin(role) — đăng nhập nhanh theo vai trò (phục vụ demo)
 *   - setRole(role) — chuyển đổi góc nhìn vai trò tức thì (Role Switcher)
 *
 * Trạng thái được lưu vào localStorage để giữ phiên khi reload.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getMyProfileApi,
  loginApi,
  logoutApi,
  mockStudentDemoApi,
  registerApi,
} from '@/shared/auth/authService';
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '@/shared/types';

/* ----------------- Mock user theo role (dùng cho Role Switcher demo) ----------------- */
export const ROLE_MOCK_PROFILE: Record<
  UserRole,
  { fullName: string; email: string; avatarColor: string }
> = {
  GUEST: { fullName: 'Khách vãng lai', email: 'guest@prepmaster.ai', avatarColor: '#94A3B8' },
  STUDENT: { fullName: 'Nguyễn Văn A', email: 'student@prepmaster.ai', avatarColor: '#2563EB' },
  MENTOR: { fullName: 'Mentor David', email: 'mentor@prepmaster.ai', avatarColor: '#7C3AED' },
  ADMIN: { fullName: 'Admin Master', email: 'admin@prepmaster.ai', avatarColor: '#0F172A' },
};

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** Role hiện tại đang xem (mock) — dùng cho Role Switcher */
  role: UserRole;
  /** Tên hiển thị nhanh (mock) — dùng cho Sidebar footer */
  userName: string;

  /** Actions */
  login: (payload: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Mock nhanh theo role — dùng cho demo/chấm điểm */
  mockLogin: (role: UserRole) => Promise<AuthUser>;
  /** Lấy lại thông tin user mới nhất từ BE */
  fetchMyProfile: () => Promise<AuthUser | null>;
  /** Đổi góc nhìn vai trò tức thì (Role Switcher bar trên cùng) */
  setRole: (role: UserRole) => void;
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
  userName: ROLE_MOCK_PROFILE.GUEST.fullName,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      clearError: () => set({ error: null }),

      reset: () => set({ ...initialState }),

      setRole: (role) => {
        const profile = ROLE_MOCK_PROFILE[role];
        set({
          role,
          userName: profile.fullName,
        });
      },

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
            err instanceof Error ? err.message : 'Đăng nhập thất bại';
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
            err instanceof Error ? err.message : 'Đăng ký thất khoản';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      mockLogin: async (role) => {
        set({ isLoading: true, error: null });
        try {
          // Chỉ hỗ trợ STUDENT mock. Mentor/Admin phải login thật qua BE.
          if (role !== 'STUDENT') {
            const msg = `Demo nhanh chỉ hỗ trợ vai trò STUDENT. Vui lòng đăng nhập ${role} qua Backend.`;
            set({ isLoading: false, error: msg });
            throw new Error(msg);
          }
          const res = await mockStudentDemoApi();
          if (!res.success) {
            set({ isLoading: false, error: res.message });
            throw new Error(res.message);
          }
          const { user, accessToken, refreshToken } = res.data;
          const profile = ROLE_MOCK_PROFILE[role];
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            role,
            userName: user.fullName || profile.fullName,
            isLoading: false,
            error: null,
          });
          return user;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Đăng nhập nhanh thất bại';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      /** Lấy lại thông tin user mới nhất từ BE (sau khi token có thể đã refresh) */
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
          /* ignore — vẫn logout phía client */
        }
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

/* ------------ Selectors tiện ích (dùng ngoài component) ------------ */
export const selectUser = (s: AuthState) => s.user;
export const selectRole = (s: AuthState): UserRole => s.role;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectUserName = (s: AuthState) => s.userName;
