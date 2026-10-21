/**
 * Roles — định nghĩa vai trò người dùng
 * -----------------------------------------------------------
 * Canonical source-of-truth cho Role Switcher, ProtectedRoute
 * và tất cả các guard phân quyền trong 3 portal.
 */

import type { UserRole } from '@/shared/types';

export const ROLES = {
  GUEST: 'GUEST',
  USER: 'USER',
  STUDENT: 'STUDENT',
  MENTOR: 'MENTOR',
  ADMIN: 'ADMIN',
} as const satisfies Record<UserRole, UserRole>;

export const ROLE_LABEL: Record<UserRole, string> = {
  GUEST: 'Guest',
  USER: 'User',
  STUDENT: 'Student',
  MENTOR: 'Mentor',
  ADMIN: 'Admin',
};

export const ROLE_ACCENT: Record<UserRole, string> = {
  GUEST: 'slate',
  USER: 'amber',
  STUDENT: 'sky',
  MENTOR: 'violet',
  ADMIN: 'slate',
};
