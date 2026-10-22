/**
 * CoursePlayerView — Giao diện Phòng học (LearnSphere E-learning Player)
 * -----------------------------------------------------------
 * Bố cục 2 cột chuyên sâu:
 *   - Topbar: Nút "Quay lại Khóa học của tôi" (Back to My Courses) + Thống kê dạng Pills
 *   - Cột Trái (~30% Sidebar): Chuyển đổi khóa học + Thanh tiến độ + Danh sách Chapters/Lessons
 *     (Bài học đang học có màu nền nhạt #EFF6FF / border #BFDBFE / chữ #0052CC)
 *   - Cột Phải (~70% Main Area):
 *       + Video Player lớn 16:9 đầy đủ controls (timeline, speed, volume, play/pause)
 *       + Thanh thông tin: Tên bài hiện tại + Giảng viên + Nút "Bài tiếp theo"
 *       + Các Tab: Ghi chú (Notes với ô nhập theo timestamp), Tổng quan (Overview), Hỏi đáp (Q&A)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Gauge,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileText,
  Download,
  Trash2,
  Send,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import {
  MOCK_ENROLLED_COURSES,
  MOCK_LEARNING_STATS,
  getStudyLesson,
} from '@/mocks';
import type { Lesson, CourseSection } from '@/shared/types';

/* ============================================================
 *  Types nội bộ cho Ghi chú & Hỏi đáp
 * ============================================================ */
interface NoteItem {
  id: string;
  timestamp: string;
  timeSeconds: number;
  content: string;
  createdAt: string;
}

interface QAItem {
  id: string;
  author: string;
  avatar: string;
  question: string;
  timeAgo: string;
  answer?: {
    author: string;
    avatar: string;
    content: string;
    timeAgo: string;
  };
}

const SPEEDS = [1.0, 1.25, 1.5] as const;
type PlaybackSpeed = (typeof SPEEDS)[number];

/* ============================================================
 *  Component: CoursePlayerView (Player Room)
 * ============================================================ */
export const CoursePlayerView: React.FC = () => {
  const navigate = useNavigate();
  const { slug, courseId } = useParams<{ slug?: string; courseId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTarget = slug || courseId;

  // 1. Xác định khóa học theo URL param (slug hoặc id)
  const currentEnrolled = useMemo(() => {
    if (!paramTarget) return MOCK_ENROLLED_COURSES[1]; // Mặc định TOEIC
    return (
      MOCK_ENROLLED_COURSES.find(
        (ec) =>
          ec.course.slug === paramTarget ||
          ec.course.id === paramTarget,
      ) ?? MOCK_ENROLLED_COURSES[0]
    );
  }, [paramTarget]);

  const { course, progress, mentor } = currentEnrolled;

  // 2. Bài học hiện tại
  const requestedLessonId = searchParams.get('lesson');
  const [activeLessonId, setActiveLessonId] = useState<string>(
    requestedLessonId ||
      progress.currentLessonId ||
      course.curriculum[0]?.lessons[0]?.id ||
      '',
  );

  // Đồng bộ URL param khi activeLessonId thay đổi
  useEffect(() => {
    if (requestedLessonId) {
      setActiveLessonId(requestedLessonId);
    } else {
      setActiveLessonId(
        progress.currentLessonId || course.curriculum[0]?.lessons[0]?.id || '',
      );
    }
  }, [course, progress.currentLessonId, requestedLessonId]);

  // Chi tiết bài học
  const studyData = useMemo(() => {
    return getStudyLesson(activeLessonId);
  }, [activeLessonId]);

  // Tất cả bài học trong khóa
  const allLessons = useMemo(() => {
    return course.curriculum.flatMap((s) => s.lessons);
  }, [course]);

  // Bài học tiếp theo (Next Lesson)
  const nextLesson = useMemo(() => {
    const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }
    return null;
  }, [allLessons, activeLessonId]);

  const handleNextLesson = () => {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
      setSearchParams({ lesson: nextLesson.id }, { replace: true });
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setSearchParams({ lesson: lessonId }, { replace: true });
  };

  const handleSwitchCourse = (newCourseSlug: string) => {
    navigate(`/my-courses/${newCourseSlug}/learn`);
  };

  // 3. State Player Video
  const durationSeconds = (studyData?.lesson.durationMinutes ?? 24) * 60;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [currentPlayTime, setCurrentPlayTime] = useState<number>(255); // 04:15

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentPlayTime((prev) => {
        if (prev >= durationSeconds) {
          setPlaying(false);
          return durationSeconds;
        }
        return prev + speed;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, speed, durationSeconds]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 4. Tabs: Overview | Notes | QA
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'qa'>('notes');

  // 5. Ghi chú (Notes)
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'note-1',
      timestamp: '02:18',
      timeSeconds: 138,
      content:
        'Cẩn thận các câu hỏi bắt đầu bằng "Why don\'t you..." thường là lời gợi ý (suggestion) chứ không phải câu hỏi lý do thông thường.',
      createdAt: 'Hôm nay, 14:20',
    },
    {
      id: 'note-2',
      timestamp: '08:45',
      timeSeconds: 525,
      content:
        'Chiến thuật loại trừ: Các đáp án lặp lại từ cùng âm (same-sounding words) với câu hỏi trong Part 2 có đến 85% khả năng là bẫy.',
      createdAt: 'Hôm qua',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      timestamp: formatTime(currentPlayTime),
      timeSeconds: Math.floor(currentPlayTime),
      content: newNoteText.trim(),
      createdAt: 'Vừa xong',
    };
    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  // 6. Hỏi đáp (Q&A)
  const [qaList, setQaList] = useState<QAItem[]>([
    {
      id: 'qa-1',
      author: 'Trần Minh Đức',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=duc&backgroundColor=e2e8f0',
      question:
        'Thưa cô, trong Part 2 nếu người nói dùng thì Hiện tại hoàn thành thì câu trả lời có bắt buộc phải cùng thì không ạ?',
      timeAgo: '2 giờ trước',
      answer: {
        author: mentor.fullName,
        avatar: mentor.avatarUrl,
        content:
          'Chào em, không bắt buộc em nhé! Trong giao tiếp thực tế, người ta hoàn toàn có thể trả lời bằng thì Quá khứ đơn hoặc Hiện tại đơn tùy vào ngữ cảnh. Em chú ý nghe ý nghĩa tổng thể thay vì chỉ bám vào thì nhé!',
        timeAgo: '1 giờ trước',
      },
    },
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQA: QAItem = {
      id: `qa-${Date.now()}`,
      author: 'Nguyễn Thị Tiên (Bạn)',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tien&backgroundColor=dbeafe',
      question: newQuestionText.trim(),
      timeAgo: 'Vừa xong',
    };
    setQaList([newQA, ...qaList]);
    setNewQuestionText('');
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* ============================================================
       *  TOPBAR: Nút "Quay lại" + Tiêu đề + Dải Pills thống kê
       * ============================================================ */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/my-courses')}
            className="rounded-full text-xs font-bold text-slate-700 hover:text-[#0052CC] hover:bg-blue-50 border border-slate-200"
          >
            Khóa học của tôi
          </Button>
          <div className="h-4 w-px bg-slate-300" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0052CC]">
                Phòng học trực tuyến
              </span>
              <Badge variant="primary" size="sm">
                {course.certificate}
              </Badge>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Dải thông số dạng Pills nhỏ gọn */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Khóa học: <strong className="text-slate-900 font-bold">{MOCK_LEARNING_STATS.inProgressCourses}</strong></span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Đã học: <strong className="text-slate-900 font-bold">{MOCK_LEARNING_STATS.studiedHours}h</strong></span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Bài tập: <strong className="text-amber-900 font-bold">{MOCK_LEARNING_STATS.pendingHomeworks}</strong></span>
            <span className="px-1 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-200/80 text-amber-900">
              Cảnh báo
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================
       *  BỐ CỤC 2 CỘT: Cột Trái (~30% Sidebar) & Cột Phải (~70% Main)
       * ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

        {/* ============================================================
         *  CỘT TRÁI (~30% SIDEBAR): Khóa học & Mục lục bài học
         * ============================================================ */}
        <aside className="space-y-4">
          <Card className="rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-5">
            {/* 1. Đổi khóa học */}
            <div>
              <label
                htmlFor="course-switch"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2"
              >
                Khóa học hiện tại
              </label>
              <select
                id="course-switch"
                value={course.slug}
                onChange={(e) => handleSwitchCourse(e.target.value)}
                className="w-full h-11 px-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] cursor-pointer truncate"
              >
                {MOCK_ENROLLED_COURSES.map((ec) => (
                  <option key={ec.course.id} value={ec.course.slug}>
                    [{ec.course.certificate}] {ec.course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Thanh tiến độ tổng quan */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-600 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0052CC]" />
                  Tiến độ khóa học
                </span>
                <span className="font-extrabold text-[#0052CC] text-sm tabular-nums">
                  {progress.percent}%
                </span>
              </div>
              <div
                className="h-2.5 rounded-full bg-slate-200 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-[#0052CC] rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-semibold">
                Đã học {progress.completedLessonIds.length} / {allLessons.length} bài
              </p>
            </div>

            {/* 3. Danh sách Chapters & Lessons */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Mục lục bài học
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {course.curriculum.length} chương
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {course.curriculum.map((section: CourseSection) => (
                  <div key={section.id} className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-2 py-1">
                      Chương {section.order}: {section.title}
                    </p>

                    <div className="space-y-1">
                      {section.lessons.map((lesson: Lesson) => {
                        const isActive = lesson.id === activeLessonId;
                        const isDone = progress.completedLessonIds.includes(lesson.id);
                        const isLocked = lesson.status === 'LOCKED' && !isActive;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            disabled={isLocked}
                            onClick={() => {
                              if (!isLocked) {
                                handleSelectLesson(lesson.id);
                              }
                            }}
                            className={cn(
                              'w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl transition-all',
                              isActive
                                ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#0052CC] shadow-xs'
                                : isLocked
                                  ? 'opacity-50 cursor-not-allowed bg-transparent text-slate-400'
                                  : 'hover:bg-slate-50 text-slate-700 border border-transparent',
                            )}
                          >
                            <div
                              className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                                isActive
                                  ? 'bg-[#0052CC] text-white'
                                  : isDone
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                    : isLocked
                                      ? 'bg-slate-100 text-slate-400'
                                      : 'bg-slate-100 text-slate-600',
                              )}
                            >
                              {isActive ? (
                                <Play className="w-3.5 h-3.5 fill-white" />
                              ) : isDone ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isLocked ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                String(lesson.order).padStart(2, '0')
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  'text-xs truncate leading-snug',
                                  isActive
                                    ? 'font-extrabold text-[#0052CC]'
                                    : 'font-semibold text-slate-800',
                                )}
                              >
                                Bài {String(lesson.order).padStart(2, '0')}: {lesson.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{lesson.durationMinutes} phút</span>
                                {isActive && (
                                  <span className="font-bold text-[#0052CC]">· Đang học</span>
                                )}
                              </p>
                            </div>

                            {isActive && (
                              <ChevronRight className="w-4 h-4 text-[#0052CC] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Giảng viên phụ trách */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={mentor.avatarUrl}
                  alt={mentor.fullName}
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Giảng viên
                  </p>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {mentor.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {mentor.title}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-[#0052CC] hover:bg-blue-50"
                onClick={() => navigate('/mentors')}
              >
                Hồ sơ
              </Button>
            </div>
          </Card>
        </aside>

        {/* ============================================================
         *  CỘT PHẢI (~70% MAIN AREA): Video + Tên bài + Tabs
         * ============================================================ */}
        <main className="space-y-5 min-w-0">

          {/* 1. KHUNG PHÁT VIDEO (VIDEO PLAYER) LỚN */}
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 shadow-md border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-[#071330] via-[#0C1E4A] to-[#0052CC]/30 flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setPlaying(!playing)}
                  className="w-20 h-20 rounded-full bg-[#0052CC] hover:bg-[#0747A6] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 border-4 border-white/20"
                  aria-label={playing ? 'Tạm dừng video' : 'Phát video'}
                >
                  {playing ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white translate-x-0.5" />
                  )}
                </button>
                <p className="mt-4 text-white font-extrabold text-sm sm:text-base tracking-wide">
                  {studyData?.lesson.title ?? 'Video Bài Giảng'}
                </p>
                <p className="text-blue-200/80 text-xs mt-1">
                  Khóa học: {course.title} · Chuẩn HD 1080p
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 space-y-2">
              <div
                className="relative h-1.5 w-full bg-white/20 hover:h-2.5 rounded-full cursor-pointer transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setCurrentPlayTime(pct * durationSeconds);
                }}
              >
                <div
                  className="h-full bg-[#0052CC] rounded-full relative"
                  style={{ width: `${(currentPlayTime / durationSeconds) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md" />
                </div>
              </div>

              <div className="flex items-center justify-between text-white text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPlaying(!playing)}
                    className="p-1 hover:text-blue-300 transition-colors"
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMuted(!muted)}
                    className="p-1 hover:text-blue-300 transition-colors"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-[11px] text-slate-300">
                    {formatTime(currentPlayTime)} / {formatTime(durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md text-[11px]">
                    <Gauge className="w-3.5 h-3.5" />
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeed(s)}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors',
                          speed === s ? 'bg-[#0052CC] text-white' : 'text-slate-300 hover:text-white',
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="p-1.5 hover:text-blue-300 transition-colors"
                    title="Toàn màn hình"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. THANH THÔNG TIN BÀI HỌC VÀ NÚT 'BÀI TIẾP THEO' */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {course.certificate}
                </Badge>
                <span className="text-[11px] font-bold text-slate-500">
                  Thời lượng: {studyData?.lesson.durationMinutes ?? 24} phút
                </span>
              </div>
              <h2 className="mt-1.5 text-lg sm:text-xl font-extrabold text-slate-900 leading-snug line-clamp-2">
                Bài {studyData?.lesson.order ?? 2}: {studyData?.lesson.title ?? 'Đang tải nội dung...'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Giảng viên: <strong className="text-slate-700">{mentor.fullName}</strong> ({mentor.title})
              </p>
            </div>

            {/* Nút 'Bài tiếp theo' */}
            <Button
              variant="primary"
              size="md"
              rightIcon={ArrowRight}
              disabled={!nextLesson}
              onClick={handleNextLesson}
              className={cn(
                'rounded-full px-6 py-2.5 font-bold shrink-0 self-start sm:self-center',
                'bg-[#0052CC] hover:bg-[#0747A6] text-white shadow-md hover:shadow-lg transition-all',
              )}
            >
              Bài tiếp theo
            </Button>
          </div>

          {/* 3. CÁC TAB CHỨC NĂNG (OVERVIEW, NOTES, Q&A) */}
          <Card noPadding className="rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/70 px-4">
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={cn(
                  'relative py-3.5 px-4 text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                  activeTab === 'notes'
                    ? 'text-[#0052CC]'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <FileText className="w-4 h-4" />
                Ghi chú (Notes)
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-[#0052CC] font-bold">
                  {notes.length}
                </span>
                {activeTab === 'notes' && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0052CC]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={cn(
                  'relative py-3.5 px-4 text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                  activeTab === 'overview'
                    ? 'text-[#0052CC]'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <BookOpen className="w-4 h-4" />
                Tổng quan (Overview)
                {activeTab === 'overview' && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0052CC]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qa')}
                className={cn(
                  'relative py-3.5 px-4 text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                  activeTab === 'qa'
                    ? 'text-[#0052CC]'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Hỏi đáp (Q&A)
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                  {qaList.length}
                </span>
                {activeTab === 'qa' && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0052CC]" />
                )}
              </button>
            </div>

            <div className="p-6">
              {/* TAB 1: GHI CHÚ */}
              {activeTab === 'notes' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 focus-within:bg-white focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-[#0052CC]/10 transition-all">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Ghi lại kiến thức quan trọng hoặc từ vựng mới tại thời điểm này..."
                      rows={3}
                      className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        Tại {formatTime(currentPlayTime)}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!newNoteText.trim()}
                        onClick={handleAddNote}
                        className="rounded-xl px-4 font-bold bg-[#0052CC] text-white"
                      >
                        Lưu ghi chú
                      </Button>
                    </div>
                  </div>

                  {/* Danh sách ghi chú */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Ghi chú của bạn ({notes.length})
                    </p>
                    {notes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        Bạn chưa có ghi chú nào cho bài học này. Hãy ghi chép lại những điểm cần nhớ nhé!
                      </p>
                    ) : (
                      notes.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setCurrentPlayTime(item.timeSeconds)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-[#0052CC] text-xs font-extrabold hover:bg-blue-100 transition-colors shrink-0"
                            title="Tua đến mốc thời gian này"
                          >
                            <Play className="w-3 h-3 fill-[#0052CC]" />
                            {item.timestamp}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 leading-relaxed">
                              {item.content}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {item.createdAt}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Xóa ghi chú"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TỔNG QUAN */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      Trọng tâm kiến thức
                    </h3>
                    <ul className="space-y-2.5">
                      {(studyData?.summary ?? [
                        'Nắm chắc chiến lược trả lời các dạng câu hỏi thường gặp trong kỳ thi.',
                        'Luyện phản xạ với audio tốc độ chuẩn quốc tế.',
                        'Bí kíp nhận diện bẫy đồng âm và loại trừ đáp án sai nhanh chóng.',
                      ]).map((line, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="w-5 h-5 rounded-md bg-blue-50 text-[#0052CC] text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      Tài liệu bài học
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(studyData?.materials ?? [
                        {
                          id: 'mat_default',
                          title: 'Tài liệu hướng dẫn & Audio script',
                          fileName: 'lesson-handbook-prep.pdf',
                          fileType: 'pdf' as const,
                          sizeKb: 1850,
                        },
                      ]).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-[#0052CC]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {m.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {m.fileName} · {(m.sizeKb / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={Download}
                            className="rounded-lg text-xs"
                            onClick={() => {
                              alert(`Đang tải file: ${m.fileName}`);
                            }}
                          >
                            Tải
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HỎI ĐÁP */}
              {activeTab === 'qa' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        Bạn
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          placeholder="Đặt câu hỏi về bài giảng này cho giảng viên hoặc AI Mentor..."
                          rows={2}
                          className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-200/60 mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={Send}
                        disabled={!newQuestionText.trim()}
                        onClick={handleAddQuestion}
                        className="rounded-xl px-4 font-bold bg-[#0052CC] text-white"
                      >
                        Gửi câu hỏi
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Thảo luận lớp học ({qaList.length})
                    </p>
                    {qaList.map((qa) => (
                      <div
                        key={qa.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={qa.avatar}
                            alt={qa.author}
                            className="w-8 h-8 rounded-full bg-slate-100"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{qa.author}</p>
                            <p className="text-[10px] text-slate-400">{qa.timeAgo}</p>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-10">
                          {qa.question}
                        </p>

                        {qa.answer && (
                          <div className="ml-10 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <img
                                src={qa.answer.avatar}
                                alt={qa.answer.author}
                                className="w-6 h-6 rounded-full border border-blue-200"
                              />
                              <p className="text-xs font-extrabold text-[#0052CC]">
                                {qa.answer.author}
                                <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#0052CC] text-white">
                                  Giảng viên
                                </span>
                              </p>
                              <span className="text-[10px] text-slate-400">· {qa.answer.timeAgo}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed pl-8">
                              {qa.answer.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default CoursePlayerView;
