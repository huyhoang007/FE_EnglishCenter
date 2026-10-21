/**
 * CourseManagementView — English Center Course Catalog & Academic Curriculum
 * Converted to match the reference UI (7.webp & 9.webp)
 */

import React, { useState } from 'react';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  BookOpen,
  Users,
  Award,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  RotateCcw,
  LayoutGrid,
  List,
  Edit2,
  Eye,
  Trash2,
  DollarSign,
  GraduationCap,
  Calendar,
  Layers,
  X,
  TrendingUp,
} from 'lucide-react';

interface CourseItem {
  id: string;
  code: string;
  title: string;
  certificate: 'IELTS' | 'TOEIC' | 'VSTEP' | 'GENERAL';
  level: string;
  mentorName: string;
  enrolledStudents: number;
  durationWeeks: number;
  totalLessons: number;
  price: string;
  status: 'published' | 'draft' | 'archived';
  rating: number;
  bannerGradient: string;
}

const COURSES_DATA: CourseItem[] = [
  {
    id: 'c1',
    code: 'IELTS-75-INT',
    title: 'IELTS Intensive Mastery 7.5+',
    certificate: 'IELTS',
    level: 'Advanced',
    mentorName: 'ThS. Nguyễn Hoàng Nam',
    enrolledStudents: 1842,
    durationWeeks: 12,
    totalLessons: 48,
    price: '4,500,000 VND',
    status: 'published',
    rating: 4.9,
    bannerGradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'c2',
    code: 'TOEIC-800-4S',
    title: 'TOEIC 4-Skills Masterclass 800+',
    certificate: 'TOEIC',
    level: 'Upper-Intermediate',
    mentorName: 'Cô Lê Mai Phương (TESOL)',
    enrolledStudents: 932,
    durationWeeks: 10,
    totalLessons: 40,
    price: '3,200,000 VND',
    status: 'published',
    rating: 4.8,
    bannerGradient: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'c3',
    code: 'VSTEP-C1-PATH',
    title: 'VSTEP B2 — C1 Pathway',
    certificate: 'VSTEP',
    level: 'Academic',
    mentorName: 'TS. Trần Văn Minh',
    enrolledStudents: 412,
    durationWeeks: 8,
    totalLessons: 32,
    price: '2,900,000 VND',
    status: 'published',
    rating: 4.7,
    bannerGradient: 'from-amber-600 to-orange-700',
  },
  {
    id: 'c4',
    code: 'IELTS-SW-LAB',
    title: 'IELTS Speaking & Writing Lab',
    certificate: 'IELTS',
    level: 'Specialized 1-on-1',
    mentorName: 'ThS. Phạm Quỳnh Trang',
    enrolledStudents: 320,
    durationWeeks: 6,
    totalLessons: 24,
    price: '5,200,000 VND',
    status: 'published',
    rating: 5.0,
    bannerGradient: 'from-purple-600 to-pink-700',
  },
  {
    id: 'c5',
    code: 'ENG-COM-PRO',
    title: 'Business Communication in English',
    certificate: 'GENERAL',
    level: 'Intermediate',
    mentorName: 'ThS. David Miller',
    enrolledStudents: 210,
    durationWeeks: 8,
    totalLessons: 28,
    price: '2,800,000 VND',
    status: 'published',
    rating: 4.6,
    bannerGradient: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'c6',
    code: 'IELTS-FOU-60',
    title: 'IELTS Foundation Band 5.0 - 6.5',
    certificate: 'IELTS',
    level: 'Intermediate',
    mentorName: 'Thầy Bùi Gia Huy',
    enrolledStudents: 540,
    durationWeeks: 14,
    totalLessons: 56,
    price: '3,800,000 VND',
    status: 'draft',
    rating: 0,
    bannerGradient: 'from-slate-600 to-slate-800',
  },
];

export const CourseManagementView: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // New course form
  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    certificate: 'IELTS' as const,
    level: 'Advanced',
    mentorName: '',
    durationWeeks: 10,
    totalLessons: 40,
    price: '3,500,000 VND',
  });

  const courses = COURSES_DATA.filter((c) => {
    const matchKeyword =
      !keyword ||
      c.title.toLowerCase().includes(keyword.toLowerCase()) ||
      c.code.toLowerCase().includes(keyword.toLowerCase()) ||
      c.mentorName.toLowerCase().includes(keyword.toLowerCase());

    const matchCert = !certFilter || c.certificate === certFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;

    return matchKeyword && matchCert && matchStatus;
  });

  const handleResetFilters = () => {
    setKeyword('');
    setCertFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. STATS ROW (Matching 7.webp / 9.webp) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Courses"
          value="24"
          subtext="+3 new this term"
          icon={BookOpen}
          colorScheme="blue"
          trendPoints={[16, 18, 19, 21, 21, 22, 23, 24]}
        />
        <StatCard
          title="Active Batches"
          value="42"
          subtext="Ongoing classes"
          icon={CheckCircle2}
          colorScheme="emerald"
          trendPoints={[25, 28, 30, 34, 37, 39, 40, 42]}
        />
        <StatCard
          title="Total Enrolled"
          value="3,186"
          subtext="Active learners"
          icon={Users}
          colorScheme="purple"
          trendPoints={[1800, 2100, 2400, 2700, 2900, 3050, 3120, 3186]}
        />
        <StatCard
          title="Avg Pass Rate"
          value="96.5%"
          subtext="Target score reached"
          icon={Award}
          colorScheme="cyan"
          trendPoints={[92, 93, 94, 94, 95, 95, 96, 96.5]}
        />
        <StatCard
          title="Draft / In-Review"
          value="2"
          subtext="Pending launch"
          icon={Clock}
          colorScheme="amber"
          trendPoints={[4, 5, 3, 2, 4, 3, 2, 2]}
        />
      </div>

      {/* ================= 2. TITLE BAR & ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Course Catalog & Curricula
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage syllabus, certification programs, pricing, and active classes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-2xs text-[#0052CC]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white shadow-2xs text-[#0052CC]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsNewCourseOpen(true)}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            Create Course
          </Button>
        </div>
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
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search courses by title, course code, mentor..."
              className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Certificate Filter */}
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Certificates</option>
            <option value="IELTS">IELTS</option>
            <option value="TOEIC">TOEIC</option>
            <option value="VSTEP">VSTEP</option>
            <option value="GENERAL">General English</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
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

      {/* ================= 4. CONTENT (GRID OR TABLE) ================= */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Card Banner */}
              <div
                className={`h-24 bg-gradient-to-r ${c.bannerGradient} p-4 flex items-start justify-between text-white relative`}
              >
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md font-extrabold text-[10px] uppercase tracking-wider">
                    {c.certificate}
                  </span>
                  <p className="text-[11px] font-mono opacity-80 mt-1">{c.code}</p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'published'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-white'
                  }`}
                >
                  {c.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0052CC] transition-colors leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.mentorName}</span>
                  </p>
                </div>

                {/* Course Metadata Grid */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-center">
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Students</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {c.enrolledStudents.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Duration</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {c.durationWeeks} wks
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Lessons</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {c.totalLessons} sess
                    </p>
                  </div>
                </div>

                {/* Footer Price & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Tuition Fee</p>
                    <p className="text-sm font-black text-[#0052CC]">{c.price}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(c)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                  </th>
                  <th className="py-3.5 px-3 font-bold">Course Title</th>
                  <th className="py-3.5 px-3 font-bold">Code</th>
                  <th className="py-3.5 px-3 font-bold">Certificate</th>
                  <th className="py-3.5 px-3 font-bold">Lead Mentor</th>
                  <th className="py-3.5 px-3 font-bold">Enrolled</th>
                  <th className="py-3.5 px-3 font-bold">Tuition Fee</th>
                  <th className="py-3.5 px-3 font-bold">Status</th>
                  <th className="py-3.5 pr-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-4 pr-2">
                      <input type="checkbox" className="rounded border-slate-300 text-[#0052CC]" />
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{c.title}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{c.code}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] font-bold text-[10px] border border-blue-100">
                        {c.certificate}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{c.mentorName}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {c.enrolledStudents.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#0052CC]">{c.price}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCourse(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
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
        </div>
      )}

      {/* ================= MODAL: COURSE DETAILS ================= */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Course Syllabus & Details</h3>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
                {selectedCourse.certificate} PROGRAM
              </span>
              <h4 className="font-extrabold text-slate-900 text-base">
                {selectedCourse.title}
              </h4>
              <p className="text-xs text-slate-500">Giảng viên phụ trách: {selectedCourse.mentorName}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Mã khóa học</dt>
                <dd className="font-mono font-bold text-slate-800 mt-1">{selectedCourse.code}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Học phí trọn khóa</dt>
                <dd className="font-bold text-[#0052CC] mt-1">{selectedCourse.price}</dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Thời lượng</dt>
                <dd className="font-bold text-slate-800 mt-1">
                  {selectedCourse.durationWeeks} tuần ({selectedCourse.totalLessons} buổi học)
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <dt className="text-slate-400 font-semibold uppercase">Học viên đã ghi danh</dt>
                <dd className="font-bold text-emerald-600 mt-1">
                  {selectedCourse.enrolledStudents.toLocaleString()} học viên
                </dd>
              </div>
            </dl>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setSelectedCourse(null)}
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE COURSE ================= */}
      {isNewCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Tạo khóa học mới</h3>
                  <p className="text-xs text-slate-500">Thiết lập chương trình đào tạo & học phí</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCourseOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsNewCourseOpen(false);
                alert(`Đã tạo khóa học ${newCourseForm.title} thành công!`);
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên khóa học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseForm.title}
                    onChange={(e) =>
                      setNewCourseForm({ ...newCourseForm, title: e.target.value })
                    }
                    placeholder="VD: IELTS Masterclass 8.0+"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Chứng chỉ
                    </label>
                    <select
                      value={newCourseForm.certificate}
                      onChange={(e) =>
                        setNewCourseForm({
                          ...newCourseForm,
                          certificate: e.target.value as any,
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] bg-white"
                    >
                      <option value="IELTS">IELTS</option>
                      <option value="TOEIC">TOEIC</option>
                      <option value="VSTEP">VSTEP</option>
                      <option value="GENERAL">General English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Học phí (VND)
                    </label>
                    <input
                      type="text"
                      value={newCourseForm.price}
                      onChange={(e) =>
                        setNewCourseForm({ ...newCourseForm, price: e.target.value })
                      }
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
                  onClick={() => setIsNewCourseOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
                >
                  Tạo khóa học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagementView;
