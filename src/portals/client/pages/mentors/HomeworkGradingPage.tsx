/**
 * HomeworkGradingPage — Wrapper cho trang Homework của mentor trong layout client
 * -----------------------------------------------------------
 * URL: /homework-grading (chỉ MENTOR), tab ?tab=library = "Bài tập của tôi"
 * Mentor chấm bài tập + quản lý bài tập riêng (V27) ngay trên header client, không cần chuyển sang Mentor Console.
 */

import React from 'react';
import { MentorHomeworkView } from '@/portals/mentor/features/homework';

const HomeworkGradingPage: React.FC = () => {
  // Khung nội dung giống các trang client khác: max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <MentorHomeworkView />
    </div>
  );
};

export default HomeworkGradingPage;
