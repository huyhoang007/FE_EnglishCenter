import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTs(path, transform = value => value) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(transform(js)).toString('base64')}`);
}
const helpers = await loadTs('../src/shared/utils/payment.ts');

test('QR is shown only for a pending order before its server expiry', () => {
  const now = Date.parse('2026-10-24T10:00:00Z');
  const future = '2026-10-24T10:15:00Z';
  assert.equal(helpers.canShowPaymentQr('PENDING', future, now), true);
  for (const status of ['PAID', 'CANCELLED', 'EXPIRED', 'REVIEW_REQUIRED']) {
    assert.equal(helpers.canShowPaymentQr(status, future, now), false);
  }
  assert.equal(helpers.canShowPaymentQr('PENDING', '2026-10-24T10:00:00Z', now), false);
  assert.equal(helpers.canShowPaymentQr('PENDING', 'invalid', now), false);
  assert.equal(helpers.remainingSeconds(future, now), 900);
});

test('video URLs cannot inject script or arbitrary YouTube iframe origins', () => {
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,test', 'file:///secret', '//evil.invalid']) assert.equal(helpers.courseVideo(unsafe), null);
  assert.deepEqual(helpers.courseVideo('https://youtu.be/dQw4w9WgXcQ'), { url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', embed: true });
  assert.deepEqual(helpers.courseVideo('https://evil.invalid/youtube.com/watch?v=dQw4w9WgXcQ'), { url: 'https://evil.invalid/youtube.com/watch?v=dQw4w9WgXcQ', embed: false });
});

test('legacy UTC dates match Instant fields and API errors preserve backend messages', () => {
  assert.equal(helpers.paymentDate('2026-10-24T10:00:00'), helpers.paymentDate('2026-10-24T10:00:00Z'));
  assert.equal(helpers.paymentDate(null), '—');
  assert.equal(helpers.paymentError({ response: { data: { message: 'Bạn đã đăng ký khóa học này' } } }), 'Bạn đã đăng ký khóa học này');
});

const calls = [];
let payload;
globalThis.__sepayTestClient = {
  post: async (...args) => { calls.push(['POST', ...args]); return { data: payload }; },
  get: async (...args) => { calls.push(['GET', ...args]); return { data: payload }; },
};
const fakeClient = `data:text/javascript,export default globalThis.__sepayTestClient;`;
const api = await loadTs('../src/shared/api/paymentService.ts', js => js.replace(/from ['"]\.\/axiosClient['"]/, `from '${fakeClient}'`));

test('checkout sends only courseId; amount and transfer instructions come from BE', async () => {
  const order = { orderCode: 'EC1234567890', amount: 10000 };
  payload = { code: 1000, result: order };
  assert.deepEqual(await api.createPaymentOrder('course-id'), order);
  assert.deepEqual(calls.at(-1), ['POST', '/api/v1/payments/orders', { courseId: 'course-id' }]);
});

test('Dev 4 list unwraps ApiResponse<PageResponse> and preserves 0-based pagination', async () => {
  const page = { currentPage: 2, pageSize: 12, totalPages: 3, totalElements: 25, data: [] };
  payload = { code: 1000, result: page };
  assert.deepEqual(await api.fetchMyEnrollments(2), page);
  assert.equal(calls.at(-1)[1], '/api/v1/me/enrollments');
  assert.equal(calls.at(-1)[2].params.page, 2);
});

test('order requests encode code; cancellation does not mark payment as paid locally', async () => {
  payload = { code: 1000, result: { status: 'CANCELLED' } };
  assert.equal((await api.cancelPaymentOrder('EC123/45')).status, 'CANCELLED');
  assert.equal(calls.at(-1)[1], '/api/v1/payments/orders/EC123%2F45/cancel');
});

test('failed or missing response result cannot be mistaken for payment success', async () => {
  payload = { code: 4003, message: 'Already enrolled' };
  await assert.rejects(api.createPaymentOrder('course-id'), /Already enrolled/);
  payload = { code: 1000 };
  await assert.rejects(api.fetchPaymentOrder('EC1234567890'));
});

test('private query keys are scoped to user and pagination', () => {
  assert.notDeepEqual(api.paymentKeys.myCourses('user-a', 0), api.paymentKeys.myCourses('user-b', 0));
  assert.notDeepEqual(api.paymentKeys.orders('user-a', 0), api.paymentKeys.orders('user-a', 1));
});
