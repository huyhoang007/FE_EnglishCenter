/**
 * CoursePlayerPage — Wrapper trang phòng học trực tuyến (LearnSphere Player)
 * -----------------------------------------------------------
 * URL: /my-courses/:slug/learn hoặc /my-courses/:courseId/learn
 * Hiển thị giao diện 2 cột: Sidebar tiến độ + Video Player và các Tab.
 */

import React from 'react';
import { CoursePlayerView } from '@/portals/client/features/learning';

const CoursePlayerPage: React.FC = () => {
  return <CoursePlayerView />;
};

export default CoursePlayerPage;
