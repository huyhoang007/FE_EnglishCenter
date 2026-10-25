/**
 * Learning Path types — khớp DTO BE (Dev 5, TASK-D5-03)
 * API: /api/v1/learning-paths, /api/v1/users/me/learning-paths/...
 */

/** COURSE: khóa học, EXAM: đề thi (Dev 3), PRACTICE_EXAM: đề luyện tập AI chấm */
export type LearningPathItemType = 'COURSE' | 'EXAM' | 'PRACTICE_EXAM';

/** Trạng thái lộ trình của học viên (chữ thường, khớp BE) */
export type LearningPathStatus = 'active' | 'completed' | 'abandoned';

export interface LearningPathItem {
  itemId: string;
  stage: string;
  order: number;
  type: LearningPathItemType;
  /** id của khóa học / đề thi / đề luyện tập */
  refId: string;
  title: string;
  /** Band cần đạt (chỉ có ở PRACTICE_EXAM) */
  targetBand: number | null;
  /** Chỉ có trong API tiến độ của học viên */
  completed?: boolean;
}

export interface LearningPath {
  learningPathId: string;
  certificateId: string;
  name: string;
  description: string | null;
  totalItems: number;
  enrolledCount: number;
  items: LearningPathItem[];
  createdAt: string;
  lastUpdated: string;
}

/** Tiến độ của học viên trên 1 lộ trình */
export interface LearningPathProgress {
  learningPathId: string;
  certificateId: string;
  name: string;
  status: LearningPathStatus;
  progressPercent: number;
  completedItems: number;
  totalItems: number;
  enrolledAt: string;
  completedAt: string | null;
  items: LearningPathItem[];
}

/** Chứng chỉ (dùng để lọc lộ trình) — khớp CertificateResponse của Dev 2 */
export interface CertificateSummary {
  certificateId: string;
  certificateName: string;
  description: string | null;
}

/* ---------- Admin (Swagger-equivalent UI) ---------- */

/** 1 chặng khi admin tạo / sửa lộ trình — POST/PUT /api/v1/admin/learning-paths */
export interface LearningPathItemPayload {
  stage: string;
  order: number;
  type: LearningPathItemType;
  refId: string;
  /** Chỉ gửi cho PRACTICE_EXAM (0 - 9, bước 0.5) */
  targetBand?: number | null;
}

export interface LearningPathPayload {
  certificateId: string;
  name: string;
  description?: string;
  items: LearningPathItemPayload[];
}

/** Đề thi (Dev 3) dùng làm lựa chọn khi thêm chặng EXAM — GET /api/v1/admin/exams */
export interface ExamOption {
  examId: string;
  examCode: string | null;
  examTitle: string;
  /** draft | published | archived */
  status: string;
  certificateName: string | null;
}
