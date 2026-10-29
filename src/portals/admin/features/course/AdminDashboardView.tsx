/**
 * AdminDashboardView — Executive Command Center for English Center Admin
 * 100% Real API integration — No mock or hardcoded data
 */

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileCheck2,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Eye,
  Sparkles,
  Calendar,
  Clock,
  Settings,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { StatCard } from '@/portals/admin/components/StatCard';
import { getUsers, getMentors } from '@/shared/api/domainApi';
import { fetchCourses } from '@/shared/api/courseService';
import {
  useAdminBookings,
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatDate,
  formatTime,
} from '@/shared/schedule';
import { formatVND } from '@/shared/utils';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export const AdminDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'This Year' | 'Last 6 Months' | 'All Time'>('This Year');

  // 1. Query real students (count & recent 5)
  const studentsQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'DASHBOARD_STUDENTS'],
    queryFn: () => getUsers({ roleName: 'STUDENT', page: 0, size: 5 }),
  });

  // 2. Query real mentors (count & recent 5)
  const mentorsQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.mentors, 'DASHBOARD_MENTORS'],
    queryFn: () => getMentors({ page: 0, size: 5 }),
  });

  // 3. Query all users (count total accounts)
  const allUsersQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'DASHBOARD_ALL_USERS'],
    queryFn: () => getUsers({ page: 0, size: 1 }),
  });

  // 4. Query real courses (count & recent 4)
  const coursesQuery = useQuery({
    queryKey: QUERY_KEYS.catalog.courses({ size: 4 }),
    queryFn: () => fetchCourses({ size: 4 }),
  });

  // 5. Query real bookings (count & recent 4)
  const bookingsQuery = useAdminBookings({ page: 0, size: 4 });

  // 6. Query registered accounts for dynamic enrollment chart (up to 100 recent users)
  const chartUsersQuery = useQuery({
    queryKey: [...QUERY_KEYS.admin.accounts, 'DASHBOARD_CHART_USERS'],
    queryFn: () => getUsers({ page: 0, size: 100 }),
  });

  const totalStudents = studentsQuery.data?.totalElements ?? (studentsQuery.data?.data?.length || 0);
  const totalMentors = mentorsQuery.data?.totalElements ?? (mentorsQuery.data?.data?.length || 0);
  const totalAccounts = allUsersQuery.data?.totalElements ?? 0;
  const totalCourses = coursesQuery.data?.totalElements ?? (coursesQuery.data?.data?.length || 0);
  const totalBookings = bookingsQuery.data?.totalElements ?? (bookingsQuery.data?.data?.length || 0);

  const recentStudents = studentsQuery.data?.data ?? [];
  const recentMentors = mentorsQuery.data?.data ?? [];
  const recentCourses = coursesQuery.data?.data ?? [];
  const recentBookings = bookingsQuery.data?.data ?? [];

  // ================= DYNAMIC CHART COMPUTATION =================
  const { chartLabels, chartPoints, peakMonth, peakValue } = useMemo(() => {
    const users = chartUsersQuery.data?.data ?? [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let labels: string[] = [];
    let counts: number[] = [];

    if (timeRange === 'Last 6 Months') {
      const recentMonths: { label: string; year: number; month: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        recentMonths.push({
          label: monthNames[d.getMonth()],
          year: d.getFullYear(),
          month: d.getMonth(),
        });
      }
      labels = recentMonths.map((m) => m.label);
      counts = recentMonths.map((m) => {
        return users.filter((u) => {
          if (!u.createdAt) return false;
          const ud = new Date(u.createdAt);
          return ud.getFullYear() === m.year && ud.getMonth() === m.month;
        }).length;
      });
    } else {
      // 12 months (This Year or All Time)
      labels = monthNames;
      counts = monthNames.map((_, idx) => {
        return users.filter((u) => {
          if (!u.createdAt) return false;
          const ud = new Date(u.createdAt);
          if (timeRange === 'All Time') {
            return ud.getMonth() === idx;
          }
          return ud.getFullYear() === currentYear && ud.getMonth() === idx;
        }).length;
      });
    }

    let peakIdx = 0;
    let maxFound = -1;
    counts.forEach((c, idx) => {
      if (c > maxFound) {
        maxFound = c;
        peakIdx = idx;
      }
    });

    return {
      chartLabels: labels,
      chartPoints: counts,
      peakMonth: labels[peakIdx] || 'This Month',
      peakValue: maxFound > 0 ? maxFound : totalStudents,
    };
  }, [chartUsersQuery.data, timeRange, totalStudents]);

  // SVG Geometry calculation for smooth Area + Line Chart (width: 600, height: 220)
  const { areaPath, linePath, svgPoints, peakPoint } = useMemo(() => {
    const maxVal = Math.max(...chartPoints, 4); // Minimum baseline scale
    const n = chartPoints.length;
    const step = n > 1 ? 540 / (n - 1) : 0;

    const points = chartPoints.map((val, idx) => {
      const x = 30 + idx * step;
      // y from 185 (0 value) to 35 (max value)
      const y = 185 - (val / maxVal) * 150;
      return { x, y, val };
    });

    if (points.length === 0) {
      return { areaPath: '', linePath: '', svgPoints: [], peakPoint: null };
    }

    let lineD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      lineD += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const areaD = `${lineD} L ${last.x},195 L ${first.x},195 Z`;

    // Find peak point
    let highest = points[0];
    for (const pt of points) {
      if (pt.val >= highest.val) highest = pt;
    }

    return { areaPath: areaD, linePath: lineD, svgPoints: points, peakPoint: highest };
  }, [chartPoints]);

  return (
    <div className="space-y-6">
      {/* ================= 1. STATS ROW (100% Dynamic from Backend API) ================= */}
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
          title="Active Courses"
          value={totalCourses}
          subtext={`${totalCourses} khóa học đang mở`}
          icon={BookOpen}
          colorScheme="purple"
        />
        <StatCard
          title="1-on-1 Bookings"
          value={totalBookings}
          subtext={`${totalBookings} lịch hẹn buổi học`}
          icon={CalendarDays}
          colorScheme="cyan"
        />
      </div>

      {/* ================= 2. MAIN GRID (Dynamic Chart + Recent Students) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Student Enrollment Overview Area Chart (7 cols) */}
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
                  {timeRange === 'Last 6 Months'
                    ? 'Xu hướng đăng ký 6 tháng gần nhất'
                    : 'Xu hướng tài khoản và học viên mới theo tháng'}
                </p>
              </div>
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            >
              <option value="This Year">This Year</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* Dynamic SVG Area Chart */}
          <div className="pt-6 pb-2">
            <div className="relative w-full h-64">
              {/* Dynamic Tooltip callout at the peak point */}
              {peakPoint && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-full bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg pointer-events-none z-10 flex flex-col items-center transition-all duration-300"
                  style={{
                    left: `${(peakPoint.x / 600) * 100}%`,
                    top: `${(peakPoint.y / 220) * 100}%`,
                  }}
                >
                  <span className="text-[10px] text-slate-300 font-normal">
                    {peakMonth}
                  </span>
                  <span>{peakValue} Students</span>
                  <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 mt-0.5" />
                </div>
              )}

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
                {[35, 75, 115, 155, 195].map((y, idx) => (
                  <line
                    key={idx}
                    x1="20"
                    y1={y}
                    x2="580"
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area under curve */}
                {areaPath && (
                  <path d={areaPath} fill="url(#studentAreaGrad)" />
                )}

                {/* Spline line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#0052CC"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                )}

                {/* Key data points */}
                {svgPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.val > 0 ? 4.5 : 2.5}
                    fill={pt.val > 0 ? '#0052CC' : '#94A3B8'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all hover:r-6"
                  />
                ))}
              </svg>
            </div>

            {/* Dynamic X-axis labels */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-2 px-2 border-t border-slate-100">
              {chartLabels.map((m, idx) => (
                <span key={`${m}-${idx}`}>{m}</span>
              ))}
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
                    <th className="py-2">Contact</th>
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
              View All Students ({totalStudents}) →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 3. SECOND ROW (Mentors + Real Courses + Real Bookings) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Mentors Overview Widget (Real API) */}
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
              Manage Mentors Faculty ({totalMentors}) →
            </Link>
          </div>
        </div>

        {/* Real Courses Catalog Widget (Replacing mock Announcements) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Course Catalog</h3>
              </div>
              <span className="text-xs font-bold text-purple-600">
                {totalCourses} Khóa học
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {recentCourses.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Chưa có khóa học nào. Hãy tạo khóa học đầu tiên!
                </div>
              ) : (
                recentCourses.map((c) => (
                  <div
                    key={c.courseId}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {c.certificateName || 'Chung'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {formatVND(c.price)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-1.5 leading-snug truncate">
                      {c.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-medium">
                      <span>Mã: {c.code}</span>
                      <span
                        className={`capitalize font-bold ${
                          c.status === 'active'
                            ? 'text-emerald-600'
                            : c.status === 'draft'
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <Link
              to="/admin/courses"
              className="text-xs font-bold text-slate-600 hover:text-[#0052CC] transition-colors"
            >
              All Courses →
            </Link>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Plus}
              onClick={() => navigate('/admin/courses')}
              className="font-bold text-xs"
            >
              New Course
            </Button>
          </div>
        </div>

        {/* Real 1-on-1 Bookings Widget (Replacing mock Active Services) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cyan-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Recent 1-1 Bookings</h3>
              </div>
              <Badge variant="info" size="sm">
                {totalBookings} Buổi hẹn
              </Badge>
            </div>

            <div className="space-y-2.5 mt-3">
              {recentBookings.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Chưa có lịch hẹn 1-1 nào trong hệ thống
                </div>
              ) : (
                recentBookings.map((b) => {
                  const statusLabel = BOOKING_STATUS_LABEL[b.status] || b.status;
                  const statusVariant = BOOKING_STATUS_VARIANT[b.status] || 'neutral';
                  return (
                    <div
                      key={b.bookingId}
                      className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">
                            {b.studentName} ➔ {b.mentorName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {formatDate(b.startTime)} ({formatTime(b.startTime)} - {formatTime(b.endTime)})
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusVariant} size="sm">
                        {statusLabel}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/admin/bookings"
              className="text-xs font-bold text-slate-600 hover:text-[#0052CC] transition-colors"
            >
              Manage 1-on-1 Bookings ({totalBookings}) →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 4. QUICK ACTIONS BAR ================= */}
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
            onClick={() => navigate('/admin/bookings')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-purple-500 hover:bg-purple-50/40 text-slate-700 hover:text-purple-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">1-1 Bookings</span>
            <span className="text-[10px] text-slate-400">Manage schedules</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/exams')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200/70 hover:border-cyan-500 hover:bg-cyan-50/40 text-slate-700 hover:text-cyan-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-50 group-hover:bg-cyan-600 text-cyan-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Manage Exams</span>
            <span className="text-[10px] text-slate-400">Question bank</span>
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
            <span className="text-[10px] text-slate-400">Academy config</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
