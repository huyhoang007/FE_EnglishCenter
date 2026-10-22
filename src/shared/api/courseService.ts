/**
 * courseService — Dev 2 Course & CourseContent REST APIs
 * -----------------------------------------------------------
 * Base URL: /api/v1  (xem `axiosClient.ts`)
 *
 * LƯU Ý VỀ ENVELOPE:
 *   - Endpoint trả `ApiResponse<T>`  → `{ code, message, result }`
 *   - Endpoint trả `PageResponse<T>` → `{ currentPage, pageSize,
 *     totalPages, totalElements, data }` (KHÔNG có wrapper)
 *   Hàm bên dưới tự unwrap `result` cho ApiResponse và trả nguyên
 *   PageResponse cho các endpoint phân trang.
 */

import axios, { type AxiosError } from 'axios';
import axiosClient, { type BeResponse, type PageResponse } from './axiosClient';
import type {
  ContentType,
  CourseContentDto,
  CourseDto,
  CreateCourseContentPayload,
  CreateCoursePayload,
  UpdateCourseContentPayload,
  UpdateCoursePayload,
  CourseQueryParams,
} from '@/shared/types/catalog.types';

const BASE = '/api/v1';

/** Chuẩn hoá lỗi từ Axios thành Error có message tiếng Việt dễ hiển thị. */
export function toApiError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as
      | { message?: string; error?: string }
      | undefined;
    const status = err.response?.status;

    // 400 = tham số sai (VD: courseId không phải UUID) — backend trả
    // message chi tiết nên hiển thị luôn cho dễ hiểu.
    if (status === 400 && payload?.message) {
      return new Error(payload.message);
    }
    // 404 = không tìm thấy khóa học.
    if (status === 404) {
      return new Error(payload?.message ?? 'Không tìm thấy dữ liệu');
    }
    // 500 = lỗi server (VD: Spring không parse được UUID trong path).
    if (status === 500) {
      return new Error(
        'Máy chủ đang lỗi khi xử lý yêu cầu. Vui lòng kiểm tra lại đường dẫn hoặc thử lại sau.',
      );
    }
    return new Error(
      payload?.message ??
        (status ? `${fallback} (HTTP ${status})` : fallback),
    );
  }
  if (err instanceof Error) return err;
  return new Error(fallback);
}

/** Bỏ các param rỗng để axios không gửi `?keyword=` vô nghĩa. */
function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  ) as Partial<T>;
}

/* =========================================================
 * CATALOG — public
 * ========================================================= */

/** GET /api/v1/courses — có phân trang (PageResponse, không wrapper). */
export async function fetchCourses(
  params: CourseQueryParams = {},
): Promise<PageResponse<CourseDto>> {
  const { data } = await axiosClient.get<PageResponse<CourseDto>>(
    `${BASE}/courses`,
    { params: cleanParams({ ...params, size: params.size ?? 12 }) },
  );
  return data;
}

/** GET /api/v1/courses/{courseId} */
export async function fetchCourseById(courseId: string): Promise<CourseDto> {
  try {
    const { data } = await axiosClient.get<BeResponse<CourseDto>>(
      `${BASE}/courses/${courseId}`,
    );
    if (!data?.result) throw new Error('Không tìm thấy khóa học');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Không tìm thấy khóa học');
  }
}

/** GET /api/v1/courses/{courseId}/contents — cây bài học, có cờ preview/locked. */
export async function fetchCourseContents(
  courseId: string,
): Promise<CourseContentDto[]> {
  try {
    const { data } = await axiosClient.get<BeResponse<CourseContentDto[]>>(
      `${BASE}/courses/${courseId}/contents`,
    );
    return data?.result ?? [];
  } catch (err) {
    throw toApiError(err, 'Không tải được danh sách bài học');
  }
}

/** GET /api/v1/courses/{courseId}/vocabularies */
export async function fetchCourseVocabularies(
  courseId: string,
): Promise<CourseContentDto[]> {
  try {
    const { data } = await axiosClient.get<BeResponse<CourseContentDto[]>>(
      `${BASE}/courses/${courseId}/vocabularies`,
    );
    return data?.result ?? [];
  } catch (err) {
    throw toApiError(err, 'Không tải được từ vựng');
  }
}

/** GET /api/v1/courses/{courseId}/homework */
export async function fetchCourseHomework(
  courseId: string,
): Promise<CourseContentDto[]> {
  try {
    const { data } = await axiosClient.get<BeResponse<CourseContentDto[]>>(
      `${BASE}/courses/${courseId}/homework`,
    );
    return data?.result ?? [];
  } catch (err) {
    throw toApiError(err, 'Không tải được bài tập về nhà');
  }
}

/* =========================================================
 * ADMIN — yêu cầu role ADMIN (axiosClient tự gắn Bearer token)
 * ========================================================= */

/** POST /api/v1/admin/courses */
export async function createCourse(
  payload: CreateCoursePayload,
): Promise<CourseDto> {
  try {
    const { data } = await axiosClient.post<BeResponse<CourseDto>>(
      `${BASE}/admin/courses`,
      payload,
    );
    if (!data?.result) throw new Error(data?.message || 'Tạo khóa học thất bại');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Tạo khóa học thất bại');
  }
}

/** PUT /api/v1/admin/courses/{courseId} */
export async function updateCourse(
  courseId: string,
  payload: UpdateCoursePayload,
): Promise<CourseDto> {
  try {
    const { data } = await axiosClient.put<BeResponse<CourseDto>>(
      `${BASE}/admin/courses/${courseId}`,
      payload,
    );
    if (!data?.result)
      throw new Error(data?.message || 'Cập nhật khóa học thất bại');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Cập nhật khóa học thất bại');
  }
}

/** POST /api/v1/admin/courses/{courseId}/contents */
export async function createCourseContent(
  courseId: string,
  payload: CreateCourseContentPayload,
): Promise<CourseContentDto> {
  try {
    const { data } = await axiosClient.post<BeResponse<CourseContentDto>>(
      `${BASE}/admin/courses/${courseId}/contents`,
      payload,
    );
    if (!data?.result)
      throw new Error(data?.message || 'Thêm nội dung thất bại');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Thêm nội dung thất bại');
  }
}

/** PUT /api/v1/admin/course-contents/{contentId} */
export async function updateCourseContent(
  contentId: string,
  payload: UpdateCourseContentPayload,
): Promise<CourseContentDto> {
  try {
    const { data } = await axiosClient.put<BeResponse<CourseContentDto>>(
      `${BASE}/admin/course-contents/${contentId}`,
      payload,
    );
    if (!data?.result)
      throw new Error(data?.message || 'Cập nhật nội dung thất bại');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Cập nhật nội dung thất bại');
  }
}

/* =========================================================
 * Helpers — tiện ích xử lý cây nội dung phía UI
 * ========================================================= */

import type { CourseContentNode } from '@/shared/types/catalog.types';

/**
 * Kiểm tra chuỗi có phải UUID hợp lệ hay không.
 * Backend khai báo `@PathVariable UUID courseId` — nếu gửi slug/không
 * phải UUID, Spring sẽ ném lỗi parse và trả HTTP 500. Frontend cần
 * kiểm tra TRƯỚC để tránh gọi API sai và hiển thị thông báo đẹp.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): boolean {
  return Boolean(value) && UUID_RE.test(value!.trim());
}

/**
 * Chuẩn hoá chuỗi để so sánh code/slug không phân biệt hoa thường,
 * dấu gạch, khoảng trắng: "IELTS-75-INT" → "ielts75int".
 */
const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Giải mã tham số URL thành `courseId` (UUID).
 *
 * Hỗ trợ 2 dạng đầu vào:
 *   1. UUID  → trả về luôn.
 *   2. Slug / mã khóa học (VD: "ielts-intensive-mastery", "IELTS-75-INT")
 *      → tra cứu danh sách khóa học và tìm khoá học có `code` khớp.
 *
 * Trả về `null` nếu không tìm thấy — UI sẽ hiển thị "không tìm thấy".
 */
export async function resolveCourseId(
  idOrSlug: string | undefined | null,
): Promise<string | null> {
  const raw = (idOrSlug ?? '').trim();
  if (!raw) return null;
  if (isUuid(raw)) return raw;

  // Không phải UUID → thử tra cứu theo mã khóa học.
  const target = normalizeKey(raw);
  if (!target) return null;

  const page = await fetchCourses({ size: 100 });
  const match = page.data.find(
    (c) =>
      normalizeKey(c.code ?? '') === target ||
      normalizeKey(c.title ?? '') === target,
  );
  return match?.courseId ?? null;
}

/**
 * Group danh sách nội dung phẳng thành cây 2 cấp (cha → con) dựa trên
 * `parentContentId`. Các node không có cha sẽ được coi là node gốc.
 */
export function buildContentTree(
  items: CourseContentDto[],
): CourseContentNode[] {
  const byId = new Map<string, CourseContentNode>();
  items.forEach((item) =>
    byId.set(item.contentId, { ...item, children: [] }),
  );

  const roots: CourseContentNode[] = [];
  byId.forEach((node) => {
    const parentId = node.parentContentId;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent && parent.contentId !== node.contentId) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (nodes: CourseContentNode[]) => {
    nodes.sort((a, b) => (a.contentOrder ?? 0) - (b.contentOrder ?? 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/** Lọc nội dung theo loại (lesson / vocabulary / homework). */
export function filterByType(
  items: CourseContentDto[],
  type: ContentType,
): CourseContentDto[] {
  return items.filter((i) => i.contentType === type);
}