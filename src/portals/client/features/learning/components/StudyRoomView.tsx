/**
 * StudyRoomView — Phòng học trực tuyến & Nộp bài tập
 * -----------------------------------------------------------
 * Bố cục 2 cột:
 *   - Trái (70%): Video player + Tiêu đề bài + 3 tab (Tổng quan / Từ vựng / Bài tập)
 *   - Phải (30%): Mục lục khóa học (sticky, scroll độc lập)
 *
 * Tính năng:
 *   - Player: play/pause, progress, volume, tốc độ (1.0/1.25/1.5x)
 *   - Tabs: tài liệu PDF có nút tải, vocabulary table có nút phát âm,
 *     homework có textarea + file upload + nút nộp bài + feedback giảng viên
 *   - Curriculum: chương đã học / đang học / chưa mở (khoá) — bài hiện tại
 *     được làm nổi bật bằng nền xanh nhạt + chữ đậm
 *   - Chuyển bài mượt mà khi click
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Gauge,
  ArrowLeft,
  FileText,
  Download,
  Volume1,
  CheckCircle2,
  Lock,
  Send,
  Paperclip,
  Sparkles,
  ChevronRight,
  BookOpen,
  Award,
  Clock,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import {
  getStudyLesson,
  MOCK_ENROLLED_COURSES,
} from '@/mocks';
import type { Course, CourseSection, Lesson } from '@/shared/types';
import type {
  StudyLesson,
  StudyTabKey,
} from '@/shared/types';

/* ============================================================
 *  Main component
 * ============================================================ */
export const StudyRoomView: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();

  // Tìm course theo slug
  const enrolled = useMemo(
    () =>
      MOCK_ENROLLED_COURSES.find(
        (ec) => ec.course.slug === slug || ec.course.id === slug,
      ),
    [slug],
  );

  const fallbackEnrolled = MOCK_ENROLLED_COURSES[0];
  const activeEnrolled = enrolled ?? fallbackEnrolled;
  const { course, progress, mentor } = activeEnrolled;

  // Lesson hiện tại: ưu tiên query ?lesson=, fallback về currentLessonId
  const requestedLessonId = params.get('lesson');
  const initialLessonId =
    requestedLessonId ??
    course.curriculum
      .flatMap((s) => s.lessons)
      .find((l) => l.id === progress.currentLessonId)?.id ??
    progress.currentLessonId;

  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);

  // Đồng bộ URL khi chuyển bài
  useEffect(() => {
    if (activeLessonId && activeLessonId !== requestedLessonId) {
      setParams({ lesson: activeLessonId }, { replace: true });
    }
  }, [activeLessonId, requestedLessonId, setParams]);

  // Lấy thông tin chi tiết của lesson hiện tại
  const studyData = getStudyLesson(activeLessonId);

  // Tìm section chứa lesson hiện tại
  const activeSection = useMemo(() => {
    return (
      course.curriculum.find((s) =>
        s.lessons.some((l) => l.id === activeLessonId),
      ) ?? course.curriculum[0]
    );
  }, [course, activeLessonId]);

  if (!activeEnrolled) {
    return (
      <Card className="text-center py-16">
        <h2 className="text-xl font-extrabold text-slate-900">
          Khóa học không tồn tại
        </h2>
        <Button
          variant="primary"
          size="md"
          className="mt-4"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/my-learning')}
        >
          Quay lại danh sách khóa học
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ============== TOP BAR ============== */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/my-learning')}
          >
            Danh sách khóa học
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Đang học
            </p>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
              {course.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md" className="tabular-nums">
            {progress.percent}% hoàn thành
          </Badge>
          <Badge variant="ai" size="md" icon={Sparkles}>
            AI Mentor
          </Badge>
        </div>
      </header>

      {/* ============== 2-COLUMN LAYOUT ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* ============ LEFT (70%) ============ */}
        <div className="space-y-5 min-w-0">
          <VideoPlayer
            durationSeconds={studyData?.lesson.durationMinutes
              ? studyData.lesson.durationMinutes * 60
              : 24 * 60 + 15}
          />

          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">
                  {course.certificate}
                </Badge>
                <Badge variant="neutral" size="sm" icon={Clock}>
                  {studyData?.lesson.durationMinutes ?? 24} phút
                </Badge>
                <Badge variant="success" size="sm" icon={CheckCircle2}>
                  Đang học
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                Bài {String(studyData?.lesson.order ?? 4).padStart(2, '0')}:{' '}
                {studyData?.lesson.title ??
                  'Chiến lược nâng cao cho dạng biểu đồ xu hướng (Writing Task 1)'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {studyData?.lesson.description ??
                  'Nâng cao kỹ năng phân tích biểu đồ đường trong IELTS Writing Task 1 với bộ collocations chuẩn Academic.'}
              </p>
            </div>
          </Card>

          {studyData && (
            <LessonTabs studyData={studyData} />
          )}
        </div>

        {/* ============ RIGHT (30%) — Curriculum ============ */}
        <aside className="lg:sticky lg:top-[112px] lg:max-h-[calc(100vh-128px)] lg:overflow-y-auto rounded-card border border-slate-200/80 bg-white shadow-elevation">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Mục lục khóa học
            </h3>
          </div>
          <Curriculum
            sections={course.curriculum}
            activeLessonId={activeLessonId}
            completedLessonIds={progress.completedLessonIds}
            mentorName={mentor.fullName}
            onSelect={(lesson, section) => {
              if (lesson.status === 'LOCKED') return;
              setActiveLessonId(lesson.id);
              // section unused but kept for future analytics
              void section;
            }}
          />
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <img
                src={mentor.avatarUrl}
                alt={mentor.fullName}
                className="w-9 h-9 rounded-full bg-slate-100 border border-white shadow-sm"
              />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Giảng viên
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {mentor.fullName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={Award}
                onClick={() =>
                  // Route /courses/:id của Dev 2 nhận UUID; dùng `code`
                  // (VD: "IELTS-75-INT") làm khoá tìm kiếm thay vì slug
                  // cũ — CourseDetailPage sẽ tự tra cứu ra UUID.
                  navigate(
                    `/courses/${(course as Course & { code?: string }).code ?? course.id}`,
                  )
                }
              >
                Hồ sơ
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ============================================================
 *  Video Player
 * ============================================================ */
const SPEEDS = [1.0, 1.25, 1.5] as const;
type PlaybackSpeed = (typeof SPEEDS)[number];

interface VideoPlayerProps {
  durationSeconds: number;
}
const VideoPlayer: React.FC<VideoPlayerProps> = ({ durationSeconds }) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [progress, setProgress] = useState(0); // seconds

  const totalDuration = durationSeconds;
  const progressPct = (progress / totalDuration) * 100;

  // Tick mỗi giây khi đang phát
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= totalDuration) {
          setPlaying(false);
          return totalDuration;
        }
        return p + speed;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, speed, totalDuration]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="relative aspect-video bg-navy-900 rounded-card overflow-hidden shadow-elevation">
      {/* Video "preview" — nền gradient tối + tiêu đề */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-ai/30 flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-ai/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center',
            'bg-white/15 backdrop-blur-md border border-white/25',
            'hover:bg-white/25 transition-all shadow-ai-glow',
            playing && 'opacity-0 hover:opacity-100',
          )}
          aria-label={playing ? 'Tạm dừng' : 'Phát'}
        >
          {playing ? (
            <Pause className="w-7 h-7 text-white" />
          ) : (
            <Play className="w-7 h-7 text-white translate-x-0.5" fill="white" />
          )}
        </button>
        <p className="relative mt-4 text-white text-sm font-bold tracking-wide">
          PrepMaster AI — Study Room
        </p>
        <p className="relative text-white/60 text-xs mt-1">
          Video bài giảng chuẩn HD · {formatTime(totalDuration)}
        </p>
      </div>

      {/* Controls bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-navy-900/95 via-navy-900/70 to-transparent">
        {/* Progress bar */}
        <div
          className="group relative h-1.5 bg-white/20 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setProgress(Math.max(0, Math.min(1, pct)) * totalDuration);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100"
            style={{ left: `calc(${progressPct}% - 6px)` }}
          />
        </div>

        {/* Buttons */}
        <div className="mt-2 flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              aria-label={playing ? 'Tạm dừng' : 'Phát'}
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" fill="white" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <span className="text-[11px] font-mono tabular-nums ml-1">
              {formatTime(progress)} / {formatTime(totalDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <SpeedToggle speed={speed} onChange={setSpeed} />
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              aria-label="Toàn màn hình"
              title="Toàn màn hình"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SpeedToggleProps {
  speed: PlaybackSpeed;
  onChange: (s: PlaybackSpeed) => void;
}
const SpeedToggle: React.FC<SpeedToggleProps> = ({ speed, onChange }) => {
  return (
    <div className="relative group">
      <button
        type="button"
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-bold bg-white/15 hover:bg-white/25 transition-colors"
        aria-label="Tốc độ phát"
      >
        <Gauge className="w-3.5 h-3.5" />
        {speed}x
      </button>
      <div className="absolute bottom-full right-0 mb-1 hidden group-hover:flex flex-col bg-navy-800/95 backdrop-blur border border-white/10 rounded-md overflow-hidden shadow-xl">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              'px-3 py-1.5 text-[11px] font-bold text-white text-left',
              s === speed ? 'bg-primary' : 'hover:bg-white/10',
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
 *  Lesson Tabs
 * ============================================================ */
interface LessonTabsProps {
  studyData: StudyLesson;
}
const LessonTabs: React.FC<LessonTabsProps> = ({ studyData }) => {
  const [tab, setTab] = useState<StudyTabKey>('overview');
  return (
    <Card noPadding>
      {/* Tab header */}
      <div className="flex border-b border-slate-200 px-2">
        <TabButton
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
        >
          Tổng quan bài học
        </TabButton>
        <TabButton
          active={tab === 'vocabulary'}
          onClick={() => setTab('vocabulary')}
        >
          Từ vựng trọng tâm
        </TabButton>
        <TabButton
          active={tab === 'homework'}
          onClick={() => setTab('homework')}
          hasBadge={Boolean(studyData.homework)}
        >
          Bài tập về nhà
        </TabButton>
      </div>

      {/* Tab body */}
      <div className="p-5">
        {tab === 'overview' && <OverviewTab studyData={studyData} />}
        {tab === 'vocabulary' && <VocabularyTab studyData={studyData} />}
        {tab === 'homework' && <HomeworkTab studyData={studyData} />}
      </div>
    </Card>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  hasBadge?: boolean;
  children: React.ReactNode;
}
const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  hasBadge = false,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors',
      active
        ? 'text-primary'
        : 'text-slate-500 hover:text-slate-800',
    )}
  >
    {children}
    {hasBadge && (
      <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-status-warning text-white text-[9px] font-extrabold">
        1
      </span>
    )}
    <span
      className={cn(
        'absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors',
        active ? 'bg-primary' : 'bg-transparent',
      )}
      aria-hidden
    />
  </button>
);

/* ----- Tab: Overview ----- */
const OverviewTab: React.FC<{ studyData: StudyLesson }> = ({ studyData }) => {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
          Trọng tâm bài học
        </p>
        <ul className="space-y-2.5">
          {studyData.summary.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-md bg-primary-tint text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
          Tài liệu đính kèm
        </p>
        <ul className="space-y-2">
          {studyData.materials.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-input border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {m.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {m.fileName} · {(m.sizeKb / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={Download}
                onClick={() => {
                  // Demo: chỉ tạo blob giả lập để tải xuống
                  const blob = new Blob(
                    [
                      `PrepMaster AI — Tài liệu: ${m.title}\n\nĐây là file mẫu cho bài học. Hệ thống sẽ cung cấp link tải thật khi tích hợp backend.`,
                    ],
                    { type: 'text/plain;charset=utf-8' },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = m.fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Tải về
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ----- Tab: Vocabulary ----- */
const VocabularyTab: React.FC<{ studyData: StudyLesson }> = ({
  studyData,
}) => {
  const vocab = studyData.vocabulary;
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">
        {vocab.length} từ vựng Academic trọng tâm
      </p>
      <div className="overflow-x-auto rounded-input border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="text-left px-3 py-2.5 w-1/4">Từ vựng</th>
              <th className="text-left px-3 py-2.5 w-1/6">Phiên âm</th>
              <th className="text-left px-3 py-2.5 w-1/4">Nghĩa</th>
              <th className="text-left px-3 py-2.5">Câu ví dụ</th>
              <th className="px-3 py-2.5 w-12 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vocab.map((v) => (
              <tr key={v.word} className="hover:bg-slate-50/60">
                <td className="px-3 py-3 font-extrabold text-slate-900">
                  {v.word}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-slate-500">
                  {v.ipa}
                </td>
                <td className="px-3 py-3 text-slate-700">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1.5">
                    {v.partOfSpeech}
                  </span>
                  {v.meaning}
                </td>
                <td className="px-3 py-3 text-slate-700 italic">
                  {v.example}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      // Demo: dùng Web Speech API nếu có, fallback click
                      if (
                        'speechSynthesis' in window &&
                        typeof SpeechSynthesisUtterance !== 'undefined'
                      ) {
                        try {
                          const u = new SpeechSynthesisUtterance(v.word);
                          u.lang = 'en-US';
                          u.rate = 0.9;
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(u);
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-primary hover:bg-primary-tint transition-colors"
                    title="Phát âm"
                    aria-label={`Phát âm từ ${v.word}`}
                  >
                    <Volume1 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ----- Tab: Homework ----- */
const HomeworkTab: React.FC<{ studyData: StudyLesson }> = ({ studyData }) => {
  const hw = studyData.homework;
  const [answer, setAnswer] = useState(hw?.studentAnswer ?? '');
  const [files, setFiles] = useState<{ name: string; sizeKb: number }[]>(
    hw?.attachments ?? [],
  );
  const [submitted, setSubmitted] = useState(Boolean(hw?.gradedScore));
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!hw) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-card bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-700">
          Bài học này chưa có bài tập về nhà
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Giảng viên sẽ cập nhật bài tập trong thời gian tới.
        </p>
      </div>
    );
  }

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const next = Array.from(list).map((f) => ({
      name: f.name,
      sizeKb: Math.round(f.size / 1024),
    }));
    setFiles((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Mô phỏng gọi API nộp bài
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div className="rounded-input border border-slate-200 bg-gradient-to-br from-primary-tint/40 to-white p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="warning" size="sm" icon={Clock}>
            Hạn nộp: {hw.dueLabel}
          </Badge>
          <Badge variant="primary" size="sm">
            Writing Task 1
          </Badge>
        </div>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
          {hw.prompt}
        </p>
      </div>

      {/* Editor */}
      <div>
        <label
          htmlFor="essay-textarea"
          className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
        >
          Bài làm của bạn
        </label>
        <textarea
          id="essay-textarea"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={8}
          placeholder="Nhập nội dung bài làm của bạn tại đây…"
          className={cn(
            'mt-1.5 w-full rounded-input border border-slate-200 bg-white',
            'p-3 text-sm text-slate-800 leading-relaxed resize-y',
            'focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10',
            submitted && 'opacity-70',
          )}
          readOnly={submitted}
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {answer.trim().split(/\s+/).filter(Boolean).length} từ
          </span>
          <span>Mục tiêu: 150-200 từ</span>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          Tệp đính kèm
        </p>
        <div className="mt-1.5 rounded-input border border-dashed border-slate-300 bg-slate-50/50 p-4">
          {files.length === 0 ? (
            <p className="text-xs text-slate-500 text-center">
              Chưa có tệp nào được đính kèm
            </p>
          ) : (
            <ul className="space-y-1.5 mb-3">
              {files.map((f, idx) => (
                <li
                  key={`${f.name}-${idx}`}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-white border border-slate-200"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-800 flex-1 truncate">
                    {f.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {f.sizeKb} KB
                  </span>
                  {!submitted && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-[10px] text-status-danger font-bold hover:underline"
                    >
                      Xoá
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            multiple
            onChange={handleAddFile}
            className="hidden"
            disabled={submitted}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Hỗ trợ PDF, DOCX. Tối đa 10MB mỗi tệp.
            </p>
            {!submitted && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Paperclip}
                onClick={() => fileInputRef.current?.click()}
              >
                Đính kèm tệp
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      {!submitted ? (
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            size="md"
            leftIcon={Send}
            isLoading={submitting}
            disabled={submitting || answer.trim().length < 10}
            onClick={handleSubmit}
          >
            Nộp bài tập
          </Button>
        </div>
      ) : (
        <p className="text-xs text-status-success font-bold inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã nộp bài · Hệ thống sẽ ghi nhận kết quả sau khi AI chấm và Mentor
          duyệt
        </p>
      )}

      {/* Graded feedback */}
      {submitted && hw.gradedScore !== undefined && (
        <div className="rounded-input border border-status-success/30 bg-status-success-bg/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-status-success">
              Nhận xét từ giảng viên
            </p>
            <div className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-md bg-white border border-status-success/30">
              <span className="text-[10px] font-bold text-slate-500">
                Điểm
              </span>
              <span className="text-base font-extrabold text-status-success tabular-nums">
                {hw.gradedScore.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                /10
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            {hw.gradedFeedback}
          </p>
        </div>
      )}
    </div>
  );
};

/* ============================================================
 *  Curriculum
 * ============================================================ */
interface CurriculumProps {
  sections: CourseSection[];
  activeLessonId: string;
  completedLessonIds: string[];
  mentorName: string;
  onSelect: (lesson: Lesson, section: CourseSection) => void;
}
const Curriculum: React.FC<CurriculumProps> = ({
  sections,
  activeLessonId,
  completedLessonIds,
  onSelect,
}) => {
  return (
    <nav className="py-2" aria-label="Mục lục khóa học">
      {sections.map((section) => {
        const completedCount = section.lessons.filter((l) =>
          completedLessonIds.includes(l.id),
        ).length;
        const total = section.lessons.length;
        const isAllDone = completedCount === total;
        return (
          <div key={section.id} className="px-2 py-1.5">
            <div className="px-2 py-1.5 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Chương {section.order}
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {section.title}
                </p>
              </div>
              <Badge
                variant={isAllDone ? 'success' : 'neutral'}
                size="sm"
                className="shrink-0"
              >
                {completedCount}/{total}
              </Badge>
            </div>
            <ul className="space-y-0.5">
              {section.lessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const isDone = completedLessonIds.includes(lesson.id);
                const locked = lesson.status === 'LOCKED' && !isActive;
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => onSelect(lesson, section)}
                      className={cn(
                        'w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-tint border border-primary/30'
                          : locked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-slate-50',
                      )}
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0',
                          isActive
                            ? 'bg-primary text-white'
                            : isDone
                              ? 'bg-status-success-bg text-status-success'
                              : locked
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : locked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          String(lesson.order).padStart(2, '0')
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-[12.5px] truncate',
                            isActive
                              ? 'text-primary font-extrabold'
                              : 'text-slate-700 font-semibold',
                          )}
                        >
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {lesson.durationMinutes} phút
                          {lesson.type === 'LIVE' && (
                            <span className="ml-1 text-status-danger font-bold">
                              · LIVE
                            </span>
                          )}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
};

export default StudyRoomView;
