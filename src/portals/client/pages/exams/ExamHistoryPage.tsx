/**
 * ExamHistoryPage — Lịch sử thi của tôi. URL: /exams/history (Dev 3)
 */

import React from 'react';
import { AttemptHistoryView } from '@/portals/client/features/exams';

const ExamHistoryPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AttemptHistoryView />
    </div>
  );
};

export default ExamHistoryPage;
