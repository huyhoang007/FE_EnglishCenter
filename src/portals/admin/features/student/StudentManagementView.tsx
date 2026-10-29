/**
 * StudentManagementView — English Center Student Directory & Academic Tracking
 * Converted to match the reference UI (6.webp)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Award,
  Search,
  Plus,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Edit2,
  Eye,
  Trash2,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle2,
  X,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { getUsers, registerRequest, updateUserStatus } from '@/shared/api/domainApi';
import type { AuthUser } from '@/shared/types';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export const StudentManagementView: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [keyword, setKeyword] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(0);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Student Form
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    courseName: 'IELTS Intensive 7.5+',
    batch: 'Batch 2024-Q2',
    targetScore: '7.5 IELTS',
  });

  // Query Backend Students (roleName: 'STUDENT')
  const { data: usersData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'STUDENT', page],
    queryFn: () => getUsers({ roleName: 'STUDENT', page, size: 20 }),
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

  const combinedStudents = React.useMemo(() => {
    return backendStudents.map((u, idx) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || 'Chưa cập nhật',
      studentCode: `STD-${String(idx + 1).padStart(4, '0')}`,
      courseName: 'Khóa học chuẩn hóa',
      batch: 'Lớp học tiêu chuẩn',
      status: u.isActive ? 'Active' : 'Inactive',
      enrolledDate: u.createdAt
        ? new Date(u.createdAt).toLocaleDateString('vi-VN')
        : 'Mới đăng ký',
      attendance: '100%',
      targetScore: 'Tiếng Anh chuẩn đầu ra',
    }));
  }, [backendStudents]);

  // Client-side filtering
  const filteredStudents = combinedStudents.filter((s) => {
    const matchKeyword =
      !keyword ||
      s.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
      s.email.toLowerCase().includes(keyword.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(keyword.toLowerCase()) ||
      s.phone.includes(keyword);

    const matchCourse = !courseFilter || s.courseName.includes(courseFilter);
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchBatch = !batchFilter || s.batch.includes(batchFilter);

    return matchKeyword && matchCourse && matchStatus && matchBatch;
  });

  const handleResetFilters = () => {
    setKeyword('');
    setCourseFilter('');
    setStatusFilter('');
    setBatchFilter('');
    setPage(0);
  };

  const createStudentMutation = useMutation({
    mutationFn: (payload: { email: string; fullName: string; phone?: string }) =>
      registerRequest({
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone || undefined,
        password: 'Student@123456',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.accounts });
      setIsAddOpen(false);
      setSuccessToast(
        `Đã ghi danh học viên ${newStudentForm.fullName} vào hệ thống thành công! (Mật khẩu mặc định: Student@123456)`
      );
      setNewStudentForm({
        fullName: '',
        email: '',
        phone: '',
        courseName: 'IELTS Intensive 7.5+',
        batch: 'Batch 2025',
        targetScore: '7.5 IELTS',
      });
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      alert(err.message || 'Lỗi khi tạo tài khoản học viên');
    },
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim() || !newStudentForm.email.trim()) return;
    createStudentMutation.mutate({
      fullName: newStudentForm.fullName.trim(),
      email: newStudentForm.email.trim(),
      phone: newStudentForm.phone.trim(),
    });
  };

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
          title="Certificates Awarded"
          value={activeStudentsCount}
          subtext="Theo học viên tích cực"
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

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsAddOpen(true)}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            Add New Student
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
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search students by name, email, student ID..."
              className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Course Program Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Programs</option>
            <option value="IELTS">IELTS Courses</option>
            <option value="TOEIC">TOEIC Courses</option>
            <option value="VSTEP">VSTEP Courses</option>
            <option value="Lab">Speaking & Writing Lab</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Batches</option>
            <option value="Batch 2024-Q1">Batch 2024-Q1</option>
            <option value="Batch 2024-Q2">Batch 2024-Q2</option>
            <option value="Weekend">Weekend Masterclass</option>
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

      {/* Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

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
                  <th className="py-3.5 px-3 font-bold">Enrolled Program</th>
                  <th className="py-3.5 px-3 font-bold">Class / Batch</th>
                  <th className="py-3.5 px-3 font-bold">Attendance</th>
                  <th className="py-3.5 px-3 font-bold">Email</th>
                  <th className="py-3.5 px-3 font-bold">Status</th>
                  <th className="py-3.5 px-3 font-bold">Enrolled Date</th>
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
                        {s.courseName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium truncate max-w-[140px]">
                      {s.batch}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700">{s.attendance}</span>
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
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                          title="View student profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Chỉnh sửa học viên ${s.fullName}`)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= 5. PAGINATION (Matching 6.webp) ================= */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredStudents.length}</span> of{' '}
            <span className="font-bold text-slate-700">1,250</span> students
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
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
              <span className="px-1 text-slate-400">…</span>
              <button
                type="button"
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 font-semibold flex items-center justify-center hover:bg-slate-50"
              >
                25
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
              >
                ›
              </button>
            </div>

            <select className="h-7 px-2 border border-slate-200 rounded-lg text-slate-600 text-xs bg-white focus:outline-none">
              <option>10 per page</option>
              <option>20 per page</option>
              <option>50 per page</option>
            </select>
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
                <dt className="text-slate-400 font-semibold uppercase">Chương trình học</dt>
                <dd className="font-bold text-[#0052CC] mt-1">{selectedStudent.courseName}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Lớp / Batch</dt>
                <dd className="font-bold text-slate-800 mt-1">{selectedStudent.batch}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Mục tiêu điểm số</dt>
                <dd className="font-bold text-emerald-600 mt-1">{selectedStudent.targetScore}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Tỉ lệ chuyên cần</dt>
                <dd className="font-bold text-slate-800 mt-1">{selectedStudent.attendance}</dd>
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

      {/* ================= MODAL: ADD NEW STUDENT ================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Ghi danh học viên mới</h3>
                  <p className="text-xs text-slate-500">Nhập thông tin tiếp nhận học viên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ và tên học viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.fullName}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, fullName: e.target.value })
                    }
                    placeholder="VD: Nguyễn Văn B"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newStudentForm.email}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, email: e.target.value })
                      }
                      placeholder="student@gmail.com"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={newStudentForm.phone}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, phone: e.target.value })
                      }
                      placeholder="0912345678"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Chương trình học
                    </label>
                    <select
                      value={newStudentForm.courseName}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, courseName: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] bg-white"
                    >
                      <option value="IELTS Intensive 7.5+">IELTS Intensive 7.5+</option>
                      <option value="TOEIC 4-Skills 800+">TOEIC 4-Skills 800+</option>
                      <option value="VSTEP B2 — C1 Pathway">VSTEP B2 — C1 Pathway</option>
                      <option value="IELTS Speaking & Writing Lab">IELTS Speaking Lab</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mục tiêu điểm số
                    </label>
                    <input
                      type="text"
                      value={newStudentForm.targetScore}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, targetScore: e.target.value })
                      }
                      placeholder="VD: 7.0 IELTS"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={createStudentMutation.isPending}
                  className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
                >
                  Ghi danh học viên
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementView;
