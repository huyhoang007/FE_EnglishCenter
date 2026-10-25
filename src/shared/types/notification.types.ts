/**
 * Notification types — khớp NotificationResponse của BE (Dev 5)
 * API: /api/v1/notifications
 */

export type NotificationType =
  | 'study_reminder'
  | 'homework_deadline'
  | 'payment'
  | 'exam_result'
  | 'mentor_session'
  | 'general';

export interface AppNotification {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
