/**
 * StudentManagementView — English Center Student Directory & Academic Tracking
 * Converted to match the reference UI (6.webp)
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { useToast } from '@/shared/components/Toast';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Award,
  Search,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  X,
  AlertTriangle,
} from 'lucide-react';
import { getUsers, updateUserStatus } from '@/shared/api/domainApi';
import type { AuthUser } from '@/shared/types';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export const StudentManagementView: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentToToggleStatus, setStudentToToggleStatus] = useState<{
    id: string;
    fullName: string;
    isActive: boolean;
  } | null>(null);

  // Status mutation (Vô hiệu hóa / Khóa hoặc Kích hoạt tài khoản học viên)
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isActive
          ? 'Đã kích hoạt lại tài khoản học viên!'
          : 'Đã vô hiệu hóa (khóa) tài khoản học viên!'
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.accounts });
      setStudentToToggleStatus(null);
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái học viên. Vui lòng thử lại.');
    },
  });

  // Query Backend Students (roleName: 'STUDENT') — keyword / isActive lọc server-side
  const { data: usersData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'STUDENT', page, keyword, statusFilter],
    queryFn: () =>
      getUsers({
        roleName: 'STUDENT',
        keyword: keyword || undefined,
        isActive: statusFilter === '' ? undefined : statusFilter === 'Active',
        page,
        size: 20,
      }),
  });

  // Combine backend users with rich presentation data
  const backendStudents: AuthUser[] = usersData?.data ?? [];

  // Dynamic KPI Stats from backend data
  const totalStudentsCount = usersData?.totalElements ?? backendStudents.length;
  const activeStudentsCount = backendStudents.filter((s) => s.isActive !== false).length;
  const inactiveStudentsCount = backendStudents.filter((s) => s.isActive === false).length;
  const newStudentsCount = backendStudents.filter((s) => {
    if (!s.createdAt) return true;
    const diffDays = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30;
  }).length;
  // Học viên đã có trình độ (current_level trong student_profiles)
  const leveledStudentsCount = backendStudents.filter((s) => !!s.currentLevel).length;

  // Phân trang server-side: /admin/users đã trả totalPages
  const totalPages = usersData?.totalPages ?? 1;
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    // Cửa sổ 5 trang quanh trang hiện tại, luôn nằm trong [0, totalPages - 1]
    const half = 2;
    let start = Math.max(0, Math.min(page - half, totalPages - 5));
    if (totalPages < 5) start = 0;
    return start + i;
  }).filter((p) => p < totalPages);

  const combinedStudents = React.useMemo(() => {
    return backendStudents.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || 'Chưa cập nhật',
      studentCode: `STD-${u.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      status: u.isActive ? 'Active' : 'Inactive',
      enrolledDate: u.createdAt
        ? new Date(u.createdAt).toLocaleDateString('vi-VN')
        : 'Mới đăng ký',
      currentLevel: u.currentLevel || '—',
      currentScore: u.currentScore != null ? `${u.currentScore}` : '—',
    }));
  }, [backendStudents]);

  // Filter đã xử lý server-side (keyword / isActive truyền lên /admin/users)
  const filteredStudents = combinedStudents;

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('');
    setPage(0);
  };

  // Học viên KHÔNG được tạo thủ công bởi admin: role STUDENT chỉ được gán tự động
  // khi user (đã kích hoạt qua email) mua khóa học — xem EnrollmentService/upgrade flow.

  return (
    <div className="space-y-6">
      {/* ================= 1. STATS ROW (Dynamic from backend) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Students"
          value={totalStudentsCount}
          subtext={`${totalStudentsCount} học viên`}
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Active Students"
          value={activeStudentsCount}
          subtext={`${totalStudentsCount > 0 ? Math.round((activeStudentsCount / totalStudentsCount) * 100) : 0}% hoạt động`}
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Inactive Students"
          value={inactiveStudentsCount}
          subtext={`${inactiveStudentsCount} tạm nghỉ`}
          icon={UserX}
          colorScheme="amber"
        />
        <StatCard
          title="New Admissions"
          value={newStudentsCount}
          subtext="Mới trong 30 ngày"
          icon={GraduationCap}
          colorScheme="purple"
        />
        <StatCard
          title="Leveled Students"
          value={leveledStudentsCount}
          subtext="Đã có kết quả test trình độ"
          icon={Award}
          colorScheme="cyan"
        />
      </div>

      {/* ================= 2. TITLE BAR & ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Students</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage and view all enrolled learners across IELTS, TOEIC, and VSTEP programs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={Download}
            onClick={() => alert('Xuất báo cáo danh sách học viên định dạng Excel.')}
            className="font-bold border-slate-200"
          >
            Export Data
          </Button>
        </div>
      </div>

      {/* ================= 3. FILTER BAR (Matching 6.webp) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="Search students by name, email, phone..."
              className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Status</option>
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

      {/* ================= 4. TABLE SECTION (Matching 6.webp) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <p className="py-14 text-center text-slate-400 text-xs">Loading students directory...</p>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No students found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                  </th>
                  <th className="py-3.5 px-2 w-12 font-bold">#</th>
                  <th className="py-3.5 px-3 font-bold">Student</th>
                  <th className="py-3.5 px-3 font-bold">Student ID</th>
                  <th className="py-3.5 px-3 font-bold">Level</th>
                  <th className="py-3.5 px-3 font-bold">Current Score</th>
                  <th className="py-3.5 px-3 font-bold">Email</th>
                  <th className="py-3.5 px-3 font-bold">Status</th>
                  <th className="py-3.5 px-3 font-bold">Registered Date</th>
                  <th className="py-3.5 pr-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                    </td>
                    <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052CC] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">
                          {s.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px] font-semibold">
                      {s.studentCode}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0052CC] font-bold text-[10px] border border-blue-100 truncate max-w-[150px]">
                        {s.currentLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium truncate max-w-[140px]">
                      {s.currentScore}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[150px]">
                      {s.email}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {s.enrolledDate}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                          title="Xem chi tiết học viên"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStudentToToggleStatus({
                              id: s.id,
                              fullName: s.fullName,
                              isActive: s.status === 'Active',
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.status === 'Active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={
                            s.status === 'Active'
                              ? 'Vô hiệu hóa (Khóa tài khoản học viên)'
                              : 'Kích hoạt lại tài khoản học viên'
                          }
                        >
                          {s.status === 'Active' ? (
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
        <div className="px-5 py-3 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredStudents.length}</span> of{' '}
            <span className="font-bold text-slate-700">{totalStudentsCount}</span> students
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center ${
                    p === page
                      ? 'bg-[#0052CC] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50'
                  }`}
                >
                  {p + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: VIEW STUDENT DETAILS ================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Student Profile</h3>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center text-xl font-extrabold shadow-sm">
                {selectedStudent.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {selectedStudent.fullName}
                </h4>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                <p className="text-xs font-mono font-semibold text-blue-600 mt-0.5">
                  {selectedStudent.studentCode}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Trình độ hiện tại</dt>
                <dd className="font-bold text-[#0052CC] mt-1">{selectedStudent.currentLevel}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Điểm hiện tại</dt>
                <dd className="font-bold text-emerald-600 mt-1">{selectedStudent.currentScore}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Điện thoại</dt>
                <dd className="font-bold text-slate-800 mt-1">{selectedStudent.phone}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Ngày đăng ký</dt>
                <dd className="font-bold text-slate-800 mt-1">{selectedStudent.enrolledDate}</dd>
              </div>
            </dl>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setSelectedStudent(null)}
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DEACTIVATE / ACTIVATE STUDENT ================= */}
      {studentToToggleStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  studentToToggleStatus.isActive
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {studentToToggleStatus.isActive ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {studentToToggleStatus.isActive
                    ? 'Vô hiệu hóa (Khóa tài khoản) học viên'
                    : 'Kích hoạt lại tài khoản học viên'}
                </h3>
                <p className="text-xs text-slate-500">
                  {studentToToggleStatus.isActive
                    ? 'Khóa quyền truy cập hệ thống của học viên này.'
                    : 'Mở lại quyền truy cập cho học viên.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Bạn có chắc chắn muốn {studentToToggleStatus.isActive ? 'vô hiệu hóa' : 'kích hoạt lại'} tài khoản của học viên{' '}
              <strong className="text-slate-900">{studentToToggleStatus.fullName}</strong>?
              {studentToToggleStatus.isActive &&
                ' Toàn bộ lịch sử học tập, giao dịch và kết quả thi cử vẫn được bảo toàn trong hệ thống.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStudentToToggleStatus(null)}
                disabled={statusMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant={studentToToggleStatus.isActive ? 'danger' : 'primary'}
                size="sm"
                isLoading={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    id: studentToToggleStatus.id,
                    isActive: !studentToToggleStatus.isActive,
                  })
                }
              >
                {studentToToggleStatus.isActive ? 'Xác nhận khóa' : 'Kích hoạt'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagementView;
