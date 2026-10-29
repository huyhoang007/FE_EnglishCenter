/**
 * TargetGoalFields — chọn nguyện vọng: chứng chỉ mục tiêu + điểm mục tiêu (Dev 5)
 * -----------------------------------------------------------
 * Dùng chung cho trang Hồ sơ và Onboarding của Learner.
 * Danh sách điểm sinh theo thang của chứng chỉ đã cấu hình ở trang Chứng chỉ:
 *   IELTS 0 – 9 (bước 0.5) · TOEIC L&R 10 – 990 (bước 5) · TOEIC S&W 0 – 200 (bước 10) · VSTEP 0 – 10 (bước 0.5)…
 * Đổi chứng chỉ → danh sách điểm đổi theo, điểm cũ không còn hợp lệ thì bị xóa.
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Sparkles } from 'lucide-react';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { getCertificateScoring } from '@/portals/admin/features/certificate/certificateScoring';

export interface TargetGoal {
  certificateId: string;
  /** '' khi chưa chọn */
  score: number | '';
}

interface TargetGoalFieldsProps {
  value: TargetGoal;
  onChange: (value: TargetGoal) => void;
  disabled?: boolean;
}

const LABEL_CLASS = 'block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5';
const SELECT_CLASS =
  'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#0052CC] transition-colors disabled:bg-slate-50';

/** Các mức điểm từ min tới max theo bước (làm tròn để tránh lỗi số thực 0.1 + 0.2). */
function scoreOptions(min: number, max: number, step: number): number[] {
  if (!(step > 0) || max <= min) return [];
  const count = Math.floor((max - min) / step + 1e-9);
  return Array.from({ length: count + 1 }, (_, i) => Math.round((min + i * step) * 100) / 100);
}

export const TargetGoalFields: React.FC<TargetGoalFieldsProps> = ({ value, onChange, disabled }) => {
  const certificates = useQuery({ queryKey: QUERY_KEYS.catalog.certificates, queryFn: fetchCertificates });
  const certificate = (certificates.data ?? []).find((c) => c.certificateId === value.certificateId);
  const scoring = certificate ? getCertificateScoring(certificate) : null;

  const options = useMemo(
    () => (scoring ? scoreOptions(scoring.minScore, scoring.maxScore, scoring.step) : []),
    [scoring],
  );
  const format = (n: number) => (scoring && scoring.maxScore <= 10 ? n.toFixed(1) : String(n));

  const changeCertificate = (certificateId: string) => {
    const next = (certificates.data ?? []).find((c) => c.certificateId === certificateId);
    const nextScoring = next ? getCertificateScoring(next) : null;
    const nextOptions = nextScoring ? scoreOptions(nextScoring.minScore, nextScoring.maxScore, nextScoring.step) : [];
    // Điểm cũ không thuộc thang mới (VD 7.5 IELTS → TOEIC) thì xóa để người học chọn lại
    const keep = value.score !== '' && nextOptions.includes(Number(value.score));
    onChange({ certificateId, score: keep ? value.score : '' });
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className={LABEL_CLASS}>Chứng chỉ mục tiêu</label>
        <div className="relative">
          <Award className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <select
            value={value.certificateId}
            onChange={(e) => changeCertificate(e.target.value)}
            disabled={disabled || certificates.isLoading}
            className={SELECT_CLASS}
          >
            <option value="">{certificates.isLoading ? 'Đang tải…' : '— Chọn chứng chỉ —'}</option>
            {(certificates.data ?? []).map((c) => (
              <option key={c.certificateId} value={c.certificateId}>
                {c.certificateName}
              </option>
            ))}
          </select>
        </div>
        {certificates.isError && <p className="mt-1 text-xs text-status-danger">Không tải được danh sách chứng chỉ</p>}
      </div>

      <div>
        <label className={LABEL_CLASS}>
          Điểm mục tiêu{scoring ? ` (${scoring.minScore} – ${scoring.maxScore} ${scoring.unit})` : ''}
        </label>
        <div className="relative">
          <Sparkles className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <select
            value={value.score === '' ? '' : String(value.score)}
            onChange={(e) => onChange({ ...value, score: e.target.value === '' ? '' : Number(e.target.value) })}
            disabled={disabled || !scoring}
            className={SELECT_CLASS}
          >
            <option value="">{scoring ? '— Chọn điểm —' : 'Chọn chứng chỉ trước'}</option>
            {options.map((o) => (
              <option key={o} value={String(o)}>
                {format(o)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TargetGoalFields;
