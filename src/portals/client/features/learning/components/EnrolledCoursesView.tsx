import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { fetchMyEnrollments, paymentKeys } from '@/shared/api/paymentService';
import { EmptyState, ErrorState, Pagination, SkeletonCourseCard } from '@/shared/components/Feedback';
import { paymentDate, paymentError } from '@/shared/utils/payment';

export function EnrolledCoursesView() {
  const userId = useAuthStore(s => s.user?.id ?? '');
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const courses = useQuery({ queryKey: paymentKeys.myCourses(userId, page), queryFn: ({ signal }) => fetchMyEnrollments(page, signal), enabled: Boolean(userId), staleTime: 0, refetchOnWindowFocus: true });
  return <section className="max-w-7xl mx-auto px-4 py-8 space-y-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-blue-700 uppercase font-bold">Không gian học tập</p><h1 className="text-3xl text-slate-900 font-extrabold mt-2">Khóa học của tôi</h1><p className="text-sm text-slate-500 mt-2">{courses.data ? `${courses.data.totalElements} khóa học đang có quyền truy cập.` : 'Các khóa học bạn đã đăng ký.'}</p></div><Link className="text-sm text-blue-700 font-bold self-center" to="/payments">Đơn hàng & thanh toán →</Link></div>
    {courses.isPending ? <div className="grid md:grid-cols-3 gap-5">{[1,2,3].map(i => <SkeletonCourseCard key={i} />)}</div> : courses.isError ? <ErrorState message={paymentError(courses.error)} onRetry={() => void courses.refetch()} /> : courses.data?.data.length ? <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{courses.data.data.map(item => <article key={item.enrollmentId} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"><div className="aspect-video bg-blue-50 flex items-center justify-center">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.courseTitle} className="w-full h-full object-cover" /> : <BookOpen className="w-12 h-12 text-blue-400" />}</div><div className="p-5 space-y-4"><h2 className="font-bold text-lg text-slate-900">{item.courseTitle}</h2><p className="text-xs text-slate-500">Đăng ký: {paymentDate(item.enrolledDate)}</p><span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 text-xs px-3 py-1 font-bold">Đã mở khóa</span><div className="flex items-center justify-between border-t border-slate-100 pt-4"><Link to={`/courses/${item.courseId}`} className="text-sm text-slate-500">Chi tiết</Link><Link to={`/my-courses/${item.courseId}/learn`} className="inline-flex gap-2 items-center text-blue-700 font-bold text-sm">Vào học <ArrowRight className="w-4 h-4" /></Link></div></div></article>)}</div><Pagination currentPage={courses.data.currentPage} totalPages={courses.data.totalPages} onChange={setPage} />
    </> : <EmptyState title="Bạn chưa đăng ký khóa học nào" description="Sau khi thanh toán được xác nhận, khóa học sẽ xuất hiện tại đây." actionLabel="Khám phá khóa học" onAction={() => navigate('/courses')} />}
  </section>;
}
