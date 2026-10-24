# Dev 4 frontend: SePay QR checkout

## Run

Run the backend Docker app on port 8080, then in FE_EnglishCenter:

```sh
npm run dev
```

Vite proxies `/api/v1/...` to `http://localhost:8080`. Production can set `VITE_API_URL`
to the backend origin. Never put SePay HMAC secret or bank API tokens in a `VITE_*` variable.
The frontend never calls the webhook or bank APIs directly.

## User flow

1. Open `/courses/<UUID>` and sign in as USER (new registration) or STUDENT.
2. Click "Mua khóa học". FE posts only `courseId` to `/api/v1/payments/orders`.
3. The modal displays the server's amount, bank account, transferContent and qrUrl.
4. Order status is fetched every 3 seconds while pending, and on browser focus.
5. Only a server response with PAID shows success. Active course queries, My Courses and the user's profile are refreshed.
   The backend upgrades a new USER to STUDENT only after successful settlement.
6. `/my-courses` reads active enrollments from BE. `/my-courses/<UUID>/learn` uses real course lessons.
7. `/payments` shows orders and recorded transactions. Pending orders can be reopened after refresh.
8. `/admin/payments` lets ADMIN filter orders, inspect details and review incoming bank webhook events.

Closing a checkout leaves the pending order intact. Cancelling requires confirmation and calls BE.
Expired/cancelled/review-required orders show no QR. A network error never grants enrollment.
The server remains the authority for money and content access; no local enrollment store is used.
Free-course signup, progress tracking, combos and refunds require additional backend APIs and are not simulated.

## Test with SePay Test mode

After creating an order through FE, simulate incoming money with its exact amount and EC code on SePay.
Keep ngrok forwarding to port 8080 and the webhook URL configured as `/api/v1/payments/sepay/webhook`.
Do not transfer real money into generated Test mode bank accounts.

Check: success unlocks only the matching course; repeated webhook does not add another enrollment;
wrong amount is review-required; cancelled/expired orders do not unlock; payment network errors show retry;
signing out or switching accounts clears user-specific cached course data.

## Validation

```sh
npm run build
npx tsc --noEmit
npm run lint
npm run test:payments
```

Payment unit tests use Node's built-in runner and the already-installed TypeScript compiler; no new library is required.
