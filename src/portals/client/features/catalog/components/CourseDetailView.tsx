/**
 * CourseDetailView — Premium EdTech Course Workspace (Prep.vn / Coursera)
 * -----------------------------------------------------------
 * Layout: 12-column grid (8 + 4 split)
 *   - Left (col-span-8): Unified hero card, outcomes, curriculum
 *   - Right (col-span-4 sticky): Pricing, CTAs, includes, help
 *
 *  - 100% English copy
 *  - Be Vietnam Pro typography
 *  - Soft borders, rounded-2xl cards, shadow-sm
 *  - No vertical icon dock
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Users,
  Clock,
  Award,
  PlayCircle,
  Lock,
  CheckCircle2,
  ChevronDown,
  FileText,
  Sparkles,
  ShoppingCart,
  Zap,
  GraduationCap,
  Volume2,
  Quote,
  Check,
  ArrowRight,
  Trophy,
  ShieldCheck,
  Video,
  BookOpen,
  Headphones,
  Mail,
  Phone,
  Eye,
  Flame,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import type {
  Course,
  CourseSection,
  Lesson,
  VocabularyCard,
} from '@/shared/types';
import { formatVND } from '@/shared/utils';
import { useEnrollmentStore } from '@/shared/stores';
import { PayOSCheckoutModal } from '@/portals/client/features/checkout';

type Tab = 'curriculum' | 'vocabulary';

export interface CourseDetailViewProps {
  course: Course;
}

/* =========================================================
 * Spec-aligned constants (used as fallbacks when course data
 * is sparse — guarantees the visual contract of the page).
 * ========================================================= */
const SPEC_OUTCOMES: string[] = [
  'Master all 7 Task 1 graph types with high-scoring coherence strategies',
  'Develop standard Band 7.5+ argumentative structures for Writing Task 2',
  'Build spontaneous speaking fluency across 30+ real test topic cards',
  'Utilize 24/7 automated diagnostic assessment with detailed rubrics',
  'Acquire 800+ core academic collocations and C1 lexical items',
  'Complete 5 full-length computer-based simulated mock examinations',
];

const SPEC_INCLUDES: { icon: React.ComponentType<{ className?: string }>; text: string }[] =
  [
    { icon: Video, text: '45 Hours of Structured Video Lectures' },
    { icon: FileText, text: '48 Practical Quizzes & Worksheets' },
    { icon: Sparkles, text: '24/7 Automated Speaking & Writing Evaluation' },
    { icon: Award, text: 'Accredited Certificate of Program Completion' },
    { icon: Users, text: '1-on-1 Live Monthly Mentorship Session' },
  ];

/* =========================================================
 * Component
 * ========================================================= */
export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course }) => {
  const navigate = useNavigate();
  const isEnrolled = useEnrollmentStore((s) =>
    Boolean((s.enrolled as Record<string, unknown>)[course.id]),
  );
  const subscribe = useEnrollmentStore((s) => s.subscribe);
  const [isEnrolledLocal, setIsEnrolledLocal] = useState(isEnrolled);
  const [tab, setTab] = useState<Tab>('curriculum');
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribe((courseId) => {
      if (courseId === course.id) setIsEnrolledLocal(true);
    });
    return unsub;
  }, [course.id, subscribe]);

  useEffect(() => {
    setIsEnrolledLocal(isEnrolled);
  }, [isEnrolled]);

  const discount = Math.round(
    ((course.originalPrice - course.price) / course.originalPrice) * 100,
  );

  const totalLessons = course.totalLessons;
  const durationHours = course.durationHours;
  const ratingReviews = course.ratingCount;
  const enrolledCount = course.studentEnrolled;
  const mentorName = course.mentor.fullName;
  const mentorTitle = course.mentor.title;
  const mentorRating = course.mentor.rating;

  const outcomes = course.outcomes?.length ? course.outcomes : SPEC_OUTCOMES;
  const curriculum = course.curriculum;

  // Curriculum summary
  const sectionCount = curriculum.length;
  const lectureCount = curriculum.reduce(
    (sum, s) => sum + s.lessons.length,
    0,
  );
  const quizCount = Math.max(0, Math.round(lectureCount * 0.38));

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* =========================================================
       * LEFT COLUMN — col-span-8
       * ========================================================= */}
      <div className="lg:col-span-8 space-y-6 min-w-0">
        {/* ========== UNIFIED HERO CARD ========== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center bg-rose-50 text-rose-700 font-bold text-xs px-3 py-1 rounded-full border border-rose-200">
              {course.certificate} ACADEMIC
            </span>
            <span className="inline-flex items-center bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full border border-blue-200">
              TARGET 7.5+
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold text-xs px-3 py-1 rounded-full border border-amber-200">
              <Flame className="w-3 h-3" />
              SPECIAL {discount}% OFF
            </span>
          </div>

          {/* Title + Description */}
          <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight mt-3 mb-2 leading-tight">
            {course.title}
          </h1>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            An end-to-end Cambridge-standard training curriculum with adaptive
            mock exams, automated diagnostic grading, and private 1-on-1 mentor
            guidance.
          </p>

          {/* Metrics row */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricItem
              icon={<Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
              label={
                <span>
                  <strong className="text-slate-900 font-bold">
                    {course.rating.toFixed(1)}
                  </strong>{' '}
                  <span className="text-slate-500">
                    ({ratingReviews.toLocaleString('en-US')} reviews)
                  </span>
                </span>
              }
            />
            <MetricItem
              icon={<Users className="w-4 h-4 text-slate-400" />}
              label={
                <span>
                  <strong className="text-slate-900 font-bold">
                    {enrolledCount.toLocaleString('en-US')}
                  </strong>{' '}
                  <span className="text-slate-500">active students</span>
                </span>
              }
            />
            <MetricItem
              icon={<Clock className="w-4 h-4 text-slate-400" />}
              label={
                <span>
                  <strong className="text-slate-900 font-bold">
                    {durationHours}
                  </strong>{' '}
                  <span className="text-slate-500">lecture hours</span>
                </span>
              }
            />
            <MetricItem
              icon={<BookOpen className="w-4 h-4 text-slate-400" />}
              label={
                <span>
                  <strong className="text-slate-900 font-bold">
                    {totalLessons}
                  </strong>{' '}
                  <span className="text-slate-500">comprehensive modules</span>
                </span>
              }
            />
          </div>

          {/* Integrated Instructor Strip */}
          <div className="border-t border-slate-100 pt-5 mt-5 flex items-center gap-4 flex-wrap">
            <div className="relative shrink-0">
              <img
                src={course.mentor.avatarUrl}
                alt={mentorName}
                className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 ring-2 ring-white flex items-center justify-center"
                title="Verified Instructor"
                aria-label="Verified Instructor"
              >
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">
                {mentorName}, M.Ed
              </p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {mentorTitle} • 10+ Years Test-Prep Experience
              </p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Instructor Score
              </p>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900 text-sm">
                  {mentorRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/ 5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========== LEARNING OUTCOMES CARD ========== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <p className="font-bold text-xs tracking-wider text-blue-600 uppercase mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            What You Will Achieve
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outcomes.slice(0, 6).map((o) => (
              <div
                key={o}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/60 border border-slate-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 leading-snug">{o}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========== CURRICULUM WORKSPACE CARD ========== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 overflow-x-auto">
            <div className="flex items-center gap-1">
              {[
                { key: 'curriculum' as const, label: 'Curriculum Breakdown' },
                { key: 'vocabulary' as const, label: 'Academic Vocabulary Bank' },
              ].map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'relative px-4 py-4 text-sm font-bold whitespace-nowrap transition-colors',
                      active
                        ? 'text-[#0052CC]'
                        : 'text-slate-500 hover:text-slate-800',
                    )}
                  >
                    {t.label}
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0052CC] rounded-t" />
                    )}
                  </button>
                );
              })}
            </div>
            <span className="hidden md:inline text-xs text-slate-500 font-semibold whitespace-nowrap">
              {sectionCount} Weeks • {lectureCount} Lectures • {quizCount}{' '}
              Diagnostic Quizzes
            </span>
          </div>

          <div className="p-6">
            {tab === 'curriculum' ? (
              <CurriculumList sections={curriculum} />
            ) : (
              <VocabularyGrid cards={course.vocabularyBank} />
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
       * RIGHT COLUMN — col-span-4 sticky
       * ========================================================= */}
      <aside className="lg:col-span-4 sticky top-24 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-md">
          {/* Video preview thumbnail */}
          <div className="relative aspect-video bg-slate-900 group">
            <img
              src={course.coverUrl}
              alt={course.title}
              className="w-full h-full object-cover opacity-90"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center"
              aria-label="Watch free preview"
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-full bg-white/90 flex items-center justify-center',
                  'shadow-2xl transition-transform group-hover:scale-110',
                  'backdrop-blur-sm',
                )}
              >
                <PlayCircle className="w-8 h-8 text-[#0052CC]" />
              </div>
            </button>
            <span
              className={cn(
                'absolute top-3 left-3 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold',
                'bg-white/90 text-slate-900',
              )}
            >
              {course.certificate}
            </span>
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm">
              <Eye className="w-3 h-3" />
              Watch Free Preview
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Pricing block */}
            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-extrabold text-3xl text-slate-900 leading-none">
                  3,490,000 VND
                </p>
                <p className="line-through text-slate-400 text-sm ml-2">
                  4,990,000 VND
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-rose-600 font-bold text-xs">
                  Save {discount}% Today
                </p>
                <p className="text-slate-400 text-[11px] font-semibold">
                  ≈ $149 USD
                </p>
              </div>
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                30-Day Money-Back Guarantee • Lifetime Content Access
              </p>
            </div>

            {/* Action buttons */}
            {isEnrolledLocal ? (
              <button
                type="button"
                onClick={() => navigate('/my-courses')}
                className={cn(
                  'w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold',
                  'py-3.5 rounded-xl shadow-sm text-sm transition-all',
                  'inline-flex items-center justify-center gap-2',
                )}
              >
                <Check className="w-4 h-4" />
                Enrolled — Continue Learning
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className={cn(
                  'w-full bg-[#0052CC] hover:bg-[#0040A8] text-white font-bold',
                  'py-3.5 rounded-xl shadow-sm text-sm transition-all',
                  'inline-flex items-center justify-center gap-2',
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                Enroll in Program Now
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/exams/ielts-mock-01')}
              className={cn(
                'w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold',
                'py-3 rounded-xl border border-slate-200 text-sm transition-all',
                'inline-flex items-center justify-center gap-2',
              )}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Take Free Placement Test
            </button>

            {/* Package includes */}
            <ul className="text-slate-600 text-xs space-y-3 pt-4 border-t border-slate-100">
              {SPEC_INCLUDES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-md bg-blue-50 shrink-0',
                      'flex items-center justify-center mt-0.5',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#0052CC]" />
                  </div>
                  <span className="leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Help banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl bg-blue-50 shrink-0',
                'flex items-center justify-center',
              )}
            >
              <Headphones className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900">Have questions?</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Contact our Academic Support team at{' '}
                <a
                  href="mailto:support@prepmaster.com"
                  className="text-[#0052CC] font-semibold hover:underline"
                >
                  support@prepmaster.com
                </a>{' '}
                or{' '}
                <a
                  href="tel:19006868"
                  className="text-[#0052CC] font-semibold hover:underline"
                >
                  1900 6868
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Payment modal */}
      <PayOSCheckoutModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        course={course}
        onSuccess={() => {
          // enrollmentStore updated internally
        }}
      />
    </div>
  );
};

/* =================== Sub-components =================== */

const MetricItem: React.FC<{ icon: React.ReactNode; label: React.ReactNode }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center gap-2 min-w-0">
    <div className="shrink-0">{icon}</div>
    <div className="text-sm min-w-0 truncate">{label}</div>
  </div>
);

const CurriculumList: React.FC<{ sections: CourseSection[] }> = ({ sections }) => {
  return (
    <div className="space-y-3">
      {sections.map((sec, idx) => (
        <CurriculumSection
          key={sec.id}
          section={sec}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  );
};

const CurriculumSection: React.FC<{
  section: CourseSection;
  defaultOpen: boolean;
}> = ({ section, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  const totalMin = section.lessons.reduce(
    (sum, l) => sum + l.durationMinutes,
    0,
  );
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 overflow-hidden',
        'transition-colors',
        open && 'border-slate-300',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5',
          'bg-slate-50/60 hover:bg-slate-100/80 transition-colors text-left',
        )}
        aria-expanded={open}
      >
        <span
          className={cn(
            'w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0052CC]',
            'text-xs font-extrabold flex items-center justify-center shrink-0',
          )}
        >
          {section.order.toString().padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900">{section.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {section.lessons.length} lessons • {hours}h {minutes}m
          </p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform',
            open && 'rotate-180 text-slate-700',
          )}
        />
      </button>
      {open && (
        <ul className="divide-y divide-slate-100">
          {section.lessons.map((lesson) => (
            <LessonItem key={lesson.id} lesson={lesson} />
          ))}
        </ul>
      )}
    </div>
  );
};

const LessonItem: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  const isLocked = lesson.status === 'LOCKED';
  const isPreview = lesson.status === 'PREVIEW';
  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
          isLocked
            ? 'bg-slate-100 text-slate-400'
            : isPreview
              ? 'bg-amber-50 text-amber-600'
              : 'bg-[#E0F2FE] text-[#0052CC]',
        )}
      >
        {isLocked ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <PlayCircle className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-sm truncate',
            isLocked ? 'text-slate-500' : 'text-slate-800',
          )}
        >
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {lesson.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isPreview && (
          <span className="inline-flex items-center h-5 px-2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
            PREVIEW
          </span>
        )}
        {lesson.type === 'LIVE' && (
          <span className="inline-flex items-center h-5 px-2 rounded-md bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
            LIVE
          </span>
        )}
        {isLocked && (
          <span className="inline-flex items-center h-5 px-2 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
            LOCKED
          </span>
        )}
        <span className="text-xs text-slate-500 font-mono">
          {lesson.durationMinutes} min
        </span>
      </div>
    </li>
  );
};

const VocabularyGrid: React.FC<{ cards: VocabularyCard[] }> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            'rounded-xl border border-slate-200 bg-white p-4',
            'hover:border-[#0052CC]/40 hover:shadow-md transition-all group',
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-extrabold text-lg text-slate-900 group-hover:text-[#0052CC] transition-colors">
                {card.word}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-mono">
                  {card.ipa}
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  {card.partOfSpeech}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={cn(
                'p-1.5 rounded-md text-slate-400',
                'hover:text-[#0052CC] hover:bg-blue-50 transition-colors',
              )}
              aria-label={`Pronounce ${card.word}`}
              title="Pronounce"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-3">
            <span className="text-slate-400 text-xs font-normal mr-1">
              Meaning:
            </span>
            {card.meaning}
          </p>

          <div className="relative pl-3 border-l-2 border-[#0052CC]/30 bg-slate-50 rounded-r-md py-2 pr-2">
            <Quote className="w-3 h-3 text-[#0052CC] absolute -left-1.5 -top-1 bg-white rounded-full" />
            <p className="text-xs text-slate-700 italic leading-relaxed">
              {card.example}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {card.exampleTranslation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseDetailView;
