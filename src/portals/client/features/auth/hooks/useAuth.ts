/**
 * useAuth — selectors gọn cho useAuthStore
 */

import { useAuthStore } from '@/shared/auth/useAuthStore';
import type { UserRole } from '@/shared/types';

export function useAuth() {
  return useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    isLoading: s.isLoading,
    error: s.error,
    role: s.role,
    userName: s.userName,
    login: s.login,
    register: s.register,
    logout: s.logout,
    clearError: s.clearError,
    reset: s.reset,
  }));
}

export function useRole(): UserRole {
  return useAuthStore((s) => s.role);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.isAuthenticated);
}
