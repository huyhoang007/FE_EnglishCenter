/**
 * MyCoursesPage — Wrapper cho MyCoursesView
 * -----------------------------------------------------------
 * URL: /my-learning
 * Hiển thị danh sách khóa học đã ghi danh + tiến độ học tập.
 */

import React from 'react';
import { MyCoursesView } from '@/portals/client/features/learning';

const MyCoursesPage: React.FC = () => {
  return <MyCoursesView />;
};

export default MyCoursesPage;
