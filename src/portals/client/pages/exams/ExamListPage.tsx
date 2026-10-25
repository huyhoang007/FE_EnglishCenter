/**
 * ExamListPage — Ngân hàng đề thi. URL: /exams (Dev 3)
 */

import React from 'react';
import { ExamListView } from '@/portals/client/features/exams';

const ExamListPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ExamListView />
    </div>
  );
};

export default ExamListPage;
