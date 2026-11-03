/**
 * practiceImport — đọc file đề của từng kỹ năng thành section + câu hỏi cho đề luyện tập AI
 * -----------------------------------------------------------
 * Mỗi phần thi admin chọn 1 kỹ năng + 1 file (PDF / Word / .txt) hoặc dán nội dung:
 *   - File đã viết theo mẫu nhập đề ([SECTION], *đáp án…) → đọc thẳng trên trình duyệt
 *   - PDF hoặc văn bản viết tự do → Claude đọc (POST /admin/ai-import) và chuyển sang mẫu
 * Kết quả luôn được ép về đúng kỹ năng của phần thi (Reading / Listening có đáp án để tự chấm,
 * Writing / Speaking là câu [ESSAY] để AI chấm khi học viên nộp bài).
 */

import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { SKILL_LABEL, type ScaleInfo } from '@/shared/constants/examScales';
import { aiImportApi } from '@/portals/admin/features/exam/services/adminExamService';
import {
  MAX_PDF_BYTES,
  fileToBase64,
  isPdfFile,
  isTemplateText,
  parseExamText,
  readExamFile,
  type ImportResult,
  type ImportSection,
} from '@/portals/admin/features/exam/utils/examImport';

export type PracticeSkill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

export const PRACTICE_SKILLS: PracticeSkill[] = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];

/** Một phần thi admin đang soạn: kỹ năng + nguồn đề (file hoặc nội dung dán vào) */
export interface SectionSource {
  skill: PracticeSkill;
  file: File | null;
  text: string;
  /** Link file nghe cho Listening (khi file đề không có) */
  audioUrl: string;
}

export interface SectionReadResult {
  sections: ImportSection[];
  errors: ImportResult['errors'];
  questionCount: number;
  /** true = Claude đọc (nhắc admin kiểm tra đáp án) */
  fromAi: boolean;
}

/** Đọc một phần thi; ném lỗi nếu không đọc được file / AI lỗi. */
export async function readSectionSource(
  source: SectionSource,
  scale: ScaleInfo,
  certificateName?: string,
): Promise<SectionReadResult> {
  // Phần thi của chứng chỉ ứng với kỹ năng này (để chấm theo thang của phần), không có thì dùng tên kỹ năng
  const parts = scale.parts.filter((p) => p.partId && p.skill === source.skill);
  const tokens = parts.length ? parts.map((p) => p.name) : [source.skill];
  let fromAi = false;

  const askAi = async (fileBase64?: string, text?: string) => {
    fromAi = true;
    const res = unwrapOrThrow(
      await aiImportApi({
        target: 'EXAM',
        certificateName,
        sections: tokens,
        fileName: source.file?.name,
        fileBase64,
        text,
      }),
    );
    return res.content ?? '';
  };

  let text: string;
  if (source.file) {
    if (isPdfFile(source.file)) {
      if (source.file.size > MAX_PDF_BYTES) throw new Error('File PDF tối đa 15MB');
      text = await askAi(await fileToBase64(source.file));
    } else {
      const raw = await readExamFile(source.file);
      text = isTemplateText(raw) ? raw : await askAi(undefined, raw);
    }
  } else {
    const raw = source.text.trim();
    if (!raw) throw new Error('Chưa chọn file hoặc dán nội dung đề');
    text = isTemplateText(raw) ? raw : await askAi(undefined, raw);
  }

  // Không có [SECTION] nào → mở sẵn một section của kỹ năng này để câu hỏi không bị lạc
  if (!/^\s*\[SECTION\]/im.test(text)) {
    text = `[SECTION] ${tokens[0]} | ${SKILL_LABEL[source.skill]}\n${text}`;
  }
  const parsed = parseExamText(text, parts);

  // Listening: section không có [AUDIO] riêng dùng chung file nghe của section trước trong cùng file đề
  // (VD Part 1 và Part 2 cùng một bản ghi), không có thì dùng link admin nhập ở ô "Link file nghe"
  let audioUrl = source.audioUrl.trim() || undefined;
  const sections: ImportSection[] = parsed.sections.map((s) => {
    if (source.skill === 'LISTENING' && s.request.audioUrl) audioUrl = s.request.audioUrl;
    return {
      ...s,
      request: {
        ...s.request,
        // Ép đúng kỹ năng của phần thi: AI chấm Writing / Speaking dựa vào loại section
        sectionType: source.skill,
        audioUrl: source.skill === 'LISTENING' ? audioUrl : undefined,
      },
    };
  });
  if (parsed.looseQuestions.length && sections.length) {
    sections[0].questions.unshift(...parsed.looseQuestions);
  }
  return {
    sections,
    errors: parsed.errors,
    questionCount: sections.reduce((n, s) => n + s.questions.length, 0),
    fromAi,
  };
}

/* ---------- Thời gian làm bài từng phần thi ---------- */

export const MIN_SECTION_MINUTES = 1;
export const MAX_SECTION_MINUTES = 240;
export const MAX_EXAM_MINUTES = 600;

/** Thời gian mặc định (phút) của từng kỹ năng theo preset chứng chỉ (Dev 2) — admin sửa được trên form */
const PRESET_DURATIONS: Record<string, Partial<Record<PracticeSkill, number>>> = {
  IELTS: { LISTENING: 30, READING: 60, WRITING: 60, SPEAKING: 14 },
  TOEIC_LR: { LISTENING: 45, READING: 75 },
  TOEIC_SW: { WRITING: 60, SPEAKING: 20 },
  VSTEP: { LISTENING: 40, READING: 60, WRITING: 60, SPEAKING: 12 },
  TOEFL_NEW: { LISTENING: 29, READING: 30, WRITING: 23, SPEAKING: 8 },
  APTIS: { LISTENING: 40, READING: 35, WRITING: 50, SPEAKING: 12 },
};

/** Đề không gắn chứng chỉ / preset chưa khai báo / kỹ năng không có trong chứng chỉ */
const FALLBACK_DURATIONS: Record<PracticeSkill, number> = {
  LISTENING: 30,
  READING: 30,
  WRITING: 30,
  SPEAKING: 15,
};

export function defaultDuration(preset: string | undefined, skill: PracticeSkill): number {
  return (preset ? PRESET_DURATIONS[preset]?.[skill] : undefined) ?? FALLBACK_DURATIONS[skill];
}

/**
 * Chia thời gian của 1 phần thi cho các section con đọc ra từ file đề (VD Reading 60 phút, 3 passage → 20/20/20).
 * Chia đều, phần dư cộng vào section đầu; mỗi section tối thiểu 1 phút (BE yêu cầu).
 */
export function splitMinutes(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const rest = total - base * count;
  return Array.from({ length: count }, (_, i) => Math.max(MIN_SECTION_MINUTES, base + (i === 0 ? rest : 0)));
}
