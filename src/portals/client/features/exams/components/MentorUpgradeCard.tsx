/**
 * MentorUpgradeCard — Gợi ý nâng cấp gói Mentor 1-1 (V30)
 * -----------------------------------------------------------
 * Hiển thị khi học viên đã nộp đề cuối kỳ mà CHƯA mua gói mentor:
 *   - Phần trắc nghiệm đã được chấm tự động → trả điểm ngay;
 *   - Phần tự luận (Writing / Speaking) được LƯU NHÁP, chờ nâng cấp gói;
 *   - Nâng cấp gói → bài tự luận được chuyển thẳng cho mentor chấm tay,
 *     KHÔNG phải làm lại bài.
 *
 * API: dùng chung luồng tư vấn / thanh toán gói kèm 1-1 (SchedulePageView).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Headset, Sparkles } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { CLIENT_ROUTES } from '@/shared/constants/routes';

interface MentorUpgradeCardProps {
  /** Số câu tự luận đang chờ chấm (để hiển thị cụ thể). */
  pendingCount?: number;
}

export const MentorUpgradeCard: React.FC<MentorUpgradeCardProps> = ({ pendingCount }) => (
  <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
        <Headset className="w-5 h-5" />
      </div>
      <h2 className="text-base font-extrabold text-slate-900 flex-1 min-w-0">
        Nâng cấp gói Mentor 1-1 để được chấm phần tự luận
      </h2>
      <Badge variant="ai" size="sm">
        <Sparkles className="w-3 h-3" />
        Bài của bạn đã được lưu
      </Badge>
    </div>

    <div className="space-y-1.5 text-sm text-slate-700">
      <p>
        <b>Phần trắc nghiệm (Nghe / Đọc)</b> đã được chấm tự động — bạn xem điểm ngay ở trên.
      </p>
      <p>
        <b>Phần tự luận (Viết / Nói)</b>
        {pendingCount && pendingCount > 0 ? ` (${pendingCount} câu)` : ''} đã được lưu ở trạng thái nháp,{' '}
        <b>chưa bị mất</b> và bạn <b>không cần làm lại</b>.
      </p>
      <p className="text-slate-600">
        Ngay khi bạn nâng cấp gói, các bài này tự động chuyển vào hàng đợi chấm của mentor phụ trách và bạn nhận được
        nhận xét chi tiết từ chuyên gia.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2 pt-1">
      <Link to={CLIENT_ROUTES.schedule}>
        <Button variant="primary" size="sm" rightIcon={ArrowRight}>
          Xem gói Mentor 1-1
        </Button>
      </Link>
      <Link to={CLIENT_ROUTES.mentors}>
        <Button variant="ghost" size="sm">
          Tìm mentor phù hợp
        </Button>
      </Link>
    </div>
  </Card>
);

export default MentorUpgradeCard;
