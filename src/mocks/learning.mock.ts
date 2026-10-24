/**
 * Learning Mock Data
 * -----------------------------------------------------------
 * Mock dữ liệu cho 2 khóa học học viên đã ghi danh:
 *   1. IELTS Chuyên Sâu 7.5+ (đang học - 45%)
 *   2. TOEIC Foundation 550+ (đang học - 78%)
 *
 * Mỗi khóa có curriculum 6 bài chia 3 chương, trong đó 1 bài sẽ là
 * "bài học hiện tại" mà StudyRoomView mở mặc định.
 */

import type { Course } from '@/shared/types';
import type {
  EnrolledCourse,
  StudyLesson,
  LearningStats,
  StudyMaterial,
} from '@/shared/types';
import { MOCK_COURSE } from './courses.mock';

/* ============================================================
 *  Khóa TOEIC thứ 2 — tạo mới hoàn toàn
 * ============================================================ */
const MOCK_COURSE_TOEIC: Course = {
  id: 'crs_toeic_foundation_01',
  slug: 'toeic-foundation-550',
  title: 'TOEIC Foundation 550+ Cho Người Mới Bắt Đầu',
  subtitle:
    'Lộ trình 8 tuần chinh phục 550+ TOEIC, kèm bộ đề chuẩn ETS & AI chấm Listening/Reading',
  certificate: 'TOEIC',
  level: 'BEGINNER',
  price: 1990000,
  originalPrice: 2990000,
  durationHours: 30,
  totalLessons: 36,
  rating: 4.8,
  ratingCount: 942,
  studentEnrolled: 2410,
  thumbnailUrl:
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
  coverUrl:
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1600&q=80',
  shortDescription:
    'Khóa học TOEIC nền tảng cho người mới — 8 tuần luyện 4 phần: Listening, Reading, ngữ pháp & từ vựng trọng tâm.',
  targetDescription:
    'Đạt 550+ TOEIC trong 8 tuần với lộ trình cá nhân hoá & 6 đề thi thử chuẩn ETS.',
  outcomes: [
    'Nắm vững 1500 từ vựng TOEIC trọng tâm theo chủ đề',
    'Luyện 6 đề thi thử chuẩn ETS cập nhật 2026',
    'Cải thiện Listening với chiến lược nghe chủ động',
    'Tự tin Reading với 7 dạng câu hỏi thường gặp',
  ],
  mentor: {
    id: 'mnt_hannah_lee',
    fullName: 'Hannah Lee',
    title: 'ETS Certified Trainer · TOEIC 990',
    rating: 4.8,
    studentCount: 3100,
    experience: '7 năm đào tạo TOEIC tại Hàn Quốc & Việt Nam',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=hannah&backgroundColor=ffd5dc',
  },
  curriculum: [
    {
      id: 'sec_toeic_l1',
      order: 1,
      title: 'Tuần 1-2: Ngữ pháp nền tảng & 500 từ vựng cốt lõi',
      lessons: [
        {
          id: 'toeic_l1',
          order: 1,
          title: '12 thì tiếng Anh — Bảng hệ thống hoá',
          description: 'Hệ thống hoá 12 thì với ví dụ TOEIC thực tế.',
          durationMinutes: 22,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
        {
          id: 'toeic_l2',
          order: 2,
          title: 'Mệnh đề quan hệ & câu điều kiện',
          durationMinutes: 20,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
      ],
    },
    {
      id: 'sec_toeic_l2',
      order: 2,
      title: 'Tuần 3-4: Listening chiến lược',
      lessons: [
        {
          id: 'toeic_l3',
          order: 1,
          title: 'Part 1 — Mô tả tranh: 6 câu mở đầu điểm cao',
          description: 'Chiến lược nghe Part 1 chuẩn xác 100%.',
          durationMinutes: 25,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
        {
          id: 'toeic_l4',
          order: 2,
          title: 'Part 2 — Hỏi đáp: 25 câu then chốt',
          durationMinutes: 22,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
        {
          id: 'toeic_l5',
          order: 3,
          title: 'Part 3 — Đoạn hội thoại dài',
          durationMinutes: 28,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
      ],
    },
    {
      id: 'sec_toeic_l3',
      order: 3,
      title: 'Tuần 5-8: Reading tốc độ & Mock Tests',
      lessons: [
        {
          id: 'toeic_l6',
          order: 1,
          title: 'Part 7 — Đọc hiểu đoạn văn dài',
          durationMinutes: 30,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
      ],
    },
  ],
  vocabularyBank: [
    {
      id: 'toeic_v1',
      word: 'Invoice',
      ipa: '/ˈɪnvɔɪs/',
      partOfSpeech: 'noun',
      meaning: 'Hoá đơn',
      example: 'Please send me the invoice by email.',
      exampleTranslation: 'Vui lòng gửi hoá đơn cho tôi qua email.',
    },
    {
      id: 'toeic_v2',
      word: 'Schedule',
      ipa: '/ˈʃedjuːl/',
      partOfSpeech: 'noun',
      meaning: 'Lịch trình',
      example: 'The meeting schedule has been updated.',
      exampleTranslation: 'Lịch họp đã được cập nhật.',
    },
  ],
};

/* ============================================================
 *  Bài học chi tiết (StudyLesson) cho từng lessonId
 * ============================================================ */
const STUDY_LESSON_IELTS_CURRENT: StudyLesson = {
  lesson: MOCK_COURSE.curriculum[0].lessons[1], // l2: Line Graph Analysis
  section: MOCK_COURSE.curriculum[0],
  summary: [
    'Nâng cao kỹ năng phân tích biểu đồ đường (Line Graph) trong IELTS Writing Task 1 — chọn xu hướng chính, nhóm các giai đoạn tăng/giảm, xác định điểm gãy và cách dùng từ nối chuẩn Academic.',
    'Phân tích 3 bài mẫu Band 7.5+ từ Cambridge English 18 để chỉ ra cấu trúc Overview — Details kèm collocations thường gặp.',
    'Thực hành viết đoạn Overview trong 5 phút với 4 dạng đề Line Graph: single line, multiple lines, có/không có giai đoạn rõ ràng.',
  ],
  materials: [
    {
      id: 'mat_1',
      title: 'Handbook phân tích Line Graph — Kèm bài mẫu Band 7.5+',
      fileName: 'ielts-writing-task1-line-graph-handbook.pdf',
      fileType: 'pdf',
      sizeKb: 1640,
    },
    {
      id: 'mat_2',
      title: 'Bộ 6 đề Line Graph thực tế (Cambridge 14-18)',
      fileName: 'line-graph-practice-pack.pdf',
      fileType: 'pdf',
      sizeKb: 2120,
    },
  ],
  vocabulary: [
    {
      word: 'Fluctuate',
      ipa: '/ˈflʌktʃueɪt/',
      partOfSpeech: 'verb',
      meaning: 'Dao động, lên xuống không đều',
      example: 'Sales fluctuated sharply during the holiday season.',
    },
    {
      word: 'Plummet',
      ipa: '/ˈplʌmɪt/',
      partOfSpeech: 'verb',
      meaning: 'Lao dốc, giảm mạnh',
      example: 'Stock prices plummeted after the disappointing earnings report.',
    },
    {
      word: 'Steady',
      ipa: '/ˈstedi/',
      partOfSpeech: 'adjective',
      meaning: 'Ổn định, đều đặn',
      example: 'There has been a steady increase in online learning over the past decade.',
    },
    {
      word: 'Peak',
      ipa: '/piːk/',
      partOfSpeech: 'noun',
      meaning: 'Đỉnh, mức cao nhất',
      example: 'The number of tourists reached its peak in July.',
    },
  ],
  homework: {
    id: 'hw_lesson_4',
    prompt:
      'Viết đoạn văn 150-200 từ phân tích biểu đồ đường mẫu (Line Graph thể hiện lượng khách du lịch quốc tế đến Việt Nam giai đoạn 2015-2024). Bài làm cần có: (1) đoạn Overview tóm tắt xu hướng chính, (2) đoạn Details nêu 2-3 điểm số liệu tiêu biểu kèm so sánh. Hạn nộp: 23:59 Chủ Nhật tuần này.',
    dueLabel: '23:59 Chủ Nhật tuần này',
    dueAt: '2026-10-12T23:59:59.000Z',
    gradedScore: 8.0,
    gradedFeedback:
      'Luận điểm rõ ràng, cách liên kết câu mạch lạc. Cần lưu ý sử dụng mạo từ chính xác hơn ở đoạn 3 (ví dụ: "the number of tourists" thay vì "number of tourists"). Từ vựng đa dạng, có sử dụng collocations tốt (witnessed a sharp increase, reached a peak).',
    studentAnswer:
      'The line graph illustrates the number of international tourists visiting Vietnam from 2015 to 2024. Overall, there was a steady upward trend across the decade, despite a temporary decline in 2020.\n\nIn 2015, approximately 8 million tourists visited Vietnam, and this figure rose gradually to around 18 million by 2019. However, the number plummeted to just 3 million in 2020 due to the global pandemic. From 2021 onwards, the figure recovered strongly, reaching an all-time peak of 28 million in 2024.',
    attachments: [
      { name: 'line-graph-essay-vietnam-tourism.docx', sizeKb: 52 },
    ],
  },
};

const STUDY_LESSON_TOEIC_CURRENT: StudyLesson = {
  lesson: MOCK_COURSE_TOEIC.curriculum[1].lessons[1], // toeic_l4: Part 2
  section: MOCK_COURSE_TOEIC.curriculum[1],
  summary: [
    'Nắm chắc chiến lược trả lời 25 câu hỏi Part 2 trong thời gian tối đa 45 giây mỗi câu — phân biệt câu hỏi 5W1H, câu hỏi Yes/No và câu hỏi lựa chọn.',
    'Luyện nghe 12 đoạn hội thoại mẫu với 3 tốc độ khác nhau (1.0x, 1.2x, native speed) để làm quen với nhiều giọng Bắc Mỹ & Anh.',
    'Bí kíp loại trừ đáp án sai bằng từ khoá "trap" trong câu hỏi.',
  ],
  materials: [
    {
      id: 'toeic_mat_1',
      title: 'Đề luyện Part 2 — 50 câu (có audio script)',
      fileName: 'toeic-part2-50q-practice.pdf',
      fileType: 'pdf',
      sizeKb: 2120,
    },
  ],
  vocabulary: [
    {
      word: 'Reservation',
      ipa: '/ˌrezəˈveɪʃn/',
      partOfSpeech: 'noun',
      meaning: 'Đặt chỗ trước',
      example: 'I made a dinner reservation for 7 PM.',
    },
    {
      word: 'Commute',
      ipa: '/kəˈmjuːt/',
      partOfSpeech: 'verb',
      meaning: 'Đi lại hằng ngày (đi làm/đi học)',
      example: 'She commutes to the office by bus every morning.',
    },
  ],
};

/* ============================================================
 *  Khóa TOEIC thứ 3 — TOEIC Cấp tốc 750+
 * ============================================================ */
export const MOCK_COURSE_TOEIC_SPEED: Course = {
  vocabularyBank: [],
  id: 'crs_toeic_speed_02',
  slug: 'toeic-cap-toc-750',
  title: 'TOEIC Cấp Tốc 750+ Chinh Phục Đề Thi Thật',
  subtitle:
    'Luyện 10 bộ đề ETS mới nhất kèm chiến thuật bẫy Part 5-7 và mẹo nghe Part 3-4',
  certificate: 'TOEIC',
  level: 'INTERMEDIATE',
  price: 2490000,
  originalPrice: 3500000,
  durationHours: 35,
  totalLessons: 30,
  rating: 4.9,
  ratingCount: 756,
  studentEnrolled: 1820,
  thumbnailUrl:
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  coverUrl:
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80',
  shortDescription:
    'Khóa luyện thi cấp tốc 4 tuần dành cho học viên cần bằng gấp, tập trung giải đề thực chiến và kỹ năng làm bài.',
  targetDescription:
    'Nâng 150-200 điểm TOEIC trong 30 ngày với phương pháp phân loại câu hỏi.',
  outcomes: [
    'Chiến thuật xử lý nhanh Part 5 trong 15 phút',
    'Nghe bắt keyword Part 3 & 4 không cần dịch',
    'Kỹ thuật đọc lướt Skimming & Scanning cho Part 7',
  ],
  mentor: {
    id: 'mnt_alex_vu',
    fullName: 'Alex Vũ',
    title: 'Senior TOEIC Coach · 990 TOEIC',
    rating: 4.9,
    studentCount: 2800,
    experience: '8 năm luyện thi TOEIC cấp tốc',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=b6e3f4',
  },
  curriculum: [
    {
      id: 'sec_speed_1',
      order: 1,
      title: 'Chuyên đề 1: Giải mã 10 bẫy ngữ pháp Part 5',
      lessons: [
        {
          id: 'speed_l1',
          order: 1,
          title: 'Từ loại biến đổi & bẫy tính từ/phó từ',
          description: 'Cách chọn đáp án đúng trong 10 giây không cần dịch nghĩa.',
          durationMinutes: 20,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
        {
          id: 'speed_l2',
          order: 2,
          title: 'Mẹo phân biệt liên từ & giới từ',
          description: 'Although vs In spite of, Because vs Because of.',
          durationMinutes: 25,
          type: 'VIDEO',
          status: 'ENROLLED',
        },
      ],
    },
  ],
};

/* ============================================================
 *  Khóa đã ghi danh (cho MyCoursesView)
 * ============================================================ */
export const MOCK_ENROLLED_COURSES: EnrolledCourse[] = [
  {
    course: MOCK_COURSE_TOEIC,
    mentor: MOCK_COURSE_TOEIC.mentor,
    progress: {
      percent: 78,
      completedLessonIds: [
        'toeic_l1',
        'toeic_l2',
        'toeic_l3',
        'toeic_l4',
      ],
      currentLessonId: 'toeic_l4',
      studiedHours: 18.5,
      status: 'IN_PROGRESS',
      enrolledAt: '2026-08-20T08:00:00.000Z',
    },
    nextLesson: MOCK_COURSE_TOEIC.curriculum[1].lessons[1],
  },
  {
    course: MOCK_COURSE_TOEIC_SPEED,
    mentor: MOCK_COURSE_TOEIC_SPEED.mentor,
    progress: {
      percent: 30,
      completedLessonIds: ['speed_l1'],
      currentLessonId: 'speed_l2',
      studiedHours: 6.0,
      status: 'IN_PROGRESS',
      enrolledAt: '2026-09-01T08:00:00.000Z',
    },
    nextLesson: MOCK_COURSE_TOEIC_SPEED.curriculum[0].lessons[1],
  },
  {
    course: MOCK_COURSE,
    mentor: MOCK_COURSE.mentor,
    progress: {
      percent: 45,
      completedLessonIds: ['l1'],
      currentLessonId: 'l2', // đang học dở Line Graph Analysis
      studiedHours: 12.5,
      status: 'IN_PROGRESS',
      enrolledAt: '2026-09-15T08:00:00.000Z',
    },
    nextLesson: MOCK_COURSE.curriculum[0].lessons[1], // l2 Line Graph
  },
];

/* ============================================================
 *  Lookup StudyLesson theo lessonId
 * ============================================================ */
const STUDY_LESSONS: Record<string, StudyLesson> = {
  l2: STUDY_LESSON_IELTS_CURRENT,
  toeic_l4: STUDY_LESSON_TOEIC_CURRENT,
  speed_l2: {
    lesson: MOCK_COURSE_TOEIC_SPEED.curriculum[0].lessons[1],
    section: MOCK_COURSE_TOEIC_SPEED.curriculum[0],
    summary: [
      'Nắm vững 5 cặp liên từ - giới từ thường gặp nhất trong TOEIC Part 5.',
      'Quy tắc xét đuôi danh từ/cụm danh từ phía sau chỗ trống.',
      'Luyện 20 câu trắc nghiệm thực chiến bấm giờ 30s/câu.',
    ],
    materials: [
      {
        id: 'mat_speed_1',
        title: 'Bảng tổng hợp Liên từ & Giới từ TOEIC',
        fileName: 'conjunctions-prepositions-cheat-sheet.pdf',
        fileType: 'pdf',
        sizeKb: 1420,
      },
    ],
    vocabulary: [],
  },
  // Fallback chung cho các bài học khác — dùng để demo navigation
  l1: {
    lesson: MOCK_COURSE.curriculum[0].lessons[0],
    section: MOCK_COURSE.curriculum[0],
    summary: [
      'Nhận diện 7 dạng biểu đồ thường gặp trong IELTS Writing Task 1: line graph, bar chart, pie chart, table, process diagram, map và mixed charts.',
      'Phân bổ thời gian 20 phút: 3 phút phân tích đề, 15 phút viết, 2 phút kiểm tra.',
      'Hướng dẫn chọn xu hướng chính và nhóm số liệu theo 4 nhóm: overall trend, highest/lowest, điểm gãy, giai đoạn.',
    ],
    materials: [
      {
        id: 'mat_intro_1',
        title: 'Slide bài giảng — Task 1 Overview',
        fileName: 'task1-overview-slides.pdf',
        fileType: 'pdf',
        sizeKb: 1850,
      },
    ],
    vocabulary: [
      {
        word: 'Trend',
        ipa: '/trend/',
        partOfSpeech: 'noun',
        meaning: 'Xu hướng',
        example: 'There is an upward trend in renewable energy usage.',
      },
    ],
  },
};

export const getStudyLesson = (lessonId: string): StudyLesson | undefined => {
  return STUDY_LESSONS[lessonId];
};

/* ============================================================
 *  Tổng hợp stats cho header
 * ============================================================ */
export const MOCK_LEARNING_STATS: LearningStats = {
  inProgressCourses: 2,
  studiedHours: 18.5,
  pendingHomeworks: 1,
};

/* ============================================================
 *  Helper export danh sách materials mặc định (cho tab Overview)
 * ============================================================ */
export const MOCK_DEFAULT_MATERIALS: StudyMaterial[] = STUDY_LESSON_IELTS_CURRENT.materials;
