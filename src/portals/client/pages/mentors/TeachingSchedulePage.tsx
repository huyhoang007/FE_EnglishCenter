/**
 * TeachingSchedulePage — Wrapper cho MentorScheduleView trong layout client (Dev 5)
 * -----------------------------------------------------------
 * URL: /teaching-schedule (chỉ MENTOR)
 * Mentor mở / sửa / đóng khung giờ dạy 1-1 và xem lịch dạy ngay trên header client,
 * không cần chuyển sang Mentor Console.
 */

import React from 'react';
import { MentorScheduleView } from '@/portals/mentor/features/schedule';

const TeachingSchedulePage: React.FC = () => {
  // Khung nội dung giống các trang client khác (Courses, Mentors): max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <MentorScheduleView />
    </div>
  );
};

export default TeachingSchedulePage;
