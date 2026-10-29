/**
 * StudySchedulePage — Wrapper cho StudyScheduleView (Dev 5 — TASK-D5-01)
 * -----------------------------------------------------------
 * URL: /study-schedule (chỉ USER / STUDENT) — vào từ dropdown avatar
 */

import React from 'react';
import { StudyScheduleView } from '@/portals/client/features/study-schedule';

const StudySchedulePage: React.FC = () => {
  // Khung nội dung giống các trang client khác: max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <StudyScheduleView />
    </div>
  );
};

export default StudySchedulePage;
