/**
 * ExamPlacementPage — Kiểm tra năng lực theo chứng chỉ mục tiêu. URL: /exams/placement (Dev 3)
 */

import React from 'react';
import { PlacementView } from '@/portals/client/features/exams';

const ExamPlacementPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PlacementView />
    </div>
  );
};

export default ExamPlacementPage;
