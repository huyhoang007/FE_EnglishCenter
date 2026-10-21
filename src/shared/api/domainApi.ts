import axiosClient, { type BeResponse } from './axiosClient';
import type { ApiResponse } from '@/shared/types';
import type { AuthDto, ChangePasswordDto, CreateMentorDto, CreateMentorResponseDto, MentorDto, PageResponse, ProfileUpdateDto, RoleDto, UpdateMentorDto, UserDto } from './apiTypes';
import { toUser } from './apiTypes';

function ok<T>(data: T, message = 'Success'): ApiResponse<T> { return { success: true, message, data }; }

export async function loginRequest(email: string, password: string) {
  const { data } = await axiosClient.post<BeResponse<AuthDto>>('/api/v1/auth/login', { email, password });
  if (!data.result) throw new Error(data.message || 'Đăng nhập thất bại');
  return ok({ ...data.result, user: toUser(data.result.user) }, data.message);
}

export async function registerRequest(payload: { email: string; password: string; fullName: string; phone?: string }) {
  const { data } = await axiosClient.post<BeResponse<UserDto>>('/api/v1/auth/register', payload);
  if (!data.result) throw new Error(data.message || 'Đăng ký thất bại');
  return ok(toUser(data.result), data.message);
}

export async function refreshRequest(refreshToken: string) {
  const { data } = await axiosClient.post<BeResponse<AuthDto>>('/api/v1/auth/refresh', { refreshToken });
  if (!data.result) throw new Error(data.message || 'Refresh thất bại');
  return ok(data.result, data.message);
}

export const logoutRequest = () => axiosClient.post('/api/v1/auth/logout');
export const changePasswordRequest = (payload: ChangePasswordDto) => axiosClient.post('/api/v1/auth/change-password', payload);

export async function getProfile() {
  const { data } = await axiosClient.get<BeResponse<UserDto>>('/api/v1/account/me');
  if (!data.result) throw new Error(data.message || 'Không lấy được hồ sơ');
  return toUser(data.result);
}
export async function updateProfile(payload: ProfileUpdateDto) {
  const { data } = await axiosClient.put<BeResponse<UserDto>>('/api/v1/account/me', payload);
  if (!data.result) throw new Error(data.message || 'Cập nhật hồ sơ thất bại');
  return toUser(data.result);
}

export async function getUsers(params: { keyword?: string; roleName?: string; isActive?: boolean; page?: number; size?: number }) {
  const { data } = await axiosClient.get<PageResponse<UserDto>>('/api/v1/admin/users', { params });
  return { ...data, data: data.data.map(toUser) };
}
export const getUser = async (id: string) => (await axiosClient.get<BeResponse<UserDto>>(`/api/v1/admin/users/${id}`)).data.result;
export const updateUserStatus = (id: string, isActive: boolean) => axiosClient.put(`/api/v1/admin/users/${id}/status`, { isActive });
export const assignRole = (id: string, roleName: string) => axiosClient.post(`/api/v1/admin/users/${id}/roles`, { roleName });
export const getRoles = async () => (await axiosClient.get<BeResponse<RoleDto[]>>('/api/v1/admin/roles')).data.result ?? [];
export const createMentor = async (payload: CreateMentorDto) => (await axiosClient.post<BeResponse<CreateMentorResponseDto>>('/api/v1/admin/mentors', payload)).data.result;
export const updateMentor = async (id: string, payload: UpdateMentorDto) => (await axiosClient.put<BeResponse<MentorDto>>(`/api/v1/admin/mentors/${id}`, payload)).data.result;
export const revokeMentor = (id: string) => axiosClient.delete(`/api/v1/admin/mentors/${id}`);

export async function getMentors(params: { specialization?: string; minRate?: number; maxRate?: number; page?: number; size?: number }) {
  const { data } = await axiosClient.get<PageResponse<MentorDto>>('/api/v1/mentors', { params });
  return data;
}
export const getMentor = async (id: string) => (await axiosClient.get<BeResponse<MentorDto>>(`/api/v1/mentors/${id}`)).data.result;
