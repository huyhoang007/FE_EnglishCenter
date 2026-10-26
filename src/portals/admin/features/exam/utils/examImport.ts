/**
 * examImport — đọc file Word (.docx) / .txt viết theo mẫu thành section + câu hỏi (Dev 3)
 * -----------------------------------------------------------
 * Mẫu (mỗi dòng một mục, không phân biệt hoa thường ở thẻ):
 *   [SECTION] READING | Part 2 - Reading      ← mở section mới (LISTENING/READING/WRITING/SPEAKING/GENERAL)
 *   [INSTRUCTIONS] Đọc đoạn văn và trả lời     ← hướng dẫn của section
 *   [PASSAGE] Tom moved to London...           ← đoạn đọc (các dòng sau nối tiếp tới thẻ / câu hỏi kế)
 *   [AUDIO] https://.../audio.mp3              ← file nghe (chỉ section LISTENING)
 *   1. Where does Tom work? {2}                ← câu trắc nghiệm, {2} = 2 điểm (mặc định 1)
 *   A. In a bank
 *   *B. In a bakery                            ← dấu * trước chữ cái = đáp án đúng
 *   2. [TF] Tom studies in the morning.
 *   = False                                    ← đáp án đúng/sai
 *   3. [FILL] Tom ___ to London last year.
 *   = moved | move                             ← các đáp án được chấp nhận, ngăn bằng |
 *   4. [MATCH] Nối từ với nghĩa.
 *   - bakery = tiệm bánh                       ← mỗi cặp nối một dòng
 *   5. [ESSAY] Describe your hometown.          ← tự luận, mentor chấm
 *   [EXPLAIN] Giải thích đáp án                 ← giải thích cho câu ngay trên
 * Câu hỏi đứng trước mọi [SECTION] là câu không thuộc section.
 * Dòng trống được bỏ qua; dòng bắt đầu bằng # là ghi chú.
 */

import type { QuestionType } from '@/shared/types';
import type { CreateQuestionRequest, CreateSectionRequest, QuestionOptionInput } from '../services/adminExamService';

export interface ImportQuestion {
  line: number;
  request: Omit<CreateQuestionRequest, 'sectionId'>;
}

export interface ImportSection {
  line: number;
  request: CreateSectionRequest;
  questions: ImportQuestion[];
}

export interface ImportResult {
  sections: ImportSection[];
  /** Câu hỏi không thuộc section nào */
  looseQuestions: ImportQuestion[];
  /** text: nội dung dòng bị lỗi để người dùng tìm trong file */
  errors: { line: number; message: string; text?: string }[];
  questionCount: number;
}

export const SECTION_TYPES_ALL = ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'GENERAL'];

const TYPE_TAGS: Record<string, QuestionType> = {
  TF: 'true_false',
  FILL: 'fill_blank',
  MATCH: 'matching',
  ESSAY: 'essay',
  MC: 'multiple_choice',
};

const RE_TAG = /^\[(SECTION|INSTRUCTIONS|PASSAGE|AUDIO|EXPLAIN)\]\s*(.*)$/i;
const RE_QUESTION = /^(?:Câu\s*)?(\d+)\s*[.):]\s*(?:\[(TF|FILL|MATCH|ESSAY|MC)\]\s*)?(.+)$/i;
const RE_OPTION = /^(\*)?\s*([A-H])\s*[.)]\s*(.+)$/;
const RE_POINTS = /\{\s*(\d+(?:[.,]\d+)?)\s*\}\s*$/;

interface DraftQuestion {
  line: number;
  type: QuestionType;
  text: string;
  points: number;
  options: { text: string; correct: boolean }[];
  answers: string[];
  pairs: { left: string; right: string }[];
  explanation: string;
}

/** Đọc nội dung chữ của file: .docx qua mammoth, .txt đọc thẳng. */
export async function readExamFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return file.text();
  if (name.endsWith('.doc')) {
    throw new Error('File .doc đời cũ không đọc được. Mở bằng Word rồi "Lưu thành" .docx và thử lại.');
  }
  if (!name.endsWith('.docx')) throw new Error('Chỉ nhận file .docx hoặc .txt');
  // Tải thư viện khi cần để không làm nặng trang admin
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}

export function parseExamText(text: string, allowedSectionTypes: string[] = SECTION_TYPES_ALL): ImportResult {
  const lines = text.replace(/\r/g, '').split('\n');
  const sections: ImportSection[] = [];
  const looseQuestions: ImportQuestion[] = [];
  const errors: ImportResult['errors'] = [];

  let section: ImportSection | null = null;
  let question: DraftQuestion | null = null;
  /** Thẻ đang nhận thêm dòng nối tiếp (đoạn đọc / hướng dẫn / giải thích / thân câu hỏi) */
  let continuing: 'passage' | 'instructions' | 'explain' | 'question' | null = null;

  const finishQuestion = () => {
    if (!question) return;
    const built = buildQuestion(question);
    if (typeof built === 'string') errors.push({ line: question.line, message: built });
    else (section ? section.questions : looseQuestions).push({ line: question.line, request: built });
    question = null;
  };

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.trim();
    // Word tách mỗi đoạn bằng dòng trống → bỏ qua; dòng bắt đầu bằng # là ghi chú
    if (!line || line.startsWith('#')) return;

    const tag = RE_TAG.exec(line);
    if (tag) {
      const name = tag[1].toUpperCase();
      const value = tag[2].trim();
      if (name === 'EXPLAIN') {
        if (!question) errors.push({ line: lineNo, message: '[EXPLAIN] phải đứng sau một câu hỏi' });
        else {
          question.explanation = value;
          continuing = 'explain';
        }
        return;
      }
      finishQuestion();
      if (name === 'SECTION') {
        const [typePart, ...titleParts] = value.split('|');
        const sectionType = typePart.trim().toUpperCase();
        const title = titleParts.join('|').trim() || sectionType;
        if (!allowedSectionTypes.includes(sectionType)) {
          errors.push({
            line: lineNo,
            message: `Loại section "${typePart.trim()}" không hợp lệ cho chứng chỉ này (chỉ nhận: ${allowedSectionTypes.join(', ')})`,
          });
        }
        section = { line: lineNo, request: { title, sectionType }, questions: [] };
        sections.push(section);
        continuing = null;
        return;
      }
      if (!section) {
        errors.push({ line: lineNo, message: `[${name}] phải nằm trong một [SECTION]` });
        return;
      }
      if (name === 'INSTRUCTIONS') {
        section.request.instructions = value;
        continuing = 'instructions';
      } else if (name === 'PASSAGE') {
        section.request.passageText = value;
        continuing = 'passage';
      } else if (name === 'AUDIO') {
        if (section.request.sectionType !== 'LISTENING') {
          errors.push({ line: lineNo, message: '[AUDIO] chỉ dùng cho section LISTENING' });
        } else section.request.audioUrl = value;
        continuing = null;
      }
      return;
    }

    const q = RE_QUESTION.exec(line);
    // Chỉ coi là câu mới khi không đang ở đáp án dạng "A." (câu hỏi luôn bắt đầu bằng số)
    if (q) {
      finishQuestion();
      let body = q[3].trim();
      let points = 1;
      const pts = RE_POINTS.exec(body);
      if (pts) {
        points = Number(pts[1].replace(',', '.'));
        body = body.replace(RE_POINTS, '').trim();
      }
      question = {
        line: lineNo,
        type: q[2] ? TYPE_TAGS[q[2].toUpperCase()] : 'multiple_choice',
        text: body,
        points,
        options: [],
        answers: [],
        pairs: [],
        explanation: '',
      };
      continuing = 'question';
      return;
    }

    if (question) {
      const opt = RE_OPTION.exec(line);
      if (opt && (question.type === 'multiple_choice' || question.type === 'true_false')) {
        question.options.push({ text: opt[3].trim(), correct: Boolean(opt[1]) });
        continuing = null;
        return;
      }
      if (line.startsWith('=')) {
        question.answers.push(
          ...line
            .slice(1)
            .split('|')
            .map((a) => a.trim())
            .filter(Boolean),
        );
        continuing = null;
        return;
      }
      if (line.startsWith('-') && question.type === 'matching') {
        const [left, ...right] = line.slice(1).split('=');
        question.pairs.push({ left: left.trim(), right: right.join('=').trim() });
        continuing = null;
        return;
      }
      if (continuing === 'question') {
        question.text = `${question.text}\n${line}`;
        return;
      }
      if (continuing === 'explain') {
        question.explanation = `${question.explanation}\n${line}`;
        return;
      }
      errors.push({ line: lineNo, message: `Không hiểu dòng: "${line.slice(0, 60)}"` });
      return;
    }

    if (section && continuing === 'passage') {
      section.request.passageText = `${section.request.passageText ?? ''}\n${line}`;
      return;
    }
    if (section && continuing === 'instructions') {
      section.request.instructions = `${section.request.instructions ?? ''} ${line}`;
      return;
    }
    errors.push({ line: lineNo, message: `Không hiểu dòng: "${line.slice(0, 60)}"` });
  });
  finishQuestion();

  sections.forEach((s) => {
    s.request.passageText = s.request.passageText?.trim() || undefined;
    s.request.instructions = s.request.instructions?.trim() || undefined;
  });
  const questionCount = sections.reduce((n, s) => n + s.questions.length, 0) + looseQuestions.length;
  if (!sections.length && !looseQuestions.length && !errors.length) {
    errors.push({ line: 0, message: 'Không tìm thấy section hay câu hỏi nào. Kiểm tra lại file theo hướng dẫn.' });
  }
  // Kèm nội dung dòng lỗi (số dòng của Word không khớp vì có dòng trống tự chèn), sắp theo thứ tự trong file
  const withText = errors
    .map((e) => ({ ...e, text: e.line > 0 ? lines[e.line - 1]?.trim() : undefined }))
    .sort((a, b) => a.line - b.line);
  return { sections, looseQuestions, errors: withText, questionCount };
}

/** Kiểm tra và đổi câu nháp thành request backend; trả về chuỗi lỗi nếu thiếu. */
function buildQuestion(q: DraftQuestion): Omit<CreateQuestionRequest, 'sectionId'> | string {
  const base = { questionType: q.type, questionText: q.text.trim(), points: q.points, explanation: q.explanation.trim() || undefined };
  if (!base.questionText) return 'Câu hỏi thiếu nội dung';
  if (!(q.points > 0)) return 'Điểm của câu phải lớn hơn 0';
  let options: QuestionOptionInput[] = [];

  switch (q.type) {
    case 'multiple_choice': {
      if (q.options.length < 2) return `Câu "${base.questionText.slice(0, 40)}" cần ít nhất 2 lựa chọn A, B…`;
      const correct = q.options.filter((o) => o.correct).length;
      if (correct !== 1) return `Câu "${base.questionText.slice(0, 40)}" phải có đúng 1 đáp án đánh dấu *`;
      options = q.options.map((o) => ({ optionText: o.text, isCorrect: o.correct }));
      break;
    }
    case 'true_false': {
      const ans = (q.answers[0] ?? q.options.find((o) => o.correct)?.text ?? '').toLowerCase();
      const isTrue = ['true', 'đúng', 't', 'yes'].includes(ans);
      const isFalse = ['false', 'sai', 'f', 'no'].includes(ans);
      if (!isTrue && !isFalse) return `Câu đúng/sai "${base.questionText.slice(0, 40)}" cần dòng "= True" hoặc "= False"`;
      options = [
        { optionText: 'True', isCorrect: isTrue },
        { optionText: 'False', isCorrect: isFalse },
      ];
      break;
    }
    case 'fill_blank':
      if (!q.answers.length) return `Câu điền từ "${base.questionText.slice(0, 40)}" cần dòng "= đáp án"`;
      options = q.answers.map((a) => ({ optionText: a, isCorrect: true }));
      break;
    case 'matching':
      if (q.pairs.length < 2 || q.pairs.some((p) => !p.left || !p.right)) {
        return `Câu nối "${base.questionText.slice(0, 40)}" cần ít nhất 2 dòng "- trái = phải"`;
      }
      options = q.pairs.map((p) => ({ optionText: `${p.left}::${p.right}`, isCorrect: true }));
      break;
    case 'essay':
      options = [];
      break;
  }
  return { ...base, options };
}

/** Nội dung file mẫu cho nút "Tải file mẫu" và ô hướng dẫn. */
export const IMPORT_TEMPLATE = `[SECTION] LISTENING | Part 1 - Listening
[INSTRUCTIONS] Nghe đoạn hội thoại và trả lời câu hỏi.
[AUDIO] https://example.com/audio/part1.mp3
1. Where does the woman want to go?
A. The airport
*B. The train station
C. The bus stop
[EXPLAIN] Người phụ nữ nói "I need to get to the train station".

[SECTION] READING | Part 2 - Reading
[INSTRUCTIONS] Đọc đoạn văn và trả lời câu hỏi.
[PASSAGE] Tom moved to London last year.
He works in a small bakery and goes to an English class every evening.
2. Where does Tom work?
A. In a bank
*B. In a bakery
C. In a school
D. In a library
3. [TF] Tom studies English in the morning.
= False
4. [FILL] Tom ___ to London last year. (move)
= moved
5. [MATCH] Nối từ với nghĩa tiếng Việt. {2}
- bakery = tiệm bánh
- evening = buổi tối
- class = lớp học

[SECTION] WRITING | Part 3 - Writing
[INSTRUCTIONS] Viết đoạn văn khoảng 120-150 từ.
6. [ESSAY] Describe your hometown. {6}
`;
