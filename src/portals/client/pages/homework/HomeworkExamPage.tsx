/**
 * HomeworkExamPage — trang làm bài trắc nghiệm của bài tập.
 * URL: /homework/attempts/:attemptId
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { HomeworkExamView } from '@/portals/client/features/homework';

const HomeworkExamPage: React.FC = () => {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <HomeworkExamView attemptId={attemptId} />
    </div>
  );
};

export default HomeworkExamPage;
