/**
 * ExamDetailPage — Giới thiệu đề + nút Bắt đầu. URL: /exams/:id (Dev 3)
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { ExamIntroView } from '@/portals/client/features/exams';

const ExamDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ExamIntroView examId={id} />
    </div>
  );
};

export default ExamDetailPage;
