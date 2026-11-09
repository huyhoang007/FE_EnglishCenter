/**
 * HomeworkGradingPage — Wrapper cho HomeworkGradingView trong layout client
 * -----------------------------------------------------------
 * URL: /homework-grading (chỉ MENTOR)
 * Mentor chấm bài tập (homework) ngay trên header client, không cần chuyển sang Mentor Console.
 */

import React from 'react';
import { HomeworkGradingView } from '@/portals/mentor/features/homework-grading';

const HomeworkGradingPage: React.FC = () => {
  // Khung nội dung giống các trang client khác: max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <HomeworkGradingView />
    </div>
  );
};

export default HomeworkGradingPage;
