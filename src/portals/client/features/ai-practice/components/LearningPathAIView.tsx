/**
 * LearningPathAIView — Lộ trình mục tiêu & Phòng luyện viết với AI
 * -----------------------------------------------------------
 * Phần 1: Lộ trình chinh phục mục tiêu cá nhân (3 chặng với progress)
 * Phần 2: Luyện viết + chấm điểm tự động bằng AI
 *   - Đề bài mẫu
 *   - Editor có bộ đếm từ
 *   - Nút "Chấm điểm & Phân tích chi tiết" (gradient electric violet)
 *   - Kết quả: vòng tròn điểm + 4 tiêu chí + gợi ý collocations + sửa lỗi
 */

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Wand2,
  Flag,
  Send,
  PenLine,
  Languages,
  Link2,
  CheckCheck,
  Lightbulb,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';

/* ============================================================
 *  Dữ liệu
 * ============================================================ */
interface Milestone {
  id: string;
  order: number;
  title: string;
  bandLabel: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  percent: number;
  description: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    order: 1,
    title: 'Nền tảng 5.0 - 5.5',
    bandLabel: 'Band 5.0 - 5.5',
    status: 'COMPLETED',
    percent: 100,
    description: 'Hoàn thiện ngữ pháp nền & 1500 từ vựng cốt lõi',
  },
  {
    id: 'm2',
    order: 2,
    title: 'Bứt phá 6.0 - 6.5',
    bandLabel: 'Band 6.0 - 6.5',
    status: 'IN_PROGRESS',
    percent: 70,
    description: 'Chiến lược làm bài 4 kỹ năng & chấm chính giảng viên',
  },
  {
    id: 'm3',
    order: 3,
    title: 'Đạt chuẩn 7.0 - 7.5+',
    bandLabel: 'Band 7.0 - 7.5+',
    status: 'UPCOMING',
    percent: 0,
    description: 'Luyện đề cường độ cao & hoàn thiện Speaking fluency',
  },
];

const WRITING_PROMPT =
  'Some people believe that university education should be free for everyone. To what extent do you agree or disagree?';

const SAMPLE_ANSWER =
  'Nowadays, the question of whether higher education should be provided free of charge has sparked considerable debate. While I acknowledge that tuition fees may place a financial burden on some families, I largely disagree with the view that universities should be entirely free for all students.\n\nOn the one hand, free university education would undoubtedly promote equal access to knowledge and create more opportunities for talented students from low-income backgrounds. For example, several European countries such as Germany and Norway have adopted this policy, and they have witnessed a significant increase in the proportion of skilled workers.\n\nOn the other hand, completely free education could place an enormous strain on government budgets and potentially reduce the quality of teaching and infrastructure. Furthermore, when students contribute financially, they tend to take their studies more seriously.\n\nIn conclusion, I believe that university education should be partially subsidised rather than completely free, with scholarships targeted at students from disadvantaged backgrounds.';

interface WritingCritique {
  overallBand: number;
  criteria: {
    key: 'task' | 'coherence' | 'lexical' | 'grammar';
    label: string;
    band: number;
    note: string;
    improvements: string[];
  }[];
}

const SAMPLE_CRITIQUE: WritingCritique = {
  overallBand: 7.0,
  criteria: [
    {
      key: 'task',
      label: 'Mức độ hoàn thành bài viết (Task Achievement)',
      band: 7.0,
      note: 'Bài viết trả lời đúng đề, quan điểm rõ ràng xuyên suốt. Nên triển khai thêm 1 ví dụ cụ thể ở đoạn 2 để tăng tính thuyết phục.',
      improvements: [
        'Bổ sung số liệu: "According to UNESCO, only 27% of low-income students access tertiary education."',
        'Mở rộng ví dụ quốc gia ngoài châu Âu (ví dụ: Brazil, Argentina).',
      ],
    },
    {
      key: 'coherence',
      label: 'Độ mạch lạc & liên kết (Coherence & Cohesion)',
      band: 7.5,
      note: 'Cấu trúc 4 đoạn chuẩn, sử dụng liên kết tốt. Có thể đa dạng hoá linking words.',
      improvements: [
        'Thay "Furthermore" bằng "What is more" hoặc "In addition" để tránh lặp.',
        'Dùng "Conversely" khi đối lập quan điểm.',
      ],
    },
    {
      key: 'lexical',
      label: 'Vốn từ vựng học thuật (Lexical Resource)',
      band: 6.5,
      note: 'Vốn từ ổn nhưng chưa khai thác collocations academic. Dưới đây là các cụm từ nâng cao nên thay thế:',
      improvements: [
        'place a financial burden → impose a significant financial burden on',
        'take studies seriously → approach their studies with greater rigour',
        'skilled workers → a highly-skilled workforce',
        'equal access → equitable access to higher education',
      ],
    },
    {
      key: 'grammar',
      label: 'Độ chính xác ngữ pháp (Grammatical Range & Accuracy)',
      band: 7.0,
      note: 'Cấu trúc câu phức sử dụng khá tốt. Có 1-1 lỗi nhỏ cần chỉnh sửa:',
      improvements: [
        'Sai: "they have witnessed a significant increase" → Đúng: "they have witnessed a significant increase in the number of skilled workers" (thiếu tân ngữ).',
        'Sai: "policies is adopted" → Đúng: "policies have been adopted" (chia thì & thể bị động).',
        'Nên thử: câu điều kiện loại 3 để tăng điểm Grammatical Range: "Had the government not invested in scholarships, many talented students would have been denied opportunities."',
      ],
    },
  ],
};

/* ============================================================
 *  Component chính
 * ============================================================ */
export const LearningPathAIView: React.FC = () => {
  // ===== Phần 1: lộ trình =====
  // (hiện tại chỉ render, không cần state)

  // ===== Phần 2: luyện viết =====
  const [essay, setEssay] = useState(SAMPLE_ANSWER);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<WritingCritique | null>(null);

  const wordCount = useMemo(
    () => essay.trim().split(/\s+/).filter(Boolean).length,
    [essay],
  );
  const minWords = 250;
  const isMinReached = wordCount >= minWords;

  const handleGrade = async () => {
    if (!isMinReached) return;
    setGrading(true);
    setResult(null);
    // Mô phỏng thời gian AI chấm
    await new Promise((r) => setTimeout(r, 1500));
    setGrading(false);
    setResult(SAMPLE_CRITIQUE);
  };

  const handleReset = () => {
    setEssay('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Sparkles className="w-3.5 h-3.5" />
          Lộ trình cá nhân hoá
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lộ trình mục tiêu & Phòng luyện viết với Trí tuệ Nhân tạo
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Theo dõi tiến trình học tập theo từng chặng mục tiêu và luyện viết
          học thuật với hệ thống chấm điểm tự động chuẩn IELTS.
        </p>
      </header>

      {/* ============== PHẦN 1: LỘ TRÌNH ============== */}
      <section aria-label="Lộ trình chinh phục mục tiêu">
        <SectionHeader
          title="Lộ trình chinh phục mục tiêu cá nhân"
          subtitle="Các chặng được thiết kế theo lộ trình Cambridge chuẩn hoá"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MILESTONES.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </div>
      </section>

      {/* ============== PHẦN 2: LUYỆN VIẾT VỚI AI ============== */}
      <section aria-label="Phòng luyện viết với AI">
        <SectionHeader
          title="Luyện viết và chấm điểm tự động bằng Trí tuệ Nhân tạo"
          subtitle="Hệ thống chấm theo 4 tiêu chí chính thức của hội đồng khảo thí"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">
          {/* ====== EDITOR (Trái) ====== */}
          <Card noPadding>
            <div className="p-5 border-b border-slate-100 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="ai" size="sm" icon={Sparkles}>
                  Đề luyện Writing Task 2
                </Badge>
                <Badge variant="primary" size="sm" icon={PenLine}>
                  Opinion Essay
                </Badge>
                <Badge variant="neutral" size="sm">
                  Tối thiểu 250 từ
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                {WRITING_PROMPT}
              </p>
            </div>

            <div className="p-5">
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                rows={14}
                placeholder="Nhập bài viết của bạn tại đây…"
                className={cn(
                  'w-full rounded-input border border-slate-200 bg-white',
                  'p-3.5 text-sm text-slate-800 leading-relaxed resize-y font-sans',
                  'focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10',
                )}
              />

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 font-bold tabular-nums',
                      isMinReached ? 'text-status-success' : 'text-slate-500',
                    )}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Đã viết{' '}
                    <span
                      className={cn(
                        'text-base',
                        isMinReached ? 'text-status-success' : 'text-slate-800',
                      )}
                    >
                      {wordCount}
                    </span>{' '}
                    từ
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500">
                    Tối thiểu {minWords} từ
                  </span>
                  {!isMinReached && (
                    <Badge variant="warning" size="sm">
                      Còn thiếu {minWords - wordCount} từ
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    leftIcon={RotateCcw}
                    onClick={handleReset}
                    disabled={grading}
                  >
                    Viết lại
                  </Button>
                  <Button
                    variant="ai"
                    size="md"
                    leftIcon={Wand2}
                    isLoading={grading}
                    disabled={grading || !isMinReached}
                    onClick={handleGrade}
                    className="relative"
                  >
                    {grading ? 'Đang chấm điểm…' : 'Chấm điểm & Phân tích chi tiết'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* ====== RESULT (Phải) ====== */}
          <div className="lg:sticky lg:top-[112px]">
            {result ? (
              <CritiquePanel critique={result} />
            ) : (
              <EmptyResult isGrading={grading} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ============================================================
 *  Sub components
 * ============================================================ */
const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="mb-3">
    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
      {title}
    </h2>
    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
  </div>
);

const MilestoneCard: React.FC<{ milestone: Milestone }> = ({ milestone }) => {
  const { status, title, bandLabel, percent, description } = milestone;
  const isDone = status === 'COMPLETED';
  const isActive = status === 'IN_PROGRESS';
  const isUpcoming = status === 'UPCOMING';

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isActive && 'border-primary/40 ring-2 ring-primary/10',
      )}
      noPadding
    >
      <div
        className={cn(
          'h-1 w-full',
          isDone
            ? 'bg-status-success'
            : isActive
              ? 'bg-primary'
              : 'bg-slate-200',
        )}
        aria-hidden
      />
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant={isUpcoming ? 'neutral' : isDone ? 'success' : 'primary'}
            size="sm"
            icon={
              isDone
                ? CheckCircle2
                : isActive
                  ? TrendingUp
                  : Flag
            }
          >
            {isDone ? 'Hoàn thành' : isActive ? 'Đang thực hiện' : 'Mục tiêu đích'}
          </Badge>
          <span
            className={cn(
              'text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md',
              isDone
                ? 'bg-status-success-bg text-status-success'
                : isActive
                  ? 'bg-primary-tint text-primary'
                  : 'bg-slate-100 text-slate-500',
            )}
          >
            Chặng {milestone.order}
          </span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-ai font-semibold mt-0.5">{bandLabel}</p>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {description}
        </p>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-slate-500">
              {isUpcoming
                ? 'Sẽ bắt đầu sau khi hoàn thành chặng trước'
                : 'Tiến độ'}
            </span>
            <span
              className={cn(
                'font-extrabold tabular-nums',
                isDone
                  ? 'text-status-success'
                  : isActive
                    ? 'text-primary'
                    : 'text-slate-400',
              )}
            >
              {percent}%
            </span>
          </div>
          <div
            className="h-2 rounded-full bg-slate-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isDone
                  ? 'bg-status-success'
                  : isActive
                    ? 'bg-primary'
                    : 'bg-slate-200',
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

const EmptyResult: React.FC<{ isGrading: boolean }> = ({ isGrading }) => (
  <Card className="text-center py-12 h-full flex flex-col items-center justify-center">
    <div
      className={cn(
        'w-16 h-16 rounded-card bg-ai-gradient flex items-center justify-center shadow-ai-glow mb-4',
        isGrading && 'animate-pulse',
      )}
    >
      <Wand2 className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-base font-extrabold text-slate-900">
      {isGrading ? 'Đang phân tích bài viết của bạn…' : 'Kết quả đánh giá'}
    </h3>
    <p className="text-xs text-slate-500 mt-1.5 max-w-[280px]">
      {isGrading
        ? 'Trí tuệ Nhân tạo đang chấm điểm theo 4 tiêu chí IELTS chính thức.'
        : 'Hoàn thành bài viết tối thiểu 250 từ và nhấn nút "Chấm điểm" để nhận phân tích chi tiết.'}
    </p>
  </Card>
);

const CritiquePanel: React.FC<{ critique: WritingCritique }> = ({
  critique,
}) => {
  const CRIT_ICON: Record<WritingCritique['criteria'][number]['key'], React.ElementType> = {
    task: CheckCheck,
    coherence: Link2,
    lexical: Languages,
    grammar: PenLine,
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-140px)] lg:overflow-y-auto pr-1">
      {/* Overall band */}
      <Card className="bg-gradient-to-br from-primary-tint/60 via-white to-ai/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-ai/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <BandRing band={critique.overallBand} />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Điểm tổng ước tính
            </p>
            <p className="text-lg font-extrabold text-slate-900 leading-tight">
              Band {critique.overallBand.toFixed(1)} IELTS
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Đánh giá theo 4 tiêu chí khảo thí chính thức
            </p>
          </div>
        </div>
      </Card>

      {/* Criteria cards */}
      {critique.criteria.map((c) => {
        const Icon = CRIT_ICON[c.key];
        return (
          <Card key={c.key} noPadding>
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-ai/10 text-ai flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    {c.label}
                  </p>
                  <span className="inline-flex items-baseline gap-0.5 px-2 py-0.5 rounded-md bg-primary-tint">
                    <span className="text-[10px] font-bold text-slate-500">
                      Band
                    </span>
                    <span className="text-sm font-extrabold text-primary tabular-nums">
                      {c.band.toFixed(1)}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mt-2">
                  {c.note}
                </p>
                {c.improvements.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-ai flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Gợi ý cải thiện
                    </p>
                    <ul className="space-y-1.5">
                      {c.improvements.map((line, idx) => (
                        <li
                          key={idx}
                          className="text-[12px] text-slate-700 leading-relaxed pl-3 border-l-2 border-ai/30"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="md"
          leftIcon={Send}
          className="flex-1"
        >
          Gửi bài cho giảng viên
        </Button>
        <Button
          variant="ai"
          size="md"
          leftIcon={Sparkles}
          className="flex-1"
        >
          Luyện bài mới
        </Button>
      </div>
    </div>
  );
};

/* Vòng tròn điểm số — SVG ring */
const BandRing: React.FC<{ band: number }> = ({ band }) => {
  // Quy đổi 0-9 band sang phần trăm vòng tròn (max 9)
  const pct = Math.max(0, Math.min(1, band / 9));
  const radius = 38;
  const stroke = 8;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={stroke}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#bandGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none">
          {band.toFixed(1)}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5">
          Band
        </span>
      </div>
    </div>
  );
};

export default LearningPathAIView;
