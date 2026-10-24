import axiosClient, { type BeResponse, type PageResponse } from './axiosClient';
import type { CourseEnrollment, OrderStatus, PaymentOrder, PaymentTransaction, WebhookEvent } from '../types/sepay.types';
const BASE = '/api/v1';
function unwrap<T>(body: BeResponse<T>): T {
  if (body.code !== 1000 || body.result == null) throw new Error(body.message || 'Không nhận được dữ liệu thanh toán.');
  return body.result;
}
export async function createPaymentOrder(courseId: string) {
  return unwrap((await axiosClient.post<BeResponse<PaymentOrder>>(`${BASE}/payments/orders`, { courseId })).data);
}
export async function fetchPaymentOrder(orderCode: string, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<PaymentOrder>>(`${BASE}/payments/orders/${encodeURIComponent(orderCode)}`, { signal })).data);
}
export async function cancelPaymentOrder(orderCode: string) {
  return unwrap((await axiosClient.post<BeResponse<PaymentOrder>>(`${BASE}/payments/orders/${encodeURIComponent(orderCode)}/cancel`)).data);
}
export async function fetchMyOrders(page = 0, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<PageResponse<PaymentOrder>>>(`${BASE}/payments/orders`, { params: { page, size: 10, sort: 'createdAt,desc' }, signal })).data);
}
export async function fetchMyPayments(page = 0, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<PageResponse<PaymentTransaction>>>(`${BASE}/me/payments`, { params: { page, size: 10, sort: 'createdAt,desc' }, signal })).data);
}
export async function fetchMyEnrollments(page = 0, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<PageResponse<CourseEnrollment>>>(`${BASE}/me/enrollments`, { params: { page, size: 12, sort: 'enrolledDate,desc' }, signal })).data);
}
export async function fetchEnrollmentStatus(courseId: string, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<{ courseId: string; enrolled: boolean }>>(`${BASE}/courses/${encodeURIComponent(courseId)}/enrollment-status`, { signal })).data);
}
export async function fetchAdminOrders(status: OrderStatus | '', page = 0, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<PageResponse<PaymentOrder>>>(`${BASE}/admin/payments`, { params: { status: status || undefined, page, size: 10, sort: 'createdAt,desc' }, signal })).data);
}
export async function fetchAdminOrder(id: string, signal?: AbortSignal) {
  return unwrap((await axiosClient.get<BeResponse<PaymentOrder>>(`${BASE}/admin/payments/${encodeURIComponent(id)}`, { signal })).data);
}
export async function fetchWebhookEvents(orderId?: string, signal?: AbortSignal) {
  const path = orderId ? `${encodeURIComponent(orderId)}/webhook-events` : 'webhook-events';
  return unwrap((await axiosClient.get<BeResponse<WebhookEvent[]>>(`${BASE}/admin/payments/${path}`, { signal })).data);
}
export const paymentKeys = {
  all: ['payments'] as const,
  order: (userId: string, code: string) => ['payments', userId, 'order', code] as const,
  orders: (userId: string, page: number) => ['payments', userId, 'orders', page] as const,
  history: (userId: string, page: number) => ['payments', userId, 'history', page] as const,
  enrollment: (userId: string, courseId: string) => ['enrollments', userId, 'status', courseId] as const,
  myCourses: (userId: string, page: number) => ['enrollments', userId, 'courses', page] as const,
};
