/**
 * Auth feature barrel
 * -----------------------------------------------------------
 * Re-exports both feature-local components and the shared
 * useAuthStore so legacy `@/features/auth` consumers continue
 * to work after the enterprise refactor.
 */

export { default as LoginForm } from './components/LoginForm';
export { default as RegisterForm } from './components/RegisterForm';
export { useAuth, useRole, useIsAuthenticated } from './hooks/useAuth';
// Re-export from shared so page-level imports can keep using a single path
export { useAuthStore } from '@/shared/auth/useAuthStore';
