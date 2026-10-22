/**
 * AccountManagementView — User Lifecycle & RBAC Management
 * Converted to match the modern executive UI theme
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import {
  Search,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  X,
  AlertCircle,
  RotateCcw,
  User,
  Users,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  getRoles,
  getUser,
  getUsers,
  updateUserStatus,
} from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { AuthUser } from '@/shared/types';

export const AccountManagementView: React.FC = () => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [roleName, setRoleName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  // Selected user for detail modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Queries
  const usersQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, keyword, roleName, page],
    queryFn: () =>
      getUsers({
        keyword: keyword || undefined,
        roleName: roleName || undefined,
        page,
        size: 15,
      }),
  });

  const rolesQuery = useQuery({
    queryKey: QUERY_KEYS.admin.roles,
    queryFn: getRoles,
  });

  const userDetailQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'detail', selectedUserId],
    queryFn: () => getUser(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.accounts });
    },
  });

  const renderRoleBadge = (role?: string) => {
    const normalized = (role || '').toUpperCase();
    switch (normalized) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            ADMIN
          </span>
        );
      case 'MENTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
            MENTOR
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            STUDENT
          </span>
        );
      case 'USER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
            USER
          </span>
        );
    }
  };

  const rawUsers: AuthUser[] = usersQuery.data?.data ?? [];
  const rolesList = rolesQuery.data ?? [];
  const selectedUser = userDetailQuery.data;

  // Dynamic KPI Stats from backend
  const totalAccountsCount = usersQuery.data?.totalElements ?? rawUsers.length;
  const activeAccountsCount = rawUsers.filter((u) => u.isActive !== false).length;
  const inactiveAccountsCount = rawUsers.filter((u) => u.isActive === false).length;
  const mentorsCount = rawUsers.filter((u) => (u.role || '').toUpperCase() === 'MENTOR').length;
  const rolesCount = rolesList.length || 4;

  // Filter client-side by status if selected
  const usersList = rawUsers.filter((u) => {
    if (!statusFilter) return true;
    return statusFilter === 'Active' ? u.isActive !== false : u.isActive === false;
  });

  const handleResetFilters = () => {
    setKeyword('');
    setRoleName('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. STATS ROW (Dynamic from backend) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Accounts"
          value={totalAccountsCount}
          subtext={`${totalAccountsCount} tài khoản`}
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Active Accounts"
          value={activeAccountsCount}
          subtext={`${totalAccountsCount > 0 ? Math.round((activeAccountsCount / totalAccountsCount) * 100) : 0}% hoạt động`}
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Inactive Accounts"
          value={inactiveAccountsCount}
          subtext={`${inactiveAccountsCount} bị khóa / tạm dừng`}
          icon={UserX}
          colorScheme="amber"
        />
        <StatCard
          title="Faculty Mentors"
          value={mentorsCount}
          subtext="Giảng viên đã cấp quyền"
          icon={ShieldCheck}
          colorScheme="purple"
        />
        <StatCard
          title="RBAC Roles"
          value={rolesCount}
          subtext="Vai trò hệ thống cố định"
          icon={Layers}
          colorScheme="cyan"
        />
      </div>

      {/* ================= 2. TITLE BAR ================= */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Account Management
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Quản lý tài khoản toàn hệ thống và kiểm soát trạng thái hoạt động. Vai trò (Role) được bảo vệ cố định theo chính sách phân quyền RBAC.
        </p>
      </div>

      {/* ================= 3. FILTER BAR ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm kiếm tài khoản theo tên hoặc email…"
              className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleName}
            onChange={(e) => {
              setRoleName(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">Tất cả vai trò (Role)</option>
            {rolesList.map((r) => {
              const val = r.roleName ?? r.name ?? '';
              return (
                <option key={val} value={val}>
                  {val}
                </option>
              );
            })}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Reset */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* ================= 4. ACCOUNTS TABLE ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {usersQuery.isLoading && (
          <p className="py-14 text-center text-slate-400 text-xs">Đang tải danh sách tài khoản…</p>
        )}
        {usersQuery.isError && (
          <p className="py-14 text-center text-rose-600 text-xs">
            Không thể tải danh sách tài khoản. Vui lòng thử lại.
          </p>
        )}
        {!usersQuery.isLoading && !usersQuery.isError && usersList.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Không tìm thấy tài khoản nào phù hợp.</p>
          </div>
        )}

        {!usersQuery.isLoading && !usersQuery.isError && usersList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                  </th>
                  <th className="py-3.5 px-3 font-bold">Người dùng</th>
                  <th className="py-3.5 px-3 font-bold">Email</th>
                  <th className="py-3.5 px-3 font-bold">Số điện thoại</th>
                  <th className="py-3.5 px-3 font-bold">Vai trò (Role)</th>
                  <th className="py-3.5 px-3 font-bold">Trạng thái</th>
                  <th className="py-3.5 pr-4 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052CC] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                          {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[170px]">
                          {u.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[180px]">
                      {u.email}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.phone || '—'}</td>
                    <td className="py-3 px-3">{renderRoleBadge(u.role)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`}
                      >
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                          title="Xem chi tiết tài khoản"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({ id: u.id, isActive: !u.isActive })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại tài khoản'}
                        >
                          {u.isActive ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= 5. PAGINATION ================= */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{usersList.length}</span> of{' '}
            <span className="font-bold text-slate-700">1,340</span> accounts
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-lg bg-[#0052CC] text-white font-bold flex items-center justify-center shadow-xs"
            >
              1
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 font-semibold flex items-center justify-center hover:bg-slate-50"
            >
              2
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 font-semibold flex items-center justify-center hover:bg-slate-50"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: USER DETAILS ================= */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết tài khoản</h3>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userDetailQuery.isLoading && (
              <p className="py-8 text-center text-slate-500 text-xs">Đang tải thông tin…</p>
            )}

            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center text-lg font-bold shadow-sm">
                    {selectedUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {selectedUser.fullName}
                    </h4>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                    <div className="mt-1">{renderRoleBadge(selectedUser.role)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Số điện thoại
                    </span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedUser.phone || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      Trạng thái
                    </span>
                    <p className="mt-0.5">
                      <Badge variant={selectedUser.isActive ? 'success' : 'warning'} size="sm">
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    User ID hệ thống
                  </span>
                  <p className="font-mono text-slate-600 text-[11px] mt-0.5 select-all">
                    {selectedUser.userId}
                  </p>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setSelectedUserId(null)}
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagementView;
