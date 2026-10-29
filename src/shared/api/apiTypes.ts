import type { AuthUser, UserRole } from '@/shared/types';
import type { PageResponse } from './axiosClient';

export type { PageResponse };

export interface UserDto {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  /** Hồ sơ người học (USER / STUDENT) */
  targetCertificateId?: string | null;
  targetScore?: number | null;
  currentLevel?: string | null;
  currentScore?: number | null;
}

export interface AuthDto {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
  user: UserDto;
}

export interface CreateMentorResponseDto { mentor: MentorDto; tempPassword: string; note?: string; }

export interface MentorDto extends UserDto {
  specialization: string;
  department: string;
  avatarUrl?: string;
  biography?: string;
  hourlyRate: number;
  ratingAverage?: number;
  mentorRegisteredAt?: string;
  lastUpdated?: string;
}

export interface RoleDto { roleName?: string; name?: string; }
export interface ProfileUpdateDto {
  fullName?: string;
  phone?: string;
  targetCertificateId?: string;
  targetScore?: number;
}
export interface ChangePasswordDto { currentPassword: string; newPassword: string; }
export interface CreateMentorDto {
  email: string; fullName: string; phone?: string; specialization: string;
  department: string; avatarUrl?: string; biography?: string; hourlyRate: number;
}
export type UpdateMentorDto = Omit<CreateMentorDto, 'email'>;

export function toUser(dto: UserDto): AuthUser {
  const role = String(dto.role ?? 'USER').toUpperCase() as UserRole;
  return {
    id: String(dto.userId), email: dto.email, fullName: dto.fullName,
    phone: dto.phone, role: ['USER', 'STUDENT', 'MENTOR', 'ADMIN'].includes(role) ? role : 'USER',
    isActive: dto.isActive, createdAt: dto.createdAt,
    targetCertificateId: dto.targetCertificateId ?? null, targetScore: dto.targetScore ?? null,
    currentLevel: dto.currentLevel ?? null, currentScore: dto.currentScore ?? null,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dto.email)}`,
  };
}
