/**
 * Course Mock Data
 * -----------------------------------------------------------
 * Mock data cho 1 khóa học flagship: "IELTS Intensive Master 7.5+ Target"
 * Dùng cho Gold Flow trình diễn trước giảng viên.
 */

import type { Course } from '@/shared/types';

export const MOCK_COURSE: Course = {
  id: 'crs_ielts_intensive_01',
  slug: 'ielts-intensive-mastery',
  title: 'IELTS Intensive Master 7.5+ Target',
  subtitle: 'Lộ trình luyện thi IELTS Academic chuẩn Cambridge, kèm AI chấm & Mentor 1-1',
  certificate: 'IELTS',
  level: 'ADVANCED',
  price: 3490000,
  originalPrice: 4990000,
  durationHours: 45,
  totalLessons: 48,
  rating: 4.9,
  ratingCount: 1284,
  studentEnrolled: 3850,
  thumbnailUrl:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  coverUrl:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
  shortDescription:
    'Khóa học toàn diện 4 kỹ năng (Listening – Reading – Writing – Speaking) với chiến lược làm bài thực chiến và AI chấm tự động theo rubric chính thức của IDP.',
  targetDescription:
    'Cam kết đạt 7.5+ IELTS trong 3 tháng với lộ trình cá nhân hoá & Mentor 1-1 đồng hành.',
  outcomes: [
    'Nắm vững chiến lược làm 4 dạng bài Reading & Listening',
    'Viết Task 1/Task 2 đạt Band 7.0+ với cấu trúc chuẩn',
    'Tự tin Speaking Part 1–3 với 30+ chủ đề thường gặp',
    'Sử dụng AI chấm Speaking/Writing để luyện tập 24/7',
  ],
  mentor: {
    id: 'mnt_david_smith',
    fullName: 'David Smith',
    title: 'Ex-IELTS Examiner · 8.5 Overall',
    rating: 4.9,
    studentCount: 5200,
    experience: '10 năm kinh nghiệm luyện thi IELTS quốc tế',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=david&backgroundColor=c0aede',
  },
  curriculum: [
    {
      id: 'sec_intro',
      order: 1,
      title: 'Tuần 1: Foundation & Diagnostic',
      lessons: [
        {
          id: 'l1',
          order: 1,
          title: 'Task 1 Overview — Các dạng đề thường gặp',
          description:
            'Nhận diện 7 dạng biểu đồ Task 1, chiến lược phân bổ thời gian 20 phút.',
          durationMinutes: 18,
          type: 'VIDEO',
          status: 'PREVIEW',
        },
        {
          id: 'l2',
          order: 2,
          title: 'Line Graph Analysis — Phân tích biểu đồ đường',
          description:
            'Cách chọn xu hướng chính, nhóm số liệu, dùng từ nối & collocations chuẩn.',
          durationMinutes: 24,
          type: 'VIDEO',
          status: 'PREVIEW',
        },
        {
          id: 'l3',
          order: 3,
          title: 'Vocabulary Builder: Academic Word List',
          durationMinutes: 15,
          type: 'READING',
          status: 'LOCKED',
        },
        {
          id: 'l4',
          order: 4,
          title: 'Diagnostic Quiz — Đánh giá đầu vào',
          durationMinutes: 30,
          type: 'QUIZ',
          status: 'LOCKED',
        },
      ],
    },
    {
      id: 'sec_writing',
      order: 2,
      title: 'Tuần 2-3: Writing Mastery',
      lessons: [
        {
          id: 'l5',
          order: 1,
          title: 'Task 2 Essay Structure — 4-paragraph template',
          description:
            'Template chuẩn giúp đạt Band 7.0+, kèm 30 bài mẫu phân tích.',
          durationMinutes: 28,
          type: 'VIDEO',
          status: 'LOCKED',
        },
        {
          id: 'l6',
          order: 2,
          title: 'Opinion Essay vs Discussion Essay',
          durationMinutes: 22,
          type: 'VIDEO',
          status: 'LOCKED',
        },
        {
          id: 'l7',
          order: 3,
          title: 'Cohesion & Coherence — Nối câu tự nhiên',
          durationMinutes: 20,
          type: 'VIDEO',
          status: 'LOCKED',
        },
        {
          id: 'l8',
          order: 4,
          title: 'AI Graded Writing Practice (3 bài)',
          durationMinutes: 45,
          type: 'QUIZ',
          status: 'LOCKED',
        },
      ],
    },
    {
      id: 'sec_speaking',
      order: 3,
      title: 'Tuần 4-5: Speaking Confidence',
      lessons: [
        {
          id: 'l9',
          order: 1,
          title: 'Part 1 — Trả lời mở rộng tự nhiên',
          durationMinutes: 18,
          type: 'VIDEO',
          status: 'LOCKED',
        },
        {
          id: 'l10',
          order: 2,
          title: 'Part 2 Cue Card — Cấu trúc 2-minute talk',
          durationMinutes: 25,
          type: 'VIDEO',
          status: 'LOCKED',
        },
        {
          id: 'l11',
          order: 3,
          title: 'Part 3 Abstract Topics — 30 chủ đề thường gặp',
          durationMinutes: 30,
          type: 'VIDEO',
          status: 'LOCKED',
        },
        {
          id: 'l12',
          order: 4,
          title: 'Live 1-1 với Mentor David (45 phút)',
          durationMinutes: 45,
          type: 'LIVE',
          status: 'LOCKED',
        },
      ],
    },
    {
      id: 'sec_mock',
      order: 4,
      title: 'Tuần 6-8: Mock Tests & Final',
      lessons: [
        {
          id: 'l13',
          order: 1,
          title: 'Full Mock Test 1 — Listening + Reading + Writing',
          durationMinutes: 180,
          type: 'QUIZ',
          status: 'LOCKED',
        },
        {
          id: 'l14',
          order: 2,
          title: 'Full Mock Test 2 — Cập nhật đề Q4/2026',
          durationMinutes: 180,
          type: 'QUIZ',
          status: 'LOCKED',
        },
        {
          id: 'l15',
          order: 3,
          title: 'Speaking Mock với AI + Mentor review',
          durationMinutes: 30,
          type: 'LIVE',
          status: 'LOCKED',
        },
      ],
    },
  ],
  vocabularyBank: [
    {
      id: 'v1',
      word: 'Sustain',
      ipa: '/səˈsteɪn/',
      partOfSpeech: 'verb',
      meaning: 'Duy trì, gìn giữ',
      example: 'Governments must find ways to sustain economic growth.',
      exampleTranslation:
        'Các chính phủ phải tìm cách duy trì tăng trưởng kinh tế.',
    },
    {
      id: 'v2',
      word: 'Mitigate',
      ipa: '/ˈmɪtɪɡeɪt/',
      partOfSpeech: 'verb',
      meaning: 'Giảm nhẹ, làm dịu',
      example: 'Measures to mitigate the effects of climate change are urgent.',
      exampleTranslation:
        'Các biện pháp giảm nhẹ tác động của biến đổi khí hậu là cấp bách.',
    },
    {
      id: 'v3',
      word: 'Infrastructure',
      ipa: '/ˈɪnfrəstrʌktʃər/',
      partOfSpeech: 'noun',
      meaning: 'Cơ sở hạ tầng',
      example: 'Investment in transport infrastructure boosts trade.',
      exampleTranslation: 'Đầu tư vào cơ sở hạ tầng giao thông thúc đẩy thương mại.',
    },
    {
      id: 'v4',
      word: 'Consequently',
      ipa: '/ˈkɒnsɪkwəntli/',
      partOfSpeech: 'adverb',
      meaning: 'Do đó, hệ quả là',
      example: 'The factory closed; consequently, hundreds lost their jobs.',
      exampleTranslation:
        'Nhà máy đóng cửa; do đó, hàng trăm người mất việc.',
    },
  ],
};

/** Helper format VND */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};
