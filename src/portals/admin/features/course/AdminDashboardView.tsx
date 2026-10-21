/**
 * AdminDashboardView — Executive Command Center for English Center Admin
 * Faithfully converted from the reference dashboard (8.webp)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  BookOpen,
  Megaphone,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { StatCard } from '@/portals/admin/components/StatCard';
import { getUsers, getMentors } from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Annual IELTS Mock Test Day 2025',
    date: 'May 20, 2025',
    category: 'Examination',
    status: 'Published',
  },
  {
    id: 2,
    title: 'Speaking Workshop with British Council Examiners',
    date: 'May 18, 2025',
    category: 'Workshop',
    status: 'Published',
  },
  {
    id: 3,
    title: 'New AI Writing Evaluation Rubrics (Band 8.0+)',
    date: 'May 15, 2025',
    category: 'Academic',
    status: 'Published',
  },
  {
    id: 4,
    title: 'Holiday Schedule & Class Rescheduling Notice',
    date: 'May 12, 2025',
    category: 'General',
    status: 'Published',
  },
];

const SERVICES_LIST = [
  {
    name: 'Online E-Library & Materials',
    desc: 'Access to 1,200+ IELTS & TOEIC Cambridge tests',
    status: 'Active',
    icon: BookOpen,
  },
  {
    name: '1-on-1 Mentor Speaking Room',
    desc: 'Direct mock speaking interviews with AI feedback',
    status: 'Active',
    icon: Users,
  },
  {
    name: 'Computer-based Mock Exam Lab',
    desc: 'Simulated official test environments (VSTEP & IELTS)',
    status: 'Active',
    icon: Layers,
  },
  {
    name: 'AI Writing Automatic Scorer',
    desc: 'Instant CEFR/IELTS feedback with grammar correction',
    status: 'Active',
    icon: Sparkles,
  },
];

export const AdminDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('This Year');

  // Query real students
  const studentsQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'DASHBOARD_STUDENTS'],
    queryFn: () => getUsers({ roleName: 'STUDENT', page: 0, size: 5 }),
  });

  // Query real mentors
  const mentorsQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.mentors, 'DASHBOARD_MENTORS'],
    queryFn: () => getMentors({ page: 0, size: 5 }),
  });

  // Query all users to count total accounts
  const allUsersQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'DASHBOARD_ALL_USERS'],
    queryFn: () => getUsers({ page: 0, size: 1 }),
  });

  const totalStudents = studentsQuery.data?.totalElements ?? (studentsQuery.data?.data?.length || 0);
  const totalMentors = mentorsQuery.data?.totalElements ?? (mentorsQuery.data?.data?.length || 0);
  const totalAccounts = allUsersQuery.data?.totalElements ?? 0;
  const recentStudents = studentsQuery.data?.data ?? [];
  const recentMentors = mentorsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* ================= 1. STATS ROW (Dynamic from backend) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtext={`${totalStudents} học viên hệ thống`}
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Total Mentors"
          value={totalMentors}
          subtext={`${totalMentors} giảng viên đã duyệt`}
          icon={GraduationCap}
          colorScheme="emerald"
        />
        <StatCard
          title="Total Accounts"
          value={totalAccounts}
          subtext={`${totalAccounts} tài khoản đăng ký`}
          icon={BookOpen}
          colorScheme="amber"
        />
        <StatCard
          title="News Posted"
          value="4"
          subtext="Thông báo học vụ"
          icon={Megaphone}
          colorScheme="purple"
        />
        <StatCard
          title="Active Services"
          value="4"
          subtext="Hệ thống hoạt động ổn định"
          icon={Layers}
          colorScheme="cyan"
        />
      </div>

      {/* ================= 2. MAIN GRID (Chart + Recent Students + News) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Student Overview Area Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Student Enrollment Overview
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Monthly new student admissions trend
                </p>
              </div>
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            >
              <option value="This Year">This Year</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* SVG Area Chart */}
          <div className="pt-6 pb-2">
            <div className="relative w-full h-64">
              {/* Tooltip callout (at peak May) */}
              <div className="absolute left-[38%] top-[18%] -translate-x-1/2 -translate-y-full bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg pointer-events-none z-10 flex flex-col items-center">
                <span className="text-[10px] text-slate-300 font-normal">May 2025</span>
                <span>1,050 Students</span>
                <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 mt-0.5" />
              </div>

              <svg
                viewBox="0 0 600 220"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="studentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0052CC" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#0052CC" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 50, 100, 150, 200].map((y, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area under curve */}
                <path
                  d="M 20,180 C 80,165 140,150 200,120 C 240,100 270,40 300,70 C 350,110 420,80 480,50 C 530,30 560,45 590,40 L 590,200 L 20,200 Z"
                  fill="url(#studentAreaGrad)"
                />

                {/* Spline line */}
                <path
                  d="M 20,180 C 80,165 140,150 200,120 C 240,100 270,40 300,70 C 350,110 420,80 480,50 C 530,30 560,45 590,40"
                  fill="none"
                  stroke="#0052CC"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Key data points */}
                <circle cx="300" cy="70" r="5" fill="#0052CC" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="480" cy="50" r="4" fill="#0052CC" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="590" cy="40" r="4.5" fill="#0052CC" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-2 px-2 border-t border-slate-100">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                (m) => (
                  <span key={m}>{m}</span>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Recent Students Table (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0052CC]" />
                <h3 className="font-extrabold text-slate-900 text-base">Recent Students</h3>
              </div>
              <Link
                to="/admin/students"
                className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2">Student</th>
                    <th className="py-2">Course</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        Chưa có học viên nào trong hệ thống
                      </td>
                    </tr>
                  ) : (
                    recentStudents.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-[#0052CC] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {(s.fullName || 'H').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[110px]">{s.fullName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-500 font-medium truncate max-w-[120px]">
                          {s.email}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {s.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigate('/admin/students')}
                            className="p-1 text-slate-400 hover:text-[#0052CC] rounded-md transition-colors"
                            title="View detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/admin/students"
              className="text-xs font-bold text-slate-600 hover:text-[#0052CC] transition-colors"
            >
              View All Students →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 3. SECOND ROW (Mentors Overview + News + Services) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Mentors Overview Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0052CC]" />
                <h3 className="font-extrabold text-slate-900 text-base">Mentors Overview</h3>
              </div>
              <Link
                to="/admin/mentors"
                className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {recentMentors.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Chưa có giảng viên nào trong hệ thống
                </div>
              ) : (
                recentMentors.map((m, idx) => (
                  <div
                    key={m.userId || idx}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-[#0052CC] font-bold text-xs flex items-center justify-center shrink-0">
                        {(m.fullName || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{m.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {m.specialization || m.department || 'Giảng viên chuyên môn'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-700">
                        {m.ratingAverage ? m.ratingAverage.toFixed(1) : '5.0'} ★
                      </span>
                      <span className="text-[10px] text-slate-400 block">Đánh giá</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/admin/mentors"
              className="text-xs font-bold text-slate-600 hover:text-[#0052CC] transition-colors"
            >
              Manage Mentors Faculty →
            </Link>
          </div>
        </div>

        {/* News & Announcements Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">News & Notices</h3>
              </div>
              <span className="text-xs font-bold text-purple-600">4 Active</span>
            </div>

            <div className="space-y-3 mt-3">
              {ANNOUNCEMENTS.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {a.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{a.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1.5 leading-snug">
                    {a.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={Plus}
              onClick={() => navigate('/admin/courses')}
              className="font-bold text-xs"
            >
              Post New Notice
            </Button>
          </div>
        </div>

        {/* Services & Facilities Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Active Services</h3>
              </div>
              <Badge variant="success" size="sm">
                4/4 Online
              </Badge>
            </div>

            <div className="space-y-2.5 mt-3">
              {SERVICES_LIST.map((svc, idx) => {
                const Icon = svc.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{svc.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{svc.desc}</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/admin/settings"
              className="text-xs font-bold text-slate-600 hover:text-[#0052CC] transition-colors"
            >
              Configure Platform Services →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 4. QUICK ACTIONS BAR (Matching 8.webp) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-sm mb-3.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0052CC]" /> Quick Actions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-[#0052CC] hover:bg-blue-50/40 text-slate-700 hover:text-[#0052CC] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-[#0052CC] text-[#0052CC] group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Add Student</span>
            <span className="text-[10px] text-slate-400">Enroll learner</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/mentors')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Add Mentor</span>
            <span className="text-[10px] text-slate-400">Create faculty</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/courses')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-amber-500 hover:bg-amber-50/40 text-slate-700 hover:text-amber-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">New Course</span>
            <span className="text-[10px] text-slate-400">Publish catalog</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/accounts')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-purple-500 hover:bg-purple-50/40 text-slate-700 hover:text-purple-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Megaphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Post Notice</span>
            <span className="text-[10px] text-slate-400">Notify users</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/accounts')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-cyan-500 hover:bg-cyan-50/40 text-slate-700 hover:text-cyan-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-50 group-hover:bg-cyan-600 text-cyan-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Manage Roles</span>
            <span className="text-[10px] text-slate-400">System RBAC</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-800 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 text-slate-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Settings</span>
            <span className="text-[10px] text-slate-400">Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
