/**
 * parseVocabularyFile — Đọc file Excel / CSV và trả về mảng từ vựng
 * -------------------------------------------------------------------
 * Hỗ trợ: .xlsx, .xls, .csv
 *
 * Cột được map tự động bằng nhiều biến thể phổ biến:
 *   word        ← word, Word, WORD, từ, Từ vựng, english, English …
 *   ipa         ← ipa, IPA, phonetic, phiên âm …
 *   meaning     ← meaning, Meaning, nghĩa, Nghĩa tiếng Việt, vietnamese …
 *   partOfSpeech← part_of_speech, partOfSpeech, pos, Từ loại …
 *   example     ← example, Example, câu ví dụ, Ví dụ …
 *   audioUrl    ← audio_url, audioUrl, audio, link audio …
 *
 * Dùng SheetJS (`xlsx`) — phải `npm install xlsx` trước.
 */

import * as XLSX from 'xlsx';

/* =========================================================
 * Types
 * ========================================================= */

export interface ParsedVocabWord {
  word: string;
  ipa: string;
  meaning: string;
  audioUrl: string;
  partOfSpeech: string;
  example: string;
}

export interface ParseResult {
  /** Danh sách từ vựng hợp lệ đã parse được. */
  words: ParsedVocabWord[];
  /** Các dòng bị bỏ qua vì thiếu word hoặc meaning. */
  skippedRows: number;
  /** Tổng số dòng dữ liệu (không tính header). */
  totalRows: number;
  /** Tên các cột được phát hiện. */
  detectedColumns: string[];
}

/* =========================================================
 * Column alias mapping
 * ========================================================= */

/** Tất cả biến thể tên cột có thể dùng để map vào field. */
const COLUMN_ALIASES: Record<keyof ParsedVocabWord, string[]> = {
  word: [
    'word', 'words', 'english', 'english word', 'vocabulary', 'vocab',
    'từ', 'từ vựng', 'tu vung', 'tiếng anh', 'tieng anh', 'từ tiếng anh',
    'term', 'entry',
  ],
  ipa: [
    'ipa', 'phonetic', 'pronunciation', 'phiên âm', 'phien am',
    'transcription', 'phát âm', 'phat am',
  ],
  meaning: [
    'meaning', 'meanings', 'definition', 'vietnamese', 'translation',
    'nghĩa', 'nghia', 'nghĩa tiếng việt', 'tiếng việt', 'tieng viet',
    'nghĩa tv', 'dịch', 'dich',
  ],
  partOfSpeech: [
    'part of speech', 'partofspeech', 'part_of_speech', 'pos',
    'word type', 'type', 'từ loại', 'tu loai', 'loại từ', 'loai tu',
  ],
  example: [
    'example', 'examples', 'sentence', 'sample', 'usage',
    'ví dụ', 'vi du', 'câu ví dụ', 'cau vi du', 'câu mẫu',
  ],
  audioUrl: [
    'audio url', 'audiourl', 'audio_url', 'audio', 'audio link',
    'link audio', 'sound', 'sound url', 'mp3', 'link', 'url',
  ],
};

/**
 * So khớp tên cột (đã normalize) với field tương ứng.
 * Trả về tên field nếu khớp, `null` nếu không.
 */
function matchColumnToField(header: string): keyof ParsedVocabWord | null {
  const normalized = header
    .toLowerCase()
    .trim()
    .replace(/[_\-.*#()]/g, ' ')   // gạch dưới, dấu gạch → space
    .replace(/\s+/g, ' ')          // normalize multiple spaces
    .trim();

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((alias) => alias === normalized)) {
      return field as keyof ParsedVocabWord;
    }
  }
  return null;
}

/* =========================================================
 * Core parser
 * ========================================================= */

/**
 * Parse file Excel / CSV thành mảng từ vựng.
 *
 * @param file   File từ `<input type="file">`.
 * @returns      Kết quả parse gồm danh sách từ, số dòng bỏ qua, v.v.
 * @throws       Error nếu file không đọc được hoặc không có cột `word`.
 */
export async function parseVocabularyFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Lấy sheet đầu tiên
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File không có sheet nào');
  }

  const sheet = workbook.Sheets[sheetName];
  // Convert sheet → mảng JSON (row = object với key là header)
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,       // luôn trả string
  });

  if (rows.length === 0) {
    throw new Error('File không có dữ liệu (chỉ có header hoặc trống)');
  }

  // Phát hiện mapping cột
  const firstRow = rows[0];
  const headers = Object.keys(firstRow);

  const columnMap: Partial<Record<keyof ParsedVocabWord, string>> = {};
  const detectedColumns: string[] = [];

  for (const header of headers) {
    const field = matchColumnToField(header);
    if (field && !columnMap[field]) {
      columnMap[field] = header;
      detectedColumns.push(`${header} → ${field}`);
    }
  }

  // Phải có ít nhất cột `word`
  if (!columnMap.word) {
    throw new Error(
      'Không tìm thấy cột "Word" / "Từ vựng" trong file. ' +
      'Hãy đảm bảo header có cột: Word, Meaning, IPA, Part of Speech, Example, Audio URL.',
    );
  }

  // Parse từng dòng
  const words: ParsedVocabWord[] = [];
  let skippedRows = 0;

  for (const row of rows) {
    const word = String(row[columnMap.word!] ?? '').trim();

    // Bỏ qua dòng trống hoặc không có từ
    if (!word) {
      skippedRows++;
      continue;
    }

    const meaning = columnMap.meaning
      ? String(row[columnMap.meaning] ?? '').trim()
      : '';

    words.push({
      word,
      ipa: columnMap.ipa ? String(row[columnMap.ipa] ?? '').trim() : '',
      meaning,
      partOfSpeech: columnMap.partOfSpeech
        ? String(row[columnMap.partOfSpeech] ?? '').trim()
        : '',
      example: columnMap.example
        ? String(row[columnMap.example] ?? '').trim()
        : '',
      audioUrl: columnMap.audioUrl
        ? String(row[columnMap.audioUrl] ?? '').trim()
        : '',
    });
  }

  return {
    words,
    skippedRows,
    totalRows: rows.length,
    detectedColumns,
  };
}

/* =========================================================
 * Accepted file types
 * ========================================================= */

/** MIME types + extensions được chấp nhận cho <input accept>. */
export const VOCABULARY_FILE_ACCEPT =
  '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
