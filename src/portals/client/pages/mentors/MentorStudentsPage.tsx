/**
 * MentorStudentsPage — Wrapper cho MentorStudentsView trong layout client (Dev 5)
 * -----------------------------------------------------------
 * URL: /mentor-students (chỉ MENTOR)
 * Mentor nhận yêu cầu tư vấn, tìm học viên, xem điểm test level và tạo gói kèm 1-1.
 */

import React from 'react';
import { MentorStudentsView } from '@/portals/mentor/features/students';

const MentorStudentsPage: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <MentorStudentsView />
  </div>
);

export default MentorStudentsPage;
