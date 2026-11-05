/**
 * LearningPathPage — Wrapper cho trang Lộ trình học (dữ liệu thật từ BE)
 * -----------------------------------------------------------
 * URL: /learning-path
 * - Student / Learner / khách: LearningPathView (xem, ghi danh, theo dõi tiến độ);
 *   Learner / Student chỉ thấy lộ trình của chứng chỉ mục tiêu (BE lọc theo hồ sơ).
 * - Mentor (Dev 5): màn quản lý lộ trình ở chế độ mentor — tạo lộ trình (VD 12 buổi),
 *   chỉ sửa / xóa lộ trình của mình; dùng khi tư vấn và tạo gói kèm 1-1.
 */

import React from 'react';
import { LearningPathView } from '@/portals/client/features/learning-path';
import { LearningPathManagementView } from '@/portals/admin/features/learning-path';
import { useAuthStore } from '@/shared/auth/useAuthStore';

const LearningPathPage: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  // Khung nội dung giống các trang client khác (Courses, Mentors): max-w-7xl, căn giữa
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {role === 'MENTOR' ? <LearningPathManagementView mode="mentor" /> : <LearningPathView />}
    </div>
  );
};

export default LearningPathPage;
