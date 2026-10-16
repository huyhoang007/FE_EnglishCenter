/**
 * CourseDetailPage — Premium EdTech (Coursera / Prep.vn hybrid)
 * -----------------------------------------------------------
 * Structure:
 *   1. DARK ACADEMIC HERO (#0F172A) — breadcrumb, badges, title,
 *      sub-headline, metrics, instructor strip
 *   2. 2-COLUMN BALANCED WORKSPACE
 *      ├── Left (col-span-8): Unified white sheet with
 *      │   - Learning Outcomes
 *      │   - Curriculum Breakdown (tabs + accordion)
 *      │   - Program Prerequisites
 *      │   - Verified Student Feedback
 *      └── Right (col-span-4 sticky): Pricing, CTAs, deliverables,
 *          guarantee, help banner
 *
 *  - 100% English copy
 *  - Be Vietnam Pro typography
 *  - No vertical icon dock
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  ChevronRight,
  Home,
  Calendar,
  Globe,
  MessageSquare,
  BookOpenCheck,
  ArrowLeft,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils';
import { useEnrollmentStore } from '@/shared/stores';
import { PayOSCheckoutModal } from '@/portals/client/features/checkout';
import { MOCK_COURSE } from '@/mocks';
import type {
  Course,
  CourseSection,
  Lesson,
  VocabularyCard,
} from '@/shared/types';

type Tab = 'syllabus' | 'vocabulary';

/* =========================================================
 * Spec-aligned content
 * ========================================================= */
const SPEC_OUTCOMES: string[] = [
  'Master all 7 Task 1 graph types with high-scoring coherence strategies',
  'Develop standard Band 7.5+ argumentative structures for Writing Task 2',
  'Build spontaneous speaking fluency across 30+ real test topic cards',
  'Use 24/7 automated diagnostic assessment with detailed rubrics',
  'Acquire 800+ core academic collocations and C1 lexical items',
  'Complete 5 full-length computer-based simulated mock examinations',
];

const SPEC_INCLUDES: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}[] = [
  { icon: Video, text: '45 Hours of On-Demand HD Lectures' },
  { icon: FileText, text: '48 Quizzes & Diagnostic Practice Tests' },
  { icon: Sparkles, text: '24/7 Automated Speaking & Writing Scoring' },
  { icon: Award, text: 'Accredited Certificate of Program Completion' },
  { icon: Users, text: '1-on-1 Monthly Mentor Review Session' },
];

const SPEC_REQUIREMENTS: string[] = [
  'Upper-intermediate English foundation (CEFR B1 or equivalent).',
  'A computer or tablet with stable internet connection for live sessions.',
  'Willingness to commit at least 6 hours per week for self-study.',
  'No prior IELTS test experience required — diagnostic placement included.',
];

const SPEC_REVIEWS: {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  date: string;
  body: string;
}[] = [
  {
    name: 'Linh Tran',
    role: 'IELTS 7.5 Achiever',
    avatar: 'LT',
    rating: 5,
    date: '2 weeks ago',
    body: 'The mock exam engine and weekly mentor review completely changed my preparation. I went from Band 6.0 to 7.5 in just 10 weeks of structured study.',
  },
  {
    name: 'Minh Pham',
    role: 'Target Band 7.0+',
    avatar: 'MP',
    rating: 5,
    date: '1 month ago',
    body: 'David is an excellent examiner-level mentor. His Task 2 templates and the 24/7 AI grader are worth the price alone. Highly recommended for serious learners.',
  },
];

const RATING_DISTRIBUTION: { stars: number; pct: number }[] = [
  { stars: 5, pct: 78 },
  { stars: 4, pct: 16 },
  { stars: 3, pct: 4 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 1 },
];

/* =========================================================
 * Component
 * ========================================================= */
const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Soft validation — not-found card if param mismatches mock
  if (id !== MOCK_COURSE.slug && id !== MOCK_COURSE.id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="text-center py-16 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpenCheck className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Course Not Found
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            The course with code{' '}
            <span className="font-mono font-bold">{id}</span> is not yet
            available. Try the flagship course{' '}
            <span className="font-mono font-bold text-[#0052CC]">
              ielts-intensive-mastery
            </span>
            .
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-6"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/courses/ielts-intensive-mastery')}
          >
            Browse Course Catalog
          </Button>
        </Card>
      </div>
    );
  }

  return <CourseDetailContent course={MOCK_COURSE} />;
};

/* =========================================================
 * Inner content (receives validated course)
 * ========================================================= */
const CourseDetailContent: React.FC<{ course: Course }> = ({ course }) => {
  const isEnrolled = useEnrollmentStore((s) =>
    Boolean((s.enrolled as Record<string, unknown>)[course.id]),
  );
  const subscribe = useEnrollmentStore((s) => s.subscribe);
  const [isEnrolledLocal, setIsEnrolledLocal] = useState(isEnrolled);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('syllabus');

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
  const enrolledCount = course.studentEnrolled;
  const ratingReviews = course.ratingCount;
  const outcomes = course.outcomes?.length ? course.outcomes : SPEC_OUTCOMES;
  const curriculum = course.curriculum;

  const sectionCount = curriculum.length;
  const lectureCount = curriculum.reduce(
    (sum, s) => sum + s.lessons.length,
    0,
  );
  const quizCount = curriculum.reduce(
    (sum, s) => sum + s.lessons.filter((l) => l.type === 'QUIZ').length,
    0,
  );

  return (
    <div
      className="w-full"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* =========================================================
       * 1) DARK ACADEMIC HERO
       * ========================================================= */}
      <section className="bg-[#0F172A] text-white pt-8 pb-20 border-b border-slate-800 relative overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300">IELTS Academic</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-semibold truncate max-w-[280px]">
              Intensive Master 7.5+
            </span>
          </nav>

          {/* Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold px-3 py-1 rounded-md">
              IELTS ACADEMIC
            </span>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-md">
              TARGET BAND 7.5+
            </span>
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold px-3 py-1 rounded-md">
              SPECIAL 30% OFF
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-2 mb-3 leading-tight max-w-4xl">
            {course.title}
          </h1>

          {/* Sub-headline */}
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-4 max-w-3xl">
            Comprehensive Cambridge-standard curriculum with adaptive
            diagnostic mock tests, AI evaluation, and 1-on-1 private
            mentorship.
          </p>

          {/* Metrics */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="text-amber-400 font-bold text-base"
                aria-hidden="true"
              >
                ★
              </span>
              <span className="font-extrabold text-white">
                {course.rating.toFixed(1)}
              </span>
              <span className="text-slate-400">
                ({ratingReviews.toLocaleString('en-US')} ratings)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="font-bold text-white">
                  {enrolledCount.toLocaleString('en-US')}
                </strong>{' '}
                enrolled students
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="font-bold text-white">
                  {durationHours}
                </strong>{' '}
                lecture hours
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="font-bold text-white">
                  {totalLessons}
                </strong>{' '}
                modules
              </span>
            </div>
          </div>

          {/* Instructor Strip */}
          <div className="mt-6 flex items-center gap-3">
            <img
              src={course.mentor.avatarUrl}
              alt={course.mentor.fullName}
              className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-700 shadow-sm object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <p className="text-sm text-slate-400">
                Created by{' '}
                <span className="text-white font-bold">
                  {course.mentor.fullName}, M.Ed
                </span>{' '}
                • {course.mentor.title}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
       * 2) 2-COLUMN BALANCED WORKSPACE
       * ========================================================= */}
      <section className="bg-[#F8FAFC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ========== LEFT — Unified White Sheet ========== */}
            <main className="lg:col-span-8 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-8">
                {/* Section 1: Learning Outcomes */}
                <section>
                  <header className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      Learning Outcomes
                    </p>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">
                      What You Will Achieve
                    </h2>
                    <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
                      A guaranteed pathway to IELTS 7.5+ through structured
                      milestones and mentor feedback.
                    </p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {outcomes.slice(0, 6).map((o) => (
                      <div
                        key={o}
                        className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50/60 border border-slate-100"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check
                            className="w-3 h-3 text-white"
                            strokeWidth={3}
                          />
                        </span>
                        <span className="text-sm text-slate-700 leading-snug">
                          {o}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="border-t border-slate-100" />

                {/* Section 2: Curriculum Breakdown */}
                <section>
                  <header className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Curriculum
                    </p>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">
                      Curriculum Breakdown
                    </h2>
                  </header>
                  {/* Tab bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto -mx-2 px-2">
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'syllabus' as const, label: 'Course Syllabus' },
                        {
                          key: 'vocabulary' as const,
                          label: 'Academic Vocabulary Bank',
                        },
                      ].map((t) => {
                        const active = tab === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={cn(
                              'relative px-4 py-3.5 text-sm font-bold whitespace-nowrap transition-colors',
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
                      {sectionCount} Modules • {lectureCount} Lectures •{' '}
                      {quizCount} Quizzes
                    </span>
                  </div>

                  <div className="mt-4">
                    {tab === 'syllabus' ? (
                      <CurriculumList sections={curriculum} />
                    ) : (
                      <VocabularyGrid cards={course.vocabularyBank} />
                    )}
                  </div>
                </section>

                <div className="border-t border-slate-100" />

                {/* Section 3: Prerequisites */}
                <section>
                  <header className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Prerequisites
                    </p>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">
                      Program Prerequisites &amp; Requirements
                    </h2>
                  </header>
                  <ul className="space-y-3">
                    {SPEC_REQUIREMENTS.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                          <Check
                            className="w-3 h-3 text-[#0052CC]"
                            strokeWidth={3}
                          />
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="border-t border-slate-100" />

                {/* Section 4: Student Feedback */}
                <section>
                  <header className="mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0052CC] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Student Reviews
                    </p>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">
                      Verified Student Feedback
                    </h2>
                  </header>

                  {/* Rating summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-5xl font-extrabold text-slate-900 leading-none">
                          {course.rating.toFixed(1)}
                        </p>
                        <div className="flex items-center gap-0.5 mt-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">
                          Based on {ratingReviews.toLocaleString('en-US')}{' '}
                          verified reviews
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {RATING_DISTRIBUTION.map((d) => (
                        <div
                          key={d.stars}
                          className="flex items-center gap-2.5 text-xs"
                        >
                          <span className="w-3 text-slate-500 font-semibold">
                            {d.stars}★
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${d.pct}%` }}
                            />
                          </div>
                          <span className="w-9 text-right text-slate-500">
                            {d.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SPEC_REVIEWS.map((r) => (
                      <article
                        key={r.name}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0"
                            aria-hidden="true"
                          >
                            {r.avatar}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-900">
                              {r.name}
                            </p>
                            <p className="text-xs text-slate-500">{r.role}</p>
                          </div>
                          <span className="text-xs text-slate-400">
                            {r.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-3">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                          {r.body}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </main>

            {/* ========== RIGHT — Sticky Pricing Card ========== */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-4">
                  {/* Video thumbnail */}
                  <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
                    <img
                      src={course.coverUrl}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center"
                      aria-label="Watch course preview"
                    >
                      <div
                        className={cn(
                          'w-16 h-16 rounded-full bg-white/95 flex items-center justify-center',
                          'shadow-2xl transition-transform group-hover:scale-110',
                          'backdrop-blur-sm',
                        )}
                      >
                        <PlayCircle className="w-8 h-8 text-[#0052CC]" />
                      </div>
                    </button>
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm">
                      <Globe className="w-3 h-3" />
                      Watch Course Preview
                    </span>
                  </div>

                  {/* Pricing block */}
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-extrabold text-3xl text-slate-900 leading-none">
                        3,490,000 VND
                      </p>
                      <p className="line-through text-slate-400 text-sm">
                        4,990,000 VND
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-rose-600 font-bold text-xs">
                        Save {discount}% Today
                      </p>
                      <p className="text-slate-400 text-[11px] font-semibold">
                        ≈ $149 USD
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  {isEnrolledLocal ? (
                    <button
                      type="button"
                      onClick={() => navigate('/my-courses')}
                      className={cn(
                        'bg-emerald-500 hover:bg-emerald-600 text-white font-bold',
                        'h-12 rounded-xl w-full shadow-md text-sm',
                        'inline-flex items-center justify-center gap-2',
                        'transition-all',
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
                        'bg-blue-600 hover:bg-blue-700 text-white font-bold',
                        'h-12 rounded-xl w-full shadow-md text-sm',
                        'inline-flex items-center justify-center gap-2',
                        'transition-all',
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
                      'border border-slate-300 hover:bg-slate-50',
                      'text-slate-700 font-semibold h-11 rounded-xl w-full text-sm',
                      'inline-flex items-center justify-center gap-2',
                      'transition-all bg-white',
                    )}
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    Take Free Placement Test
                  </button>

                  {/* Deliverables Checklist */}
                  <ul className="space-y-3 pt-4 border-t border-slate-100">
                    {SPEC_INCLUDES.map(({ icon: Icon, text }) => (
                      <li
                        key={text}
                        className="flex items-start gap-2.5 text-sm text-slate-600"
                      >
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

                  {/* Guarantee */}
                  <p className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    30-Day Money-Back Guarantee • Lifetime Content Access
                  </p>
                </div>

                {/* Help banner */}
                <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
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
                      <p className="font-bold text-sm text-slate-900">
                        Have questions?
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Contact our Academic Support at{' '}
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
              </div>
            </aside>
          </div>
        </div>
      </section>

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
        open && 'border-slate-300 bg-slate-50/30',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5',
          'bg-slate-50/40 hover:bg-slate-100/80 transition-colors text-left',
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
            {section.lessons.length} lectures • {hours}h {minutes}m
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

export default CourseDetailPage;
