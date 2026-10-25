/**
 * SchedulePage — Wrapper cho SchedulePageView
 * -----------------------------------------------------------
 * URL: /schedule
 */

import React from 'react';
import { SchedulePageView } from '@/portals/client/features/schedules';

const SchedulePage: React.FC = () => {
  // Khung nội dung giống các trang client khác (Courses, Mentors): max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SchedulePageView />
    </div>
  );
};

export default SchedulePage;
