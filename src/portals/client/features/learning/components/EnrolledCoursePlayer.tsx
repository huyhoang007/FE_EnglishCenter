import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Lock, PlayCircle } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { fetchEnrollmentStatus, paymentKeys } from '@/shared/api/paymentService';
import { fetchCourseById, fetchCourseContents, resolveCourseId } from '@/shared/api/courseService';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { courseVideo, paymentError } from '@/shared/utils/payment';

export function EnrolledCoursePlayer() {
  const { slug } = useParams<{ slug: string }>();
  const userId = useAuthStore(s => s.user?.id ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resolved = useQuery({ queryKey: ['catalog', 'resolve', slug], queryFn: () => resolveCourseId(slug), enabled: Boolean(slug) });
  const courseId = resolved.data ?? '';
  const enrollment = useQuery({ queryKey: paymentKeys.enrollment(userId, courseId), queryFn: ({ signal }) => fetchEnrollmentStatus(courseId, signal), enabled: Boolean(userId && courseId), staleTime: 0 });
  const course = useQuery({ queryKey: ['catalog', 'course', courseId], queryFn: () => fetchCourseById(courseId), enabled: Boolean(courseId) });
  const contents = useQuery({ queryKey: ['catalog', 'contents', courseId, userId], queryFn: () => fetchCourseContents(courseId), enabled: Boolean(courseId && enrollment.data?.enrolled), staleTime: 0 });
  const failure = resolved.error || course.error || enrollment.error || contents.error;
  const lessons = contents.data?.filter(item => item.contentType === 'lesson') ?? [];
  const selected = lessons.find(item => item.contentId === selectedId) ?? lessons.find(item => !item.isLocked) ?? lessons[0];
  const video = selected && !selected.isLocked ? courseVideo(selected.videoUrl) : null;
  if (failure) return <div className="max-w-5xl mx-auto px-4 py-8"><ErrorState message={paymentError(failure)} onRetry={() => { void resolved.refetch(); void course.refetch(); void enrollment.refetch(); if (enrollment.data?.enrolled) void contents.refetch(); }} /></div>;
  if (resolved.isPending) return <div className="max-w-6xl mx-auto px-4 py-8"><Skeleton className="h-96" /></div>;
  if (!courseId) return <EmptyState title="Không tìm thấy khóa học" />;
  if (course.isPending || enrollment.isPending) return <div className="max-w-6xl mx-auto px-4 py-8"><Skeleton className="h-96" /></div>;
  if (!enrollment.data?.enrolled) return <section className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4"><Lock className="mx-auto w-10 h-10 text-slate-400" /><h1 className="text-2xl font-extrabold">Khóa học chưa được mở</h1><p className="text-slate-500">Bạn cần có đăng ký đang hoạt động để vào phòng học.</p><Link to={`/courses/${courseId}`} className="inline-flex bg-blue-700 text-white rounded-xl px-5 py-3 font-bold">Xem khóa học & đăng ký</Link></section>;
  return <section className="max-w-7xl mx-auto px-4 py-8 space-y-5"><div><Link to="/my-courses" className="text-sm font-bold text-blue-700">← Khóa học của tôi</Link><h1 className="font-extrabold text-2xl text-slate-900 mt-3">{course.data?.title}</h1></div><div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
    <main className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="aspect-video bg-slate-950 flex items-center justify-center text-slate-300">{contents.isPending ? <span>Đang tải bài học…</span> : video ? video.embed ? <iframe key={selected?.contentId} src={video.url} title={selected?.title} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <video key={selected?.contentId} src={video.url} controls preload="metadata" className="w-full h-full" aria-label={selected?.title} /> : <div className="text-center px-6"><BookOpen className="w-10 h-10 mx-auto mb-3" /><p>{selected?.isLocked ? 'Bạn chưa có quyền xem bài này.' : 'Bài học chưa có video để phát.'}</p></div>}</div><div className="p-6"><h2 className="font-bold text-xl">{selected?.title || 'Chọn bài học'}</h2>{selected?.description && <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">{selected.description}</p>}<Link to={`/courses/${courseId}`} className="text-blue-700 text-sm font-bold inline-flex mt-5">Xem từ vựng & bài tập của khóa học →</Link></div></main>
    <aside className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><h2 className="p-5 border-b border-slate-100 font-bold">Nội dung khóa học · {lessons.length} bài</h2>{lessons.length ? <ol className="max-h-[65vh] overflow-y-auto">{lessons.map((lesson, index) => <li key={lesson.contentId}><button type="button" onClick={() => setSelectedId(lesson.contentId)} disabled={lesson.isLocked} aria-current={selected?.contentId === lesson.contentId ? 'step' : undefined} className={`w-full p-4 text-left flex gap-3 border-b border-slate-100 disabled:opacity-50 ${selected?.contentId === lesson.contentId ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50'}`}>{lesson.isLocked ? <Lock className="w-4 h-4 shrink-0 mt-1" /> : <PlayCircle className="w-4 h-4 shrink-0 mt-1" />}<span className="text-sm font-semibold">{index + 1}. {lesson.title}</span></button></li>)}</ol> : <p className="p-5 text-sm text-slate-500">Khóa học đang được bổ sung bài học.</p>}</aside>
  </div></section>;
}
