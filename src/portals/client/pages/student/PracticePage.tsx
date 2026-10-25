/**
 * PracticePage — Wrapper cho PracticeView (luyện đề Writing/Speaking, AI chấm)
 * -----------------------------------------------------------
 * URL: /practice  (hỗ trợ ?examId=... để mở sẵn 1 đề)
 */

import React from 'react';
import { PracticeView } from '@/portals/client/features/ai-practice';

const PracticePage: React.FC = () => {
  // Khung nội dung giống các trang client khác (Courses, Mentors): max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PracticeView />
    </div>
  );
};

export default PracticePage;
