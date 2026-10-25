/**
 * ExamRoomPage — Phòng thi của một lượt thi. URL: /exams/attempts/:attemptId (Dev 3)
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { ExamRoomView } from '@/portals/client/features/exams';

const ExamRoomPage: React.FC = () => {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ExamRoomView attemptId={attemptId} />
    </div>
  );
};

export default ExamRoomPage;
