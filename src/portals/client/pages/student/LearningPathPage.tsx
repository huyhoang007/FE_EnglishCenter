/**
 * LearningPathPage — Wrapper cho LearningPathView (lộ trình học, dữ liệu thật từ BE)
 * -----------------------------------------------------------
 * URL: /learning-path
 */

import React from 'react';
import { LearningPathView } from '@/portals/client/features/learning-path';

const LearningPathPage: React.FC = () => {
  // Khung nội dung giống các trang client khác (Courses, Mentors): max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <LearningPathView />
    </div>
  );
};

export default LearningPathPage;
