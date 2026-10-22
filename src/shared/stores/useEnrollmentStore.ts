/**
 * Enrollment Store (Zustand)
 * -----------------------------------------------------------
 * Lưu trạng thái ghi danh của học viên phía client.
 *
 * Shape:
 *   enrolled: Record<courseId, Enrollment>   — tra cứu O(1) theo courseId
 *   enroll(payload):                        — thêm enrollment mới
 *   subscribe(cb):                          — đăng ký lắng nghe thay đổi
 *   getByCourse(courseId):                  — selector lấy record
 *
 * Khi tích hợp backend thật, các method này sẽ gọi API tương ứng.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreApi, UseBoundStore } from 'zustand';

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle?: string;
  userId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REFUNDED';
  enrolledAt: string;
  expiresAt?: string;
  /** Optional metadata (price, mentorId, v.v.) */
  meta?: Record<string, unknown>;
}

export interface EnrollPayload {
  courseId: string;
  courseTitle?: string;
  userId?: string;
  amount?: number;
  /** Thời điểm ghi danh (ISO) — dùng cho bản ghi local. */
  enrolledAt?: string;
  /** Mã đơn hàng liên quan (VD: orderCode của PayOS). */
  orderId?: string | number;
  meta?: Record<string, unknown>;
}

interface EnrollmentState {
  /** Map courseId → Enrollment, tra cứu O(1) */
  enrolled: Record<string, Enrollment>;
  isLoading: boolean;
  error: string | null;

  /** Đăng ký ghi danh mới (gọi sau khi thanh toán thành công) */
  enroll: (payload: EnrollPayload) => Enrollment;
  /** Tra cứu theo courseId */
  getByCourse: (courseId: string) => Enrollment | undefined;
  /** Đăng ký listener thay đổi (cho real-time UI như CourseDetailView) */
  subscribe: (listener: (state: EnrollmentState) => void) => () => void;
  /** Xoá tất cả (logout/reset) */
  reset: () => void;
}

const initialState = {
  enrolled: {} as Record<string, Enrollment>,
  isLoading: false,
  error: null,
};

/**
 * Tham chiếu tới store để `subscribe` gọi được API của Zustand mà không
 * tạo tham chiếu vòng trong initializer (`useEnrollmentStore` dùng chính
 * nó qua `subscribe`). Gán sau khi store được tạo — hàm `subscribe` chỉ
 * được gọi ở runtime nên tới lúc đó `storeRef` đã có giá trị.
 */
type EnrollmentStore = UseBoundStore<StoreApi<EnrollmentState>>;
let storeRef: EnrollmentStore | undefined;

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      enroll: (payload) => {
        const enrollment: Enrollment = {
          id: `enr_${Date.now()}`,
          courseId: payload.courseId,
          courseTitle: payload.courseTitle,
          userId: payload.userId ?? '',
          status: 'ACTIVE',
          enrolledAt: payload.enrolledAt ?? new Date().toISOString(),
          meta: payload.meta,
        };
        set((s) => ({
          enrolled: { ...s.enrolled, [payload.courseId]: enrollment },
        }));
        return enrollment;
      },

      getByCourse: (courseId) => get().enrolled[courseId],

      subscribe: (listener) => {
        // Zustand cho sẵn subscribe ở store level; ta wrap lại để
        // các component có thể dùng cú pháp subscribe(fn) quen thuộc.
        return storeRef?.subscribe(listener) ?? (() => {});
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'prepmaster-ai-enrollments',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

storeRef = useEnrollmentStore;

/* ------------ Selectors tiện ích ------------ */
export const selectIsEnrolled = (courseId: string) => (s: EnrollmentState) =>
  Boolean(s.enrolled[courseId]);

export const selectEnrollment = (courseId: string) => (s: EnrollmentState) =>
  s.enrolled[courseId];
