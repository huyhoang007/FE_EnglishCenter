/**
 * SettingsView — English Center Academy & System Configuration
 * Converted to match the reference UI (5.webp)
 */

import React, { useState } from 'react';
import { Card } from '@/shared/components/Card';
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
  Edit3,
  Sliders,
  PieChart as PieIcon,
  Clock,
  Check,
  AlertCircle,
  Bell,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  // Center Details Form State
  const [centerInfo, setCenterInfo] = useState({
    centerName: 'PrepMaster English Academy',
    centerCode: 'PMA-EDU-01',
    email: 'contact@prepmaster.edu.vn',
    hotline: '+84 (0) 24 7300 8888',
    address: 'Tầng 8, Tòa nhà Prep Tower, 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
    taxCode: '0109887766',
    website: 'https://prepmaster.edu.vn',
    operatingLicense: 'GP-BGDĐT-2023/1849',
    director: 'TS. Lê Hoàng Tuấn',
  });

  // Academic Configuration
  const [academicConfig, setAcademicConfig] = useState({
    academicYear: '2024 - 2025',
    timezone: 'Asia/Ho_Chi_Minh (GMT+7)',
    currency: 'VND (₫)',
    gradingSystem: 'IELTS Band Score (0.0 - 9.0) & CEFR',
    maxBatchCapacity: 25,
    minAttendancePercent: 80,
  });

  // Toggles
  const [autoApproveEnrollment, setAutoApproveEnrollment] = useState(true);
  const [requireBcrypt, setRequireBcrypt] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Success Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Donut chart calculations for Categories
  const categoryData = [
    { label: 'IELTS Intensive', percent: 45, color: '#0052CC', courses: 18 },
    { label: 'TOEIC Master', percent: 30, color: '#10B981', courses: 12 },
    { label: 'VSTEP Academic', percent: 15, color: '#F59E0B', courses: 6 },
    { label: '1-on-1 Coaching', percent: 10, color: '#8B5CF6', courses: 4 },
  ];

  // Calculate SVG stroke-dasharray & stroke-dashoffset for circular donut
  const circumference = 2 * Math.PI * 40; // r = 40 => ~251.32
  let accumulatedPercent = 0;

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
            Đã lưu toàn bộ cấu hình hệ thống và thông tin trung tâm thành công!
          </span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT 2 COLS: Center Information & Academic Settings ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Center Information (Matching 5.webp) */}
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
                  Center Full Name
                </label>
                <input
                  type="text"
                  value={centerInfo.centerName}
                  onChange={(e) =>
                    setCenterInfo({ ...centerInfo, centerName: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Center Code / ID
                </label>
                <input
                  type="text"
                  readOnly
                  value={centerInfo.centerCode}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={centerInfo.email}
                  onChange={(e) =>
                    setCenterInfo({ ...centerInfo, email: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Support Hotline
                </label>
                <input
                  type="text"
                  value={centerInfo.hotline}
                  onChange={(e) =>
                    setCenterInfo({ ...centerInfo, hotline: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academy Campus Address
                </label>
                <input
                  type="text"
                  value={centerInfo.address}
                  onChange={(e) =>
                    setCenterInfo({ ...centerInfo, address: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tax Identification Number
                </label>
                <input
                  type="text"
                  value={centerInfo.taxCode}
                  onChange={(e) =>
                    setCenterInfo({ ...centerInfo, taxCode: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Operating License
                </label>
                <input
                  type="text"
                  value={centerInfo.operatingLicense}
                  onChange={(e) =>
                    setCenterInfo({ ...centerInfo, operatingLicense: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Academic & System Rules */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Academic & Enrollment Policy
                </h2>
                <p className="text-xs text-slate-400">
                  Course grading systems, class sizes, and student attendance threshold
                </p>
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
                  onClick={() => setAutoApproveEnrollment(!autoApproveEnrollment)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    autoApproveEnrollment ? 'bg-[#0052CC]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      autoApproveEnrollment ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Chính sách mã hóa mật khẩu bắt buộc (BCrypt Immutability)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Backend tự sinh mật khẩu có muối mã hóa an toàn khi quản trị viên tạo tài khoản Mentor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireBcrypt(!requireBcrypt)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    requireBcrypt ? 'bg-[#0052CC]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      requireBcrypt ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT 1 COL: Category Donut & Audit Logs ================= */}
        <div className="space-y-6">
          {/* Donut Chart: Course Categories (Matching 5.webp) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0052CC]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Course Category Share
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">40 Courses</span>
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
                  {/* Slices */}
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
                  <p className="text-xl font-black text-slate-900 tracking-tight">100%</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Syllabus</p>
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

          {/* Audit & Activity Logs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Recent Security Logs
              </h3>
            </div>

            <div className="space-y-3">
              {[
                {
                  action: 'Created Mentor account',
                  user: 'admin@englishcenter.com',
                  detail: 'Role MENTOR assigned with BCrypt hash',
                  time: '10 mins ago',
                },
                {
                  action: 'Updated Course Catalog',
                  user: 'admin@englishcenter.com',
                  detail: 'Published IELTS Intensive 7.5+',
                  time: '1 hour ago',
                },
                {
                  action: 'Role Immutability Guard',
                  user: 'Security System',
                  detail: 'Blocked role elevation attempt',
                  time: '3 hours ago',
                },
                {
                  action: 'System Backup Complete',
                  user: 'Automated Worker',
                  detail: 'Database snapshot verified',
                  time: '12 hours ago',
                },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{log.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
