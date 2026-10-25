# Dev 3 frontend: Exam / Test Management

Thay `MOCK_EXAM` bằng API thật của backend Task 3 (prefix `/api/v1`).
Theo cùng khuôn với Dev 5: `apiGet/apiPost/apiPut/apiDelete` → `services/` → hook TanStack Query → view.

## Run

Chạy backend (Docker hoặc jar) ở cổng 8080, rồi trong FE_EnglishCenter:

```sh
npm run dev
```

Vite proxy `/api/v1/...` sang `http://localhost:8080`. Dữ liệu mẫu: chạy `db/init/D3_exam_sample_data.sql` của backend
(đề trial `d3000000-0000-4000-8000-000000000100`, đề khóa học `...0200`).

## Màn hình

| Route | Portal | Quyền | Nội dung |
|---|---|---|---|
| `/exams` | client | public | Ngân hàng đề: tìm kiếm, lọc loại đề / phạm vi / level, phân trang |
| `/exams/:id` | client | public | Giới thiệu đề: cấu trúc section, luật thi, quyền làm bài, nút Bắt đầu |
| `/exams/attempts/:attemptId` | client | USER, STUDENT | Phòng thi: đồng hồ theo giờ server, autosave, palette, nộp bài |
| `/exams/attempts/:attemptId/result` | client | USER, STUDENT | Kết quả: điểm tổng, theo section, từng câu, đáp án, nhận xét mentor |
| `/exams/history` | client | USER, STUDENT | Lịch sử thi |
| `/mentor/exam-grading` | mentor | MENTOR, ADMIN | Hàng đợi chấm Writing/Speaking + form chấm điểm |
| `/admin/exams` | admin | ADMIN | Danh sách đề mọi trạng thái, tạo đề |
| `/admin/exams/:examId` | admin | ADMIN | Soạn đề: section, câu hỏi (5 loại), publish / unpublish / xóa |

## File

| Phần | File |
|---|---|
| Kiểu dữ liệu (khớp DTO Spring Boot) | `src/shared/types/exam.types.ts` |
| Client | `src/portals/client/features/exams/` (services, hooks, utils, components), `pages/exams/Exam*Page.tsx` |
| Mentor | `src/portals/mentor/features/exam-grading/` |
| Admin | `src/portals/admin/features/exam/` |

File dùng chung chỉ **thêm dòng**, không sửa dòng của task khác:

- `shared/constants/routes.ts`, `queryKeys.ts`: route và query key của Exam.
- `portals/*/routes.tsx`: route Exam; `MentorLayout`, `AdminLayout`: mục menu "Exam Grading", "Exams".
- Xóa `mocks/exams.mock.ts` (`MOCK_EXAM`) và dòng export của nó trong `mocks/index.ts`.

Không thêm component / helper dùng chung mới: modal, format ngày giờ, debounce đều để cục bộ trong feature.

## Hành vi phòng thi

- Đồng hồ đếm từ `remainingSeconds` của server theo deadline tuyệt đối: không lệch khi tab bị treo, không dừng khi ẩn tab.
- Autosave 1.5 giây sau lần sửa cuối, chỉ gửi các câu đã đổi. Tải lại trang thì khôi phục từ server.
- Nộp bài gửi kèm các câu chưa kịp lưu. Hết giờ thì tự nộp (backend còn sweeper tự nộp nếu học viên đóng tab).
- Server trả `5013` (đã nộp) hoặc `5014` (hết giờ) thì FE chuyển thẳng sang trang kết quả.
- Không bao giờ nhận đáp án đúng: backend ẩn `isCorrect`, đáp án điền từ và cặp nối.
- Đề `course` chỉ làm được khi đã ghi danh khóa học (backend kiểm tra qua EnrollmentService của Dev 4).
