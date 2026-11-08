/**
 * SubmissionViewer — Trình xem bài nộp của học viên (TRÁI của màn chấm)
 * -----------------------------------------------------------
 * Xử lý 3 dạng nội dung:
 *   - `file`   → trình xem PDF trong iframe (URL có thời hạn do BE cấp)
 *   - `audio`  → trình phát audio
 *   - `text`   → văn bản bài làm
 */

import React from 'react';
import { Download, FileText, PlayCircle } from 'lucide-react';

interface SubmissionViewerProps {
  submissionType?: string | null;
  answerContent?: string | null;
  fileUrl?: string | null;
  fileOriginalName?: string | null;
  fileFormat?: string | null;
  fileBytes?: number | null;
}

const isPdf = (format?: string | null) =>
  (format ?? '').toLowerCase() === 'pdf';

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submissionType,
  answerContent,
  fileUrl,
  fileOriginalName,
  fileFormat,
  fileBytes,
}) => {
  const type = (submissionType ?? 'text').toLowerCase();

  /* ---------------- PDF ---------------- */
  if (type === 'file' && fileUrl && isPdf(fileFormat)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">
            {fileOriginalName ?? 'Tài liệu học viên nộp'}
          </span>
          {fileBytes ? (
            <span className="text-[11px] text-slate-400">
              {Math.round(fileBytes / 1024)} KB
            </span>
          ) : null}
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            Mở tab mới
          </a>
        </div>
        <iframe
          title="Nội dung bài nộp"
          src={fileUrl}
          className="w-full h-[560px] rounded-xl border border-slate-200 bg-slate-50"
        />
      </div>
    );
  }

  /* ---------------- File (không phải PDF) ---------------- */
  if (type === 'file') {
    return (
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {fileOriginalName ?? 'File đính kèm'}
        </p>
        <p className="text-[11px] text-slate-500">
          Định dạng: {(fileFormat ?? '—').toUpperCase()}
          {fileBytes ? ` · ${Math.round(fileBytes / 1024)} KB` : ''}
        </p>
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            Tải / xem file (URL có thời hạn)
          </a>
        ) : (
          <p className="text-[11px] text-amber-600">
            Chưa có URL xem file — backend cần cấu hình Cloudinary.
          </p>
        )}
        {answerContent?.trim() ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1 border-t border-slate-200">
            {answerContent.trim()}
          </p>
        ) : null}
      </div>
    );
  }

  /* ---------------- Audio ---------------- */
  if (type === 'audio') {
    const audioUrl = answerContent?.trim() ?? '';
    const isUrl = /^https?:\/\//i.test(audioUrl);
    return (
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5" />
          Bài ghi âm của học viên
        </p>
        {isUrl ? (
          <audio controls src={audioUrl} className="w-full" />
        ) : audioUrl ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {audioUrl}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">
            Học viên chưa gửi kèm bản ghi âm / bản phiên âm.
          </p>
        )}
      </div>
    );
  }

  /* ---------------- Text ---------------- */
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
        {answerContent?.trim() || '(Học viên không nhập nội dung)'}
      </p>
    </div>
  );
};

export default SubmissionViewer;
