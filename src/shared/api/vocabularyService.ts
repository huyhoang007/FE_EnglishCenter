/**
 * vocabularyService — API quản trị KHO TỪ VỰNG CHUNG + GÁN VÀO KHÓA HỌC
 * ---------------------------------------------------------------------------
 * Mô hình nghiệp vụ (2 luồng tách biệt):
 *
 *   LUỒNG 1 — Tạo / quản lý từ vựng CHUNG (KHÔNG gắn khóa học):
 *     GET    /api/v1/vocabulary-sets                    → duyệt kho chung
 *     GET    /api/v1/vocabulary-sets/{setId}            → chi tiết 1 bộ
 *     POST   /api/v1/vocabulary-sets                    → tạo bộ mới trong kho chung
 *     PUT    /api/v1/vocabulary-sets/{setId}            → sửa bộ trong kho chung
 *     DELETE /api/v1/vocabulary-sets/{setId}            → xoá bộ khỏi kho chung
 *
 *   LUỒNG 2 — Gán vào khóa học (tick chọn trong Quản lý nội dung khóa học):
 *     GET    /api/v1/courses/{courseId}/vocabularies    → các bộ đang gán cho khóa học
 *     PUT    /api/v1/vocabulary-sets/courses/{courseId}  → lưu danh sách bộ được tick
 *     DELETE /api/v1/vocabulary-sets/courses/{courseId}/{setId} → gỡ 1 bộ khỏi khóa học
 *
 * KHÁC BIỆT SO VỚI THIẾT KẾ CŨ:
 *   - Cũ: từ vựng = `course_content(contentType='vocabulary')`, tạo là gắn
 *     luôn vào 1 khóa học; "thư viện" chỉ là gom row của mọi khóa học và
 *     copy (`content_data.items` + `vocabularySetIds`).
 *   - Mới: từ vựng nằm trong kho chung (`vocabulary_sets` / `vocabulary_words`),
 *     liên kết với khóa học bằng bảng trung gian `course_vocabulary_sets`.
 *     Cùng một bộ có thể dùng cho N khóa học mà không nhân bản dữ liệu.
 */

import axiosClient, { type BeResponse } from './axiosClient';
import { toApiError } from './courseService';
import type {
  AssignVocabularySetsPayload,
  CourseVocabularySetDto,
  VocabularySetDto,
  VocabularySetPayload,
  VocabularyWordDto,
} from '@/shared/types/catalog.types';

const BASE = '/api/v1';

/* =========================================================
 * Kiểu cục bộ cho UI
 * ========================================================= */

/**
 * Một từ trong kho chung — chuẩn hoá để UI dùng key không null.
 */
export interface VocabularyWord {
  wordId: string;
  word: string;
  ipa: string;
  phonetic: string;
  meaning: string;
  audioUrl: string;
  partOfSpeech: string;
  example: string;
}

/**
 * Một bộ từ vựng trong kho chung — chuẩn hoá cho UI.
 */
export interface VocabularySet {
  setId: string;
  title: string;
  description: string | null;
  words: VocabularyWord[];
  wordCount: number;
  createdByUserId: string | null;
  createdByUserName: string | null;
  /** Số khóa học đang dùng bộ này. */
  usedInCourseCount: number;
}

/**
 * Một bộ từ vựng đã gán cho khóa học — chuẩn hoá cho UI.
 */
export interface CourseVocabularySet {
  setId: string;
  assignmentId: string;
  title: string;
  description: string | null;
  displayOrder: number;
  words: VocabularyWord[];
  wordCount: number;
  /** true = học viên chưa ghi danh → nội dung bị khoá. */
  locked: boolean;
}

/* =========================================================
 * Chuẩn hoá
 * ========================================================= */

/** Chuẩn hoá 1 từ từ DTO của backend về shape dùng cho UI. */
export function mapVocabularyWord(
  dto: VocabularyWordDto | null | undefined,
): VocabularyWord {
  const ipa = (dto?.ipa ?? dto?.phonetic ?? '').trim();
  return {
    wordId: dto?.wordId ?? '',
    word: (dto?.word ?? '').trim(),
    ipa,
    phonetic: ipa,
    meaning: (dto?.meaning ?? '').trim(),
    audioUrl: (dto?.audioUrl ?? '').trim(),
    partOfSpeech: (dto?.partOfSpeech ?? '').trim(),
    example: (dto?.example ?? '').trim(),
  };
}

/** Chuẩn hoá 1 bộ từ vựng từ DTO của backend về shape dùng cho UI. */
export function mapVocabularySet(dto: VocabularySetDto): VocabularySet {
  const words = (Array.isArray(dto?.words) ? dto.words : []).map(mapVocabularyWord);
  return {
    setId: dto.setId,
    title: dto.title?.trim() || '—',
    description: dto.description ?? null,
    words,
    wordCount: dto.wordCount ?? words.length,
    createdByUserId: dto.createdByUserId ?? null,
    createdByUserName: dto.createdByUserName ?? null,
    usedInCourseCount: dto.usedInCourseCount ?? 0,
  };
}

/** Chuẩn hoá danh sách bộ từ vựng. */
export function mapVocabularySets(
  dtos: VocabularySetDto[] | null | undefined,
): VocabularySet[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(mapVocabularySet);
}

/** Chuẩn hoá 1 bộ đã gán cho khóa học. */
export function mapCourseVocabularySet(
  dto: CourseVocabularySetDto,
): CourseVocabularySet {
  const words = (Array.isArray(dto?.words) ? dto.words : []).map(mapVocabularyWord);
  return {
    setId: dto.setId,
    assignmentId: dto.assignmentId ?? '',
    title: dto.title?.trim() || '—',
    description: dto.description ?? null,
    displayOrder: dto.displayOrder ?? 0,
    words,
    wordCount: dto.wordCount ?? words.length,
    locked: Boolean(dto.locked),
  };
}

/** Chuẩn hoá danh sách bộ đã gán cho khóa học. */
export function mapCourseVocabularySets(
  dtos: CourseVocabularySetDto[] | null | undefined,
): CourseVocabularySet[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(mapCourseVocabularySet);
}

/* =========================================================
 * LUỒNG 1 — Kho từ vựng chung
 * ========================================================= */

/** GET /api/v1/vocabulary-sets — duyệt kho chung. */
export async function fetchVocabularyBank(
  keyword?: string,
): Promise<VocabularySet[]> {
  try {
    const { data } = await axiosClient.get<BeResponse<VocabularySetDto[]>>(
      `${BASE}/vocabulary-sets`,
      { params: keyword?.trim() ? { keyword: keyword.trim() } : undefined },
    );
    return mapVocabularySets(data?.result);
  } catch (err) {
    throw toApiError(err, 'Không tải được kho từ vựng');
  }
}

/** GET /api/v1/vocabulary-sets/{setId} */
export async function fetchVocabularySet(
  setId: string,
): Promise<VocabularySet> {
  try {
    const { data } = await axiosClient.get<BeResponse<VocabularySetDto>>(
      `${BASE}/vocabulary-sets/${setId}`,
    );
    if (!data?.result) throw new Error('Không tìm thấy bộ từ vựng');
    return mapVocabularySet(data.result);
  } catch (err) {
    throw toApiError(err, 'Không tải được bộ từ vựng');
  }
}

/** POST /api/v1/vocabulary-sets — tạo bộ mới trong kho chung. */
export async function createVocabularySet(
  payload: VocabularySetPayload,
): Promise<VocabularySet> {
  try {
    const { data } = await axiosClient.post<BeResponse<VocabularySetDto>>(
      `${BASE}/vocabulary-sets`,
      payload,
    );
    if (!data?.result) throw new Error(data?.message || 'Tạo bộ từ vựng thất bại');
    return mapVocabularySet(data.result);
  } catch (err) {
    throw toApiError(err, 'Tạo bộ từ vựng thất bại');
  }
}

/** PUT /api/v1/vocabulary-sets/{setId} */
export async function updateVocabularySet(
  setId: string,
  payload: VocabularySetPayload,
): Promise<VocabularySet> {
  try {
    const { data } = await axiosClient.put<BeResponse<VocabularySetDto>>(
      `${BASE}/vocabulary-sets/${setId}`,
      payload,
    );
    if (!data?.result)
      throw new Error(data?.message || 'Cập nhật bộ từ vựng thất bại');
    return mapVocabularySet(data.result);
  } catch (err) {
    throw toApiError(err, 'Cập nhật bộ từ vựng thất bại');
  }
}

/** DELETE /api/v1/vocabulary-sets/{setId} */
export async function deleteVocabularySet(setId: string): Promise<void> {
  try {
    await axiosClient.delete<BeResponse<void>>(
      `${BASE}/vocabulary-sets/${setId}`,
    );
  } catch (err) {
    throw toApiError(err, 'Xoá bộ từ vựng thất bại');
  }
}

/* =========================================================
 * LUỒNG 2 — Gán vào khóa học
 * ========================================================= */

/** GET /api/v1/courses/{courseId}/vocabularies — các bộ đang gán cho khóa học. */
export async function fetchCourseVocabularies(
  courseId: string,
): Promise<CourseVocabularySet[]> {
  try {
    const { data } = await axiosClient.get<
      BeResponse<CourseVocabularySetDto[]>
    >(`${BASE}/courses/${courseId}/vocabularies`);
    return mapCourseVocabularySets(data?.result);
  } catch (err) {
    throw toApiError(err, 'Không tải được danh sách từ vựng của khóa học');
  }
}

/**
 * PUT /api/v1/vocabulary-sets/courses/{courseId}
 *
 * Lưu danh sách bộ được tick chọn. Bộ KHÔNG có trong `setIds` sẽ bị gỡ
 * khỏi khóa học (vẫn còn trong kho chung).
 */
export async function assignCourseVocabularySets(
  courseId: string,
  setIds: string[],
): Promise<CourseVocabularySet[]> {
  const payload: AssignVocabularySetsPayload = { setIds };
  try {
    const { data } = await axiosClient.put<
      BeResponse<CourseVocabularySetDto[]>
    >(`${BASE}/vocabulary-sets/courses/${courseId}`, payload);
    return mapCourseVocabularySets(data?.result);
  } catch (err) {
    throw toApiError(err, 'Gán từ vựng vào khóa học thất bại');
  }
}

/** DELETE /api/v1/vocabulary-sets/courses/{courseId}/{setId} */
export async function unassignCourseVocabularySet(
  courseId: string,
  setId: string,
): Promise<void> {
  try {
    await axiosClient.delete<BeResponse<void>>(
      `${BASE}/vocabulary-sets/courses/${courseId}/${setId}`,
    );
  } catch (err) {
    throw toApiError(err, 'Gỡ từ vựng khỏi khóa học thất bại');
  }
}
