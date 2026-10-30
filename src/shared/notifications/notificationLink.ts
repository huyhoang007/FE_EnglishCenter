/**
 * notificationLink — bấm 1 thông báo thì đi tới trang liên quan (Dev 5)
 * -----------------------------------------------------------
 * BE chỉ trả type của thông báo (không kèm id tham chiếu),
 * nên điều hướng theo type + vai trò người dùng.
 */

import { CLIENT_ROUTES } from '@/shared/constants/routes';
import type { NotificationType, UserRole } from '@/shared/types';

export function getNotificationLink(type: NotificationType, role: UserRole, title?: string): string | null {
  if (title) {
    const t = title.toLowerCase();
    if (t.includes('test trình độ') || t.includes('trình độ miễn phí') || t.includes('kiểm tra trình độ')) {
      return CLIENT_ROUTES.practice;
    }
  }
  switch (type) {
    case 'mentor_session':
      return role === 'MENTOR' ? CLIENT_ROUTES.teachingSchedule : CLIENT_ROUTES.schedule;
    case 'exam_result':
      return `${CLIENT_ROUTES.practice}?tab=history`;
    case 'payment':
      return role === 'USER' || role === 'STUDENT' ? CLIENT_ROUTES.payments : null;
    case 'study_reminder':
    case 'homework_deadline':
      return CLIENT_ROUTES.myCourses;
    default:
      return null;
  }
}

/** Icon theo loại thông báo */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, string> = {
  study_reminder: '📚',
  homework_deadline: '📝',
  payment: '💳',
  exam_result: '🎯',
  mentor_session: '👩‍🏫',
  general: '🔔',
};

/** Nhãn loại thông báo */
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  study_reminder: 'Nhắc học',
  homework_deadline: 'Bài tập',
  payment: 'Thanh toán',
  exam_result: 'Kết quả bài làm',
  mentor_session: 'Buổi kèm 1-1',
  general: 'Chung',
};

/** "2 phút trước", "3 giờ trước", "05/10/2026" */
export const notificationTimeAgo = (iso: string): string => {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
};
