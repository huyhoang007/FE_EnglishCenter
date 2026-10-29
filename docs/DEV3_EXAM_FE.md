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

## Nhập đề từ file (PDF / Word / text, có AI)

Trang soạn đề (`/admin/exams/:examId`, đề nháp) có nút **Nhập từ file**, hoặc kéo thả file thẳng vào ô
"Đề chưa có phần thi nào":

- **Word / `.txt` viết theo mẫu** (bảng dưới): FE đọc ngay trên trình duyệt (`mammoth`), không gọi AI.
  Kéo thả vào ô trống thì tạo luôn nếu file không lỗi.
- **PDF, hoặc Word / `.txt` viết tự do**: gửi `POST /api/v1/admin/ai-import` (target `EXAM`). AI (Gemini) chuyển đề sang
  mẫu, giữ nguyên câu hỏi, lấy đáp án từ answer key (không có thì tự xác định theo đoạn đọc), map phần thi theo
  các phần của chứng chỉ. Kết quả luôn dừng ở bước **xem trước**; câu AI đọc chưa chắc (VD thiếu đáp án) bị bỏ qua khi tạo.
- Listening / Reading có đáp án nên hệ thống tự chấm; Writing / Speaking thành câu tự luận cho mentor chấm.
  Phần Listening cần link file nghe nếu file gốc không có.

Bấm **Tạo** thì tạo lần lượt section và câu hỏi qua API sẵn có. File mẫu: `public/templates/mau-de-thi.docx`.

Trang **Đề luyện tập AI** (`/admin/practice-exams`, Dev 5) có nút **Tạo từ file**: cùng API với target `PRACTICE`,
AI tách từng đề Writing / Speaking trong file, admin bỏ chọn đề không muốn rồi tạo.

| Viết trong file | Ý nghĩa |
|---|---|
| `[SECTION] READING \| Part 2 - Reading` | Mở phần thi: TÊN PHẦN THI của chứng chỉ (hoặc kỹ năng) \| Tiêu đề. Section được gắn vào phần thi đó |
| `[INSTRUCTIONS] …` / `[PASSAGE] …` / `[AUDIO] url` | Hướng dẫn / đoạn đọc (nhiều dòng) / file nghe (chỉ LISTENING) |
| `1. Câu hỏi … {2}` + `A. …` `*B. …` | Trắc nghiệm, `*` = đáp án đúng, `{2}` = 2 điểm (mặc định 1) |
| `2. [TF] …` + `= False` | Đúng / sai |
| `3. [FILL] …` + `= moved \| move` | Điền từ, nhiều đáp án ngăn bằng `\|` |
| `4. [MATCH] …` + `- bakery = tiệm bánh` | Nối cặp, mỗi cặp một dòng |
| `5. [ESSAY] …` | Tự luận, mentor chấm |
| `[EXPLAIN] …` / `# …` | Giải thích cho câu ngay trên / ghi chú bị bỏ qua |

File `.doc` đời cũ không đọc được: mở bằng Word rồi "Lưu thành" `.docx`.

## Kiểm tra năng lực (placement) và xác định trình độ

Trang `/exams/placement` (nút **Kiểm tra năng lực** ở ngân hàng đề): học viên chọn chứng chỉ mục tiêu, làm một
**bài kiểm tra năng lực** = đề thi thử (`trial`) có loại đề **Kiểm tra đầu vào** (`placement_test`) của chứng chỉ đó.

1. Nộp bài: trắc nghiệm / đúng-sai / điền từ / nối cặp chấm ngay.
2. Writing / Speaking vào hàng đợi `/mentor/exam-grading` của **mọi mentor** (đề thi thử) — năng lực ở trạng thái `pending_grading`.
3. Mentor chấm xong → năng lực `assessed`. Backend trả % từng phần; FE quy đổi theo thang của chứng chỉ.

### Thang điểm theo cấu hình chứng chỉ (Dev 2)

Đề thi không viết cứng thang IELTS / TOEIC / VSTEP. `src/shared/constants/examScales.ts` dựng thang từ cấu hình admin
khai báo ở trang **Chứng chỉ**: `scoring` trong `description` (Trung bình / Tổng / Độc lập, min, max, bước, làm tròn),
`properties` của từng phần thi, và mốc CEFR của preset. Hook `useCertificateScale(certificateId)` lấy
`GET /certificates/{id}` rồi dựng thang. Thêm chứng chỉ mới (VD TOEFL) ở trang Chứng chỉ là đề thi, form chấm của
mentor, trang kết quả và trang năng lực tự theo. Section lưu `certificatePartId` để biết thang của phần thi.

API (BE Task 3) cho module khác, ví dụ Dev 5 xếp lộ trình / lịch học theo khoảng cách tới mục tiêu:

| | |
|---|---|
| `GET /api/v1/me/proficiency?certificateId=` | Năng lực của học viên đang đăng nhập (mỗi chứng chỉ lấy bài kiểm tra gần nhất) |
| `ProficiencyService.getProficiency(studentId, certificateId)` | Gọi trực tiếp trong backend |

Admin tạo bài kiểm tra năng lực: Exams → Tạo đề thi → chọn chứng chỉ, phạm vi **Thi thử chứng chỉ**, loại đề **Kiểm tra đầu vào** → soạn / nhập từ Word → **Công khai đề**.
