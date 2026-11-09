/**
 * MentorHomeworkView — trang "Homework" của mentor (Dev 5, V27 + Dev 2.5)
 * -----------------------------------------------------------
 * Gộp 2 việc về bài tập vào 1 mục trên header:
 *   - Tab "Bài tập của tôi": import PDF / tạo / sửa bài tập riêng, xem lộ trình đang chứa bài.
 *   - Tab "Chấm bài": hàng đợi chấm của Dev 2.5 (HomeworkGradingView) — gồm cả bài khóa học lẫn bài tập mentor.
 * Tab lưu trên URL (?tab=library | grading) để thông báo "Vào mục Chấm bài tập" mở đúng tab mặc định.
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, FileText } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { HomeworkGradingView } from '@/portals/mentor/features/homework-grading';
import { MentorHomeworkLibrary } from './MentorHomeworkLibrary';

type Tab = 'grading' | 'library';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'grading', label: 'Chấm bài', icon: ClipboardCheck },
  { id: 'library', label: 'Bài tập của tôi', icon: FileText },
];

export const MentorHomeworkView: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'library' ? 'library' : 'grading';

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setParams(id === 'grading' ? {} : { tab: id }, { replace: true })}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 h-10 -mb-px border-b-2 text-sm font-bold transition-colors',
              tab === id ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'grading' ? <HomeworkGradingView /> : <MentorHomeworkLibrary />}
    </div>
  );
};

export default MentorHomeworkView;
