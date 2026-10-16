/**
 * ExamRoomPage — Page wrapper cho ExamRoomView
 * -----------------------------------------------------------
 * Resolve exam từ URL param `id`. Hiện tại chỉ resolve MOCK_EXAM
 * theo slug `ielts-mock-01`. Dev 3 sau này sẽ thay bằng:
 *   const { data, isLoading } = useExam(id);
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExamRoomView } from '@/portals/client/features/exams';
import { MOCK_EXAM } from '@/mocks';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { ArrowLeft, FileText } from 'lucide-react';

const ExamRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (id !== MOCK_EXAM.slug && id !== MOCK_EXAM.id) {
    return (
      <Card className="text-center py-16">
        <div className="w-16 h-16 rounded-input bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Đề thi không tồn tại
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Đề thi với mã <span className="font-mono font-bold">{id}</span> chưa
          có. Hãy thử mã mẫu{' '}
          <span className="font-mono font-bold text-primary">ielts-mock-01</span>.
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </Button>
      </Card>
    );
  }

  return <ExamRoomView exam={MOCK_EXAM} />;
};

export default ExamRoomPage;
