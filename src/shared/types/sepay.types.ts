export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'REVIEW_REQUIRED';
export interface PaymentOrder {
  orderId: string; orderCode: string; studentId: string; studentName?: string | null; courseId: string; courseTitle: string;
  amount: number; currency: 'VND'; status: OrderStatus; createdAt: string; expiresAt: string;
  paidAt: string | null; bankCode: string; accountNumber: string; accountName: string;
  transferContent: string; qrUrl: string | null;
}
export interface CourseEnrollment {
  enrollmentId: string; courseId: string; courseTitle: string; thumbnailUrl: string | null;
  enrolledDate: string; status: 'active' | 'expired' | 'cancelled';
}
export interface PaymentTransaction {
  transactionId: string; studentId: string; courseId: string; orderId: string; amount: number;
  paymentMethod: string; transactionStatus: 'pending' | 'success' | 'failed';
  paymentDate: string | null; createdAt: string; providerReference: string | null;
}
export interface WebhookEvent {
  sepay_id: number; order_code?: string; outcome: string; raw_payload: string; received_at: string;
}
