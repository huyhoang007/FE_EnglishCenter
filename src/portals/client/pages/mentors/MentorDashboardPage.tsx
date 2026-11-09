/**
 * MentorDashboardPage — Trang tổng quan của mentor trong layout client (Dev 5)
 * -----------------------------------------------------------
 * URL: /mentor-dashboard (chỉ MENTOR) — trang mặc định sau khi mentor đăng nhập.
 */

import React from 'react';
import { MentorDashboardView } from '@/portals/mentor/features/assignment';

const MentorDashboardPage: React.FC = () => {
  // Khung nội dung giống các trang client khác: max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <MentorDashboardView />
    </div>
  );
};

export default MentorDashboardPage;
