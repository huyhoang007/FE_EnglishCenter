import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  Search,
  Award,
  Building,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getMentors } from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export const MentorDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const specialization = searchParams.get('specialization') ?? '';
  const page = Number(searchParams.get('page') ?? 0);

  const [inputVal, setInputVal] = useState(specialization);

  const query = useQuery({
    queryKey: QUERY_KEYS.mentor.directory({ specialization, page }),
    queryFn: () =>
      getMentors({
        specialization: specialization || undefined,
        page,
        size: 9,
      }),
  });

  const mentors = query.data?.data ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(inputVal ? { specialization: inputVal, page: '0' } : {});
  };

  const handleReset = () => {
    setInputVal('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Đội ngũ Giảng viên & Chuyên gia
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Find Your Expert English Mentor
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Kết nối 1-kèm-1 với các giảng viên hàng đầu đạt chứng chỉ IELTS 8.0+, TOEIC 990,
            chuyên gia phát âm và luyện thi học thuật được xác thực bởi PrepMaster.
          </p>
        </div>
      </div>

      {/* Filter / Search Card */}
      <Card className="!p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="specialization"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Tìm theo chuyên môn: IELTS, Speaking, TOEIC, Writing Task 2..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 sm:flex-initial"
            >
              Tìm kiếm
            </Button>
            {specialization && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleReset}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </form>

        {specialization && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>
              Đang lọc theo chuyên môn: <strong className="text-slate-800">"{specialization}"</strong>
            </span>
          </div>
        )}
      </Card>

      {/* Status states */}
      {query.isLoading && (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 mx-auto border-3 border-[#0052CC] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Đang tải danh sách mentor...</p>
        </div>
      )}

      {query.isError && (
        <Card className="text-center py-12">
          <p className="text-rose-600 font-semibold mb-2">Không thể tải dữ liệu giảng viên.</p>
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        </Card>
      )}

      {!query.isLoading && !query.isError && mentors.length === 0 && (
        <Card className="text-center py-16">
          <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy mentor phù hợp</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Hãy thử tìm kiếm với từ khóa khác như "IELTS", "Speaking" hoặc nhấn "Xóa bộ lọc".
          </p>
          {specialization && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={handleReset}>
              Xem tất cả mentor
            </Button>
          )}
        </Card>
      )}

      {/* Mentor Cards Grid */}
      {mentors.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor) => (
            <Card
              key={mentor.userId}
              hoverable
              className="flex flex-col justify-between transition-all duration-200 border-slate-200/80 hover:border-blue-200"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={
                      mentor.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mentor.email)}`
                    }
                    alt={mentor.fullName}
                    className="h-16 w-16 rounded-2xl bg-blue-50 object-cover shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-extrabold text-slate-900 text-base truncate">
                      {mentor.fullName}
                    </h2>
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#0052CC] text-xs font-bold">
                      <Award className="w-3 h-3" />
                      {mentor.specialization}
                    </span>
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {mentor.department}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {mentor.biography ||
                    'Giảng viên chuyên môn cao, nhiều năm kinh nghiệm hướng dẫn học viên chinh phục các mục tiêu tiếng Anh học thuật và giao tiếp.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Học phí / giờ
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {mentor.hourlyRate?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <Link
                  to={`/mentors/${mentor.userId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:text-[#0040A8] transition-colors"
                >
                  Xem hồ sơ <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0}
            onClick={() =>
              setSearchParams({
                ...(specialization ? { specialization } : {}),
                page: String(page - 1),
              })
            }
          >
            Trang trước
          </Button>

          <span className="text-xs font-semibold text-slate-600 px-2">
            Trang {page + 1} / {query.data?.totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={page + 1 >= (query.data?.totalPages ?? 0)}
            onClick={() =>
              setSearchParams({
                ...(specialization ? { specialization } : {}),
                page: String(page + 1),
              })
            }
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
};

export default MentorDirectoryPage;
