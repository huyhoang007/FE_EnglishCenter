/**
 * ExamResultPage — Kết quả lượt thi. URL: /exams/attempts/:attemptId/result (Dev 3)
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { AttemptResultView } from '@/portals/client/features/exams';

const ExamResultPage: React.FC = () => {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AttemptResultView attemptId={attemptId} />
    </div>
  );
};

export default ExamResultPage;
