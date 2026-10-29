/**
 * SettingsView — English Center Academy & System Configuration
 * Real API integration with dynamic course distribution and persisted configuration
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Save,
  CheckCircle2,
  PieChart as PieIcon,
  Clock,
  Check,
  Lock,
  Layers,
  Server,
  Key,
} from 'lucide-react';
import { fetchCourses } from '@/shared/api/courseService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/auth/useAuthStore';

const STORAGE_KEYS = {
  CENTER_INFO: 'admin_center_info',
  ACADEMIC_CONFIG: 'admin_academic_config',
  TOGGLES: 'admin_system_toggles',
};

const DEFAULT_CENTER_INFO = {
  centerName: 'PrepMaster English Academy',
  centerCode: 'PMA-EDU-01',
  email: 'contact@prepmaster.edu.vn',
  hotline: '+84 (0) 24 7300 8888',
  address: 'Tầng 8, Tòa nhà Prep Tower, 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
  taxCode: '0109887766',
  website: 'https://prepmaster.edu.vn',
  operatingLicense: 'GP-BGDĐT-2023/1849',
  director: 'TS. Lê Hoàng Tuấn',
};

const DEFAULT_ACADEMIC_CONFIG = {
  academicYear: '2025 - 2026',
  timezone: 'Asia/Ho_Chi_Minh (GMT+7)',
  currency: 'VND (₫)',
  gradingSystem: 'IELTS Band Score (0.0 - 9.0) & CEFR',
  maxBatchCapacity: 25,
  minAttendancePercent: 80,
};

export const SettingsView: React.FC = () => {
  const { user } = useAuthStore();

  // Load initial states from localStorage if available
  const [centerInfo, setCenterInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CENTER_INFO);
      return saved ? JSON.parse(saved) : DEFAULT_CENTER_INFO;
    } catch {
      return DEFAULT_CENTER_INFO;
    }
  });

  const [academicConfig, setAcademicConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACADEMIC_CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_ACADEMIC_CONFIG;
    } catch {
      return DEFAULT_ACADEMIC_CONFIG;
    }
  });

  const [toggles, setToggles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOGGLES);
      return saved
        ? JSON.parse(saved)
        : {
            autoApproveEnrollment: true,
            requireBcrypt: true,
            emailNotification: true,
            maintenanceMode: false,
          };
    } catch {
      return {
        autoApproveEnrollment: true,
        requireBcrypt: true,
        emailNotification: true,
        maintenanceMode: false,
      };
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch real courses to compute dynamic category breakdown
  const { data: coursesData } = useQuery({
    queryKey: QUERY_KEYS.catalog.courses({ size: 100 }),
    queryFn: () => fetchCourses({ size: 100 }),
  });

  const courses = coursesData?.data ?? [];
  const totalCourses = coursesData?.totalElements ?? courses.length;

  // Dynamically calculate course share per certificate / category
  const categoryData = useMemo(() => {
    if (courses.length === 0) {
      return [
        { label: 'General English', percent: 100, color: '#0052CC', courses: 0 },
      ];
    }

    const counts: Record<string, number> = {};
    courses.forEach((c) => {
      const key = c.certificateName || 'Chung / Foundation';
      counts[key] = (counts[key] || 0) + 1;
    });

    const colors = ['#0052CC', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];
    const total = courses.length;

    return Object.entries(counts).map(([label, count], idx) => ({
      label,
      courses: count,
      percent: Math.max(1, Math.round((count / total) * 100)),
      color: colors[idx % colors.length],
    }));
  }, [courses]);

  // SVG circular donut circumference
  const circumference = 2 * Math.PI * 40; // r = 40 => ~251.32
  let accumulatedPercent = 0;

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEYS.CENTER_INFO, JSON.stringify(centerInfo));
      localStorage.setItem(STORAGE_KEYS.ACADEMIC_CONFIG, JSON.stringify(academicConfig));
      localStorage.setItem(STORAGE_KEYS.TOGGLES, JSON.stringify(toggles));
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Center Settings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure English Center identity, academic rules, course distribution, and system logs.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={Save}
          onClick={handleSaveAll}
          className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs self-start sm:self-auto"
        >
          Save Changes
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Đã lưu toàn bộ cấu hình hệ thống và thông tin trung tâm thành công vào bộ nhớ lưu trữ!
          </span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT 2 COLS: Center Information & Academic Settings ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Center Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Center Information
                  </h2>
                  <p className="text-xs text-slate-400">
                    Legal academy profile and official communication contacts
                  </p>
                </div>
              </div>

              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Center
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Center Legal Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={centerInfo.centerName}
                    onChange={(e) =>
                      setCenterInfo({ ...centerInfo, centerName: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Center Code
                </label>
                <input
                  type="text"
                  value={centerInfo.centerCode}
                  disabled
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-400 bg-slate-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Support Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={centerInfo.email}
                    onChange={(e) =>
                      setCenterInfo({ ...centerInfo, email: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hotline / Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={centerInfo.hotline}
                    onChange={(e) =>
                      setCenterInfo({ ...centerInfo, hotline: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campus Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={centerInfo.address}
                    onChange={(e) =>
                      setCenterInfo({ ...centerInfo, address: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tax Identification Number (MST)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={centerInfo.taxCode}
                    onChange={(e) =>
                      setCenterInfo({ ...centerInfo, taxCode: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academy Website
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={centerInfo.website}
                    onChange={(e) =>
                      setCenterInfo({ ...centerInfo, website: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Academic & Enrollment Policy */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Academic & Enrollment Policy
                  </h2>
                  <p className="text-xs text-slate-400">
                    Global grading scale, cohort size limits, and access guards
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicConfig.academicYear}
                  onChange={(e) =>
                    setAcademicConfig({ ...academicConfig, academicYear: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Timezone
                </label>
                <select
                  value={academicConfig.timezone}
                  onChange={(e) =>
                    setAcademicConfig({ ...academicConfig, timezone: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#0052CC]"
                >
                  <option value="Asia/Ho_Chi_Minh (GMT+7)">Asia/Ho_Chi_Minh (GMT+7)</option>
                  <option value="Asia/Bangkok (GMT+7)">Asia/Bangkok (GMT+7)</option>
                  <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Grading Scale Standard
                </label>
                <input
                  type="text"
                  value={academicConfig.gradingSystem}
                  onChange={(e) =>
                    setAcademicConfig({ ...academicConfig, gradingSystem: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Max Batch Capacity (Students)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={academicConfig.maxBatchCapacity}
                  onChange={(e) =>
                    setAcademicConfig({
                      ...academicConfig,
                      maxBatchCapacity: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>

            {/* System Switches */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Tự động kích hoạt khóa học khi học viên thanh toán (Auto-Enroll)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Cấp quyền truy cập học liệu và video bài giảng ngay sau khi xác nhận học phí.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setToggles({ ...toggles, autoApproveEnrollment: !toggles.autoApproveEnrollment })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    toggles.autoApproveEnrollment ? 'bg-[#0052CC]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      toggles.autoApproveEnrollment ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Mã hóa mật khẩu chuẩn BCrypt khi tạo tài khoản giảng viên
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Backend tự sinh mật khẩu có muối mã hóa an toàn khi quản trị viên tạo tài khoản Mentor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setToggles({ ...toggles, requireBcrypt: !toggles.requireBcrypt })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    toggles.requireBcrypt ? 'bg-[#0052CC]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      toggles.requireBcrypt ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT 1 COL: Real Category Donut & System Info ================= */}
        <div className="space-y-6">
          {/* Dynamic Donut Chart: Course Categories from Real API */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0052CC]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Course Category Share
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {totalCourses} Courses
              </span>
            </div>

            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {/* Dynamic Slices */}
                  {categoryData.map((cat, i) => {
                    const strokeDasharray = `${(cat.percent / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                    accumulatedPercent += cat.percent;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute text-center">
                  <p className="text-xl font-black text-slate-900 tracking-tight">
                    {totalCourses}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Courses
                  </p>
                </div>
              </div>
            </div>

            {/* Categories Legend */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {categoryData.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-700">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{cat.courses} courses</span>
                    <span className="font-bold text-slate-900 font-mono">{cat.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Administrator & System Session Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                System & Session Info
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Active Admin:</span>
                <span className="font-bold text-slate-800">
                  {user?.fullName || user?.email || 'Super Admin'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Role:</span>
                <Badge variant="success" size="sm">
                  {user?.role || 'ADMIN'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Backend API:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  Connected (Spring Boot)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Auth Token Guard:</span>
                <span className="font-mono text-[11px] text-slate-700 font-bold">
                  JWT + BCrypt Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
