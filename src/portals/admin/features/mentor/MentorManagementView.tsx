/**
 * MentorManagementView — Faculty & Mentorship Management
 * Converted to match the reference UI (11.webp)
 */

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { StatCard } from '@/portals/admin/components/StatCard';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Award,
  GraduationCap,
  X,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Building,
} from 'lucide-react';
import {
  getAdminMentors,
  getAdminMentorStats,
  createMentor,
  updateMentor,
  revokeMentor,
} from '@/shared/api/domainApi';
import { fetchCertificates } from '@/shared/api/certificateService';
import type { CreateMentorDto, MentorDto, UpdateMentorDto } from '@/shared/api/apiTypes';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Ngày tham gia: mentorRegisteredAt, dữ liệu cũ chưa có thì lấy ngày tạo hồ sơ */
const formatJoinedDate = (m: MentorDto) => {
  const value = m.mentorRegisteredAt ?? m.createdAt;
  return value ? new Date(value).toLocaleDateString('vi-VN') : '—';
};

/** Các nút trang (0-based): trang đầu, trang cuối, ±1 quanh trang hiện tại; 'gap' = dấu … */
const pageItems = (current: number, total: number): (number | 'gap')[] => {
  const pages = [...new Set([0, total - 1, current - 1, current, current + 1])]
    .filter((p) => p >= 0 && p < total)
    .sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push('gap');
    items.push(p);
  });
  return items;
};

export const MentorManagementView: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  // Ô gõ chữ: chờ ngừng gõ 400ms mới gọi API
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorDto | null>(null);
  const [editingMentor, setEditingMentor] = useState<MentorDto | null>(null);
  const [revokingMentor, setRevokingMentor] = useState<MentorDto | null>(null);
  const [createdMentorResult, setCreatedMentorResult] = useState<{
    email: string;
    fullName: string;
    note?: string;
  } | null>(null);

  // Form states for Create
  const [createForm, setCreateForm] = useState<CreateMentorDto>({
    email: '',
    fullName: '',
    phone: '',
    specialization: '',
    department: '',
    avatarUrl: '',
    biography: '',
    hourlyRate: 500000,
  });

  // Form states for Edit
  const [editForm, setEditForm] = useState<UpdateMentorDto>({
    fullName: '',
    phone: '',
    specialization: '',
    department: '',
    avatarUrl: '',
    biography: '',
    hourlyRate: 500000,
  });

  // Danh sách mentor: lọc + phân trang ở server (GET /api/v1/admin/mentors)
  const { data: mentorsData, isLoading, isError } = useQuery({
    queryKey: [
      ...QUERY_KEYS.admin.mentors,
      'list',
      { keyword: debouncedKeyword, department, statusFilter, specialization, page, pageSize },
    ],
    queryFn: () =>
      getAdminMentors({
        keyword: debouncedKeyword || undefined,
        department: department || undefined,
        specialization: specialization || undefined,
        isActive: statusFilter === '' ? undefined : statusFilter === 'Active',
        page,
        size: pageSize,
      }),
  });

  // Thống kê trên toàn bộ mentor (không phụ thuộc trang / bộ lọc)
  const { data: stats } = useQuery({
    queryKey: [...QUERY_KEYS.admin.mentors, 'stats'],
    queryFn: getAdminMentorStats,
  });

  // Danh mục chứng chỉ trực tiếp từ bảng certificates trong DB
  const { data: certificatesData = [] } = useQuery({
    queryKey: ['certificates', 'catalog'],
    queryFn: fetchCertificates,
  });

  const mentors: MentorDto[] = mentorsData?.data ?? [];
  const totalElements = mentorsData?.totalElements ?? 0;
  const totalPages = Math.max(1, mentorsData?.totalPages ?? 1);
  const rangeFrom = totalElements === 0 ? 0 : page * pageSize + 1;
  const rangeTo = page * pageSize + mentors.length;

  const totalMentorsCount = stats?.total ?? 0;
  const activeMentorsCount = stats?.active ?? 0;
  const inactiveMentorsCount = stats?.inactive ?? 0;
  const newMentorsCount = stats?.newLast30Days ?? 0;
  // Fallback defaults nếu DB chưa có mentor hay chứng chỉ nào
  const DEFAULT_DEPARTMENTS = [
    'IELTS Intensive',
    'TOEIC Master',
    'VSTEP Academic',
    'Speaking & Writing',
  ];
  const DEFAULT_SPECIALIZATIONS = [
    'IELTS',
    'TOEIC',
    'VSTEP',
    'TOEFL',
  ];

  const rawDepartmentOptions = stats?.departments ?? [];
  const certNamesFromDb = certificatesData
    .map((c) => c.certificateName?.trim())
    .filter((name): name is string => Boolean(name));

  const rawSpecializationOptions = certNamesFromDb.length > 0
    ? certNamesFromDb
    : (stats?.specializations ?? []);

  // Kết hợp DB + defaults và loại bỏ trùng lặp
  const departmentOptions = Array.from(
    new Set([...rawDepartmentOptions, ...(rawDepartmentOptions.length === 0 ? DEFAULT_DEPARTMENTS : [])])
  );
  const specializationOptions = Array.from(
    new Set([...rawSpecializationOptions, ...(rawSpecializationOptions.length === 0 ? DEFAULT_SPECIALIZATIONS : [])])
  );
  const departmentsCount = departmentOptions.length;

  // Create Mentor Mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateMentorDto) => createMentor(dto),
    onSuccess: (data) => {
      setIsCreateOpen(false);
      setCreateForm({
        email: '',
        fullName: '',
        phone: '',
        specialization: '',
        department: '',
        avatarUrl: '',
        biography: '',
        hourlyRate: 500000,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.mentors });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.accounts });
      if (data) {
        setCreatedMentorResult({
          email: data.mentor.email,
          fullName: data.mentor.fullName,
          note: data.note,
        });
      }
    },
  });

  // Update Mentor Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMentorDto }) =>
      updateMentor(id, dto),
    onSuccess: () => {
      setEditingMentor(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.mentors });
    },
  });

  // Revoke Mentor Mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeMentor(id),
    onSuccess: () => {
      setRevokingMentor(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.mentors });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.accounts });
    },
  });

  const handleOpenEdit = (m: MentorDto) => {
    setEditingMentor(m);
    setEditForm({
      fullName: m.fullName,
      phone: m.phone || '',
      specialization: m.specialization,
      department: m.department,
      avatarUrl: m.avatarUrl || '',
      biography: m.biography || '',
      hourlyRate: m.hourlyRate,
    });
  };

  const handleResetFilters = () => {
    setKeyword('');
    setDepartment('');
    setStatusFilter('');
    setSpecialization('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. STATS ROW (Dynamic from backend) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Mentors"
          value={totalMentorsCount}
          subtext={`${totalMentorsCount} giảng viên`}
          icon={GraduationCap}
          colorScheme="blue"
        />
        <StatCard
          title="Active Mentors"
          value={activeMentorsCount}
          subtext={`${totalMentorsCount > 0 ? Math.round((activeMentorsCount / totalMentorsCount) * 100) : 0}% hoạt động`}
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Inactive Mentors"
          value={inactiveMentorsCount}
          subtext={`${inactiveMentorsCount} tạm nghỉ`}
          icon={UserX}
          colorScheme="amber"
        />
        <StatCard
          title="New Mentors"
          value={newMentorsCount}
          subtext="Mới gia nhập (30 ngày)"
          icon={Award}
          colorScheme="purple"
        />
        <StatCard
          title="Departments"
          value={departmentsCount}
          subtext="Khoa chuyên môn"
          icon={Building}
          colorScheme="cyan"
        />
      </div>

      {/* ================= 2. TITLE BAR & ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentors</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage and view all faculty mentors in your center.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            Add New Mentor
          </Button>
        </div>
      </div>

      {/* ================= 3. FILTER BAR (Matching 11.webp) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search mentors by name, email, phone..."
              className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Departments</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

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

          {/* Specialization Filter — chọn từ danh sách có sẵn */}
          <select
            value={specialization}
            onChange={(e) => {
              setSpecialization(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Specializations</option>
            {specializationOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* More Filters & Reset */}
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

      {/* ================= 4. TABLE SECTION (Matching 11.webp) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading && (
          <p className="py-14 text-center text-slate-400 text-xs">Loading mentors directory...</p>
        )}
        {isError && (
          <p className="py-14 text-center text-rose-600 text-xs">
            Failed to load mentors directory. Please try again.
          </p>
        )}
        {!isLoading && !isError && mentors.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No mentors found matching your filters.</p>
          </div>
        )}

        {!isLoading && !isError && mentors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                  </th>
                  <th className="py-3.5 px-2 w-12 font-bold">#</th>
                  <th className="py-3.5 px-3 font-bold">Mentor</th>
                  <th className="py-3.5 px-3 font-bold">Mentor ID</th>
                  <th className="py-3.5 px-3 font-bold">Department</th>
                  <th className="py-3.5 px-3 font-bold">Specialization</th>
                  <th className="py-3.5 px-3 font-bold">Email</th>
                  <th className="py-3.5 px-3 font-bold">Phone</th>
                  <th className="py-3.5 px-3 font-bold">Status</th>
                  <th className="py-3.5 px-3 font-bold">Joined Date</th>
                  <th className="py-3.5 pr-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mentors.map((m, idx) => (
                  <tr
                    key={m.userId}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                    </td>
                    <td className="py-3 px-2 text-slate-400 font-medium">{page * pageSize + idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052CC] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[150px]">
                          {m.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]" title={m.userId}>
                      {m.userId.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {m.department || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] font-bold text-[10px] border border-blue-100 truncate max-w-[140px]">
                        {m.specialization}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[160px]">
                      {m.email}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{m.phone || '—'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`}
                      >
                        {m.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {formatJoinedDate(m)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit mentor profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMentor(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevokingMentor(m)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Revoke mentor role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= 5. PAGINATION (theo totalElements / totalPages của server) ================= */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {totalElements === 0 ? (
              'Không có mentor'
            ) : (
              <>
                Showing{' '}
                <span className="font-bold text-slate-700">
                  {rangeFrom}–{rangeTo}
                </span>{' '}
                of <span className="font-bold text-slate-700">{totalElements}</span> mentors
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                aria-label="Trang trước"
              >
                ‹
              </button>
              {pageItems(page, totalPages).map((item, i) =>
                item === 'gap' ? (
                  <span key={`gap-${i}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={
                      item === page
                        ? 'w-7 h-7 rounded-lg bg-[#0052CC] text-white font-bold flex items-center justify-center shadow-xs'
                        : 'w-7 h-7 rounded-lg border border-slate-200 text-slate-600 font-semibold flex items-center justify-center hover:bg-slate-50'
                    }
                  >
                    {item + 1}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                aria-label="Trang sau"
              >
                ›
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-7 px-2 border border-slate-200 rounded-lg text-slate-600 text-xs bg-white focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= MODAL: CREATE MENTOR ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Thêm Mentor mới</h3>
                  <p className="text-xs text-slate-500">Khởi tạo tài khoản Mentor và hồ sơ giảng dạy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ và tên giảng viên / Mentor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, fullName: e.target.value })
                    }
                    placeholder="VD: ThS. Nguyễn Văn A"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    placeholder="mentor@englishcenter.com"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone || ''}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    placeholder="0912345678"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chuyên môn / Chứng chỉ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.specialization}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        specialization: e.target.value,
                        // Reset department khi đổi chuyên môn để chọn lại bộ môn phù hợp
                        department: '',
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="">-- Chọn chứng chỉ / chuyên môn --</option>
                    {specializationOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bộ môn / Khoa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!createForm.specialization}
                    value={createForm.department}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, department: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#0052CC] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {createForm.specialization
                        ? '-- Chọn bộ môn / khoa --'
                        : '-- Vui lòng chọn chứng chỉ trước --'}
                    </option>
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thù lao giảng dạy mỗi giờ (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={createForm.hourlyRate}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        hourlyRate: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tiểu sử & Kinh nghiệm giảng dạy
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.biography || ''}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, biography: e.target.value })
                    }
                    placeholder="Tóm tắt quá trình công tác, phương pháp giảng dạy..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>
              </div>

              {createMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    {(createMutation.error as any)?.code === 'ECONNABORTED'
                      ? 'Yêu cầu tạo tài khoản chờ quá lâu. Hãy kiểm tra danh sách mentor trước khi thử lại.'
                      : (createMutation.error as any)?.response?.data?.message ||
                        'Không thể tạo tài khoản Mentor. Vui lòng kiểm tra lại thông tin.'}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={createMutation.isPending}
                  className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
                >
                  Tạo tài khoản Mentor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT MENTOR ================= */}
      {editingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cập nhật hồ sơ Mentor</h3>
                  <p className="text-xs text-slate-500">Chỉnh sửa thông tin chuyên môn & thù lao</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMentor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingMentor.userId,
                  dto: editForm,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chuyên môn / Chứng chỉ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={editForm.specialization}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        specialization: e.target.value,
                        department: '',
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="">-- Chọn chứng chỉ / chuyên môn --</option>
                    {/* Giữ lại option hiện tại nếu nó không nằm trong list options */}
                    {editForm.specialization && !specializationOptions.includes(editForm.specialization) && (
                      <option value={editForm.specialization}>{editForm.specialization}</option>
                    )}
                    {specializationOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bộ môn / Khoa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!editForm.specialization}
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#0052CC] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {editForm.specialization
                        ? '-- Chọn bộ môn / khoa --'
                        : '-- Vui lòng chọn chứng chỉ trước --'}
                    </option>
                    {/* Giữ lại option hiện tại nếu nó không nằm trong list options */}
                    {editForm.department && !departmentOptions.includes(editForm.department) && (
                      <option value={editForm.department}>{editForm.department}</option>
                    )}
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thù lao mỗi giờ (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editForm.hourlyRate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hourlyRate: Number(e.target.value) || 0 })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tiểu sử
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.biography || ''}
                    onChange={(e) => setEditForm({ ...editForm, biography: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingMentor(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={updateMutation.isPending}
                  className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW DETAILS ================= */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết Mentor</h3>
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center text-xl font-extrabold shadow-sm">
                {selectedMentor.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {selectedMentor.fullName}
                </h4>
                <p className="text-xs text-slate-500">{selectedMentor.email}</p>
                <p className="text-xs text-slate-500">{selectedMentor.phone || 'Chưa có SĐT'}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Bộ môn</dt>
                <dd className="font-bold text-slate-800 mt-1">{selectedMentor.department}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Chuyên môn</dt>
                <dd className="font-bold text-[#0052CC] mt-1">{selectedMentor.specialization}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Thù lao mỗi giờ</dt>
                <dd className="font-bold text-slate-800 mt-1">
                  {selectedMentor.hourlyRate.toLocaleString('vi-VN')} VND
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Trạng thái</dt>
                <dd className="mt-1">
                  <Badge variant={selectedMentor.isActive !== false ? 'success' : 'warning'} size="sm">
                    {selectedMentor.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setSelectedMentor(null)}
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}

      {/* ================= MODAL: REVOKE MENTOR ================= */}
      {revokingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Thu hồi quyền Mentor?</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Bạn có chắc chắn muốn thu hồi quyền Mentor của giảng viên{' '}
                <strong className="text-slate-800">{revokingMentor.fullName}</strong> ({revokingMentor.email})?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
              Tài khoản sẽ được chuyển về quyền học viên bình thường và hồ sơ giảng dạy sẽ bị hủy bỏ.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setRevokingMentor(null)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                isLoading={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate(revokingMentor.userId)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Xác nhận thu hồi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUCCESS CREATION (PASSWORD SENT VIA EMAIL ONLY) ================= */}
      {createdMentorResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Tạo tài khoản Mentor thành công!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tài khoản <strong className="text-slate-800">{createdMentorResult.fullName}</strong> ({createdMentorResult.email}) đã được tạo với vai trò <span className="font-bold text-[#0052CC]">MENTOR</span>.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200/70 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0052CC] uppercase tracking-wider">
                <Mail className="w-4 h-4" />
                <span>Mật khẩu đã gửi qua Email</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mật khẩu đăng nhập ban đầu đã được hệ thống gửi trực tiếp tới hòm thư <strong className="text-slate-800">{createdMentorResult.email}</strong>.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => setCreatedMentorResult(null)}
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
            >
              Hoàn tất
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorManagementView;
