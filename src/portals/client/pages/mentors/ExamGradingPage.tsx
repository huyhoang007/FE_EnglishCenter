/**
 * ExamGradingPage — Wrapper cho ExamGradingView (Dev 3) trong layout client
 * -----------------------------------------------------------
 * URL: /exam-grading (chỉ MENTOR)
 * Mentor chấm Writing / Speaking của bài kiểm tra năng lực ngay trên header client,
 * giống TeachingSchedulePage — không cần chuyển sang Mentor Console.
 */

import React from 'react';
import { ExamGradingView } from '@/portals/mentor/features/exam-grading';

const ExamGradingPage: React.FC = () => {
  // Khung nội dung giống các trang client khác: max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ExamGradingView />
    </div>
  );
};

export default ExamGradingPage;
