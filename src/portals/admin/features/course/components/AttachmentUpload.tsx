/**
 * AttachmentUpload — upload TÀI LIỆU ĐÍNH KÈM của bài tập (Dev 2.5)
 * -----------------------------------------------------------
 * Tài liệu đính kèm là file PUBLIC (delivery type `upload`) — khác với bài nộp
 * của học viên (private, `authenticated`).
 *
 * Luồng: FE xin chữ ký từ BE (`POST /api/v1/uploads/signature` với
 * `purpose = 'attachment'`) rồi POST thẳng lên Cloudinary.
 *
 * Tài liệu được lưu trong `content_data` (JSONB) của bài tập:
 *   { attachmentUrl, attachmentPublicId, attachmentResourceType, attachmentFormat }
 */

import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  XCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useCloudinaryUpload } from '@/shared/hooks/useCloudinaryUpload';

export interface AttachmentUploadProps {
  /** URL công khai hiện tại (để hiển thị tài liệu đang gắn). */
  value?: string;
  /** Tên file hiện tại (nếu có). */
  fileName?: string;
  /** Được gọi sau khi upload thành công — truyền metadata sang form. */
  onChange: (attachment: {
    url: string;
    publicId: string;
    resourceType: string;
    format?: string;
    originalName?: string;
  }) => void;
  /** Được gọi khi xoá tài liệu đang gắn. */
  onClear?: () => void;
  disabled?: boolean;
  label?: string;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  value,
  fileName,
  onChange,
  onClear,
  disabled,
  label = 'Tài liệu đính kèm',
}) => {
  const { upload, isUploading, progress } = useCloudinaryUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
      const ok = await upload({
        file,
        // `attachment` → delivery type `upload` (public), khác `submission` (private).
        purpose: 'attachment',
        onUploaded: (result) => {
          if (!result.public_id) {
            setError('Không lấy được đường dẫn file.');
            return;
          }
          onChange({
            // File `upload` là public → `secure_url` của Cloudinary chính là URL công khai.
            url: result.secure_url ?? '',
            publicId: result.public_id,
            resourceType: result.resource_type ?? 'raw',
            format: result.format,
            originalName: result.original_filename ?? file.name,
          });
        },
      });
    if (!ok) setError('Không upload được tài liệu. Vui lòng thử lại.');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-700">{label}</p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleChange(e.target.files?.[0])}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.mkv"
      />

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-emerald-900 truncate">
              {fileName ?? 'Tài liệu đính kèm'}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-700 hover:underline"
            >
              Xem tài liệu
            </a>
          </div>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
              aria-label="Xoá tài liệu"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-[#0052CC]/40 hover:bg-blue-50/30 transition-colors disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#0052CC]" />
              <p className="text-xs font-semibold text-[#0052CC]">
                Đang tải lên… {progress}%
              </p>
            </>
          ) : (
            <>
              <Paperclip className="w-5 h-5 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">
                Chọn tài liệu đính kèm
              </p>
              <p className="text-[11px] text-slate-400">
                PDF, Word, Excel, PowerPoint, txt, ảnh, audio, video
              </p>
            </>
          )}
        </button>
      )}

      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
};

export default AttachmentUpload;
