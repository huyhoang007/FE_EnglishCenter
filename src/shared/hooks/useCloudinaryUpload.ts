/**
 * useCloudinaryUpload — upload file thẳng lên Cloudinary (Dev 2.5)
 * -----------------------------------------------------------
 * Luồng:
 *   1. FE xin chữ ký từ BE:  POST /api/v1/uploads/signature
 *   2. FE POST thẳng lên Cloudinary (không đi qua BE):
 *        https://api.cloudinary.com/v1_1/{cloudName}/{resourceType}/upload
 *   3. FE gửi public_id + metadata về BE khi nộp bài.
 *
 * API secret KHÔNG BAO GIỜ nằm ở frontend — BE chỉ trả apiKey + signature.
 *
 * Hỗ trợ tiến độ upload (progress %) qua XMLHttpRequest.
 */

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/shared/components/Toast';
import { createUploadSignatureApi } from '@/shared/api/homeworkService';
import {
  isFileSizeAllowed,
  resolveResourceType,
  type CloudinaryUploadResult,
  type UploadPurpose,
  type UploadSignature,
} from '@/shared/types/homework.types';

export interface CloudinaryUploadArgs {
  file: File;
  purpose: UploadPurpose;
  homeworkContentId?: string;
  /** Gọi khi upload thành công. */
  onUploaded?: (result: CloudinaryUploadResult) => void;
  /** Hiển thị thông báo lỗi (mặc định dùng toast của app). */
  notifyError?: (message: string) => void;
}

export interface UseCloudinaryUpload {
  /** true khi đang upload. */
  isUploading: boolean;
  /** Tiến độ 0–100. */
  progress: number;
  /** Lỗi gần nhất (null = không lỗi). */
  error: string | null;
  /** Bắt đầu upload. Trả về true nếu thành công. */
  upload: (args: CloudinaryUploadArgs) => Promise<boolean>;
  /** Xoá lỗi. */
  reset: () => void;
}

/** Định dạng lỗi cho toast. */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Không thể upload file. Vui lòng thử lại.';
}

/** Giới hạn dung lượng (MB) theo resource_type — khớp với BE. */
const MAX_MB: Record<'image' | 'raw' | 'video', number> = {
  image: 5,
  raw: 20,
  video: 100,
};

/**
 * Upload một file lên Cloudinary.
 *
 * @returns true nếu upload thành công
 */
export async function uploadToCloudinary(
  args: CloudinaryUploadArgs,
  onProgress?: (percent: number) => void,
): Promise<boolean> {
  const { file, purpose, homeworkContentId } = args;
  const notifyError =
    args.notifyError ??
    ((message: string) => {
      // Fallback khi gọi ngoài React (không có ToastProvider).
      console.error(message);
    });

  // ---- Kiểm tra phía FE (BE cũng kiểm tra lại) ----
  const resourceType = resolveResourceType(file.name);
  if (!resourceType) {
    notifyError(
      `Định dạng file ".${file.name.split('.').pop()}" không được phép.`,
    );
    return false;
  }
  if (!isFileSizeAllowed(resourceType, file.size)) {
    notifyError(`Dung lượng file vượt quá ${MAX_MB[resourceType]} MB.`);
    return false;
  }

  // ---- 1. Xin chữ ký ----
  const signatureRes = await createUploadSignatureApi({
    purpose,
    homeworkContentId,
    fileFormat: file.name.split('.').pop()?.toLowerCase(),
    fileBytes: file.size,
    fileName: file.name,
  });
  if (!signatureRes.success) {
    notifyError(signatureRes.message || 'Không lấy được chữ ký upload.');
    return false;
  }
  const signature: UploadSignature = signatureRes.data;

  // ---- 2. Upload thẳng lên Cloudinary ----
  const uploadResult = await postToCloudinary(file, signature, onProgress);
  if (!uploadResult || uploadResult.error) {
    notifyError(
      uploadResult?.error?.message || 'Upload lên Cloudinary thất bại.',
    );
    return false;
  }

  args.onUploaded?.(uploadResult);
  return true;
}

/** POST multipart lên Cloudinary bằng XMLHttpRequest (để có progress). */
function postToCloudinary(
  file: File,
  signature: UploadSignature,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult | null> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('signature', signature.signature);
    form.append('folder', signature.folder);
    form.append('resource_type', signature.resourceType);
    // Delivery type: bài nộp học viên = authenticated (private), tài liệu = upload (public).
    // PHẢI gửi kèm — nếu thiếu, Cloudinary mặc định `upload` (public).
    if (signature.deliveryType) {
      form.append('type', signature.deliveryType);
    }

    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;

    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
        onProgress?.(100);
        resolve(parsed);
      } catch {
        reject(new Error('Không đọc được kết quả upload.'));
      }
    };
    xhr.onerror = () => reject(new Error('Lỗi mạng khi upload file.'));
    xhr.send(form);
  });
}

/** Hook React wrapper quanh {@link uploadToCloudinary}. */
export function useCloudinaryUpload(): UseCloudinaryUpload {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const upload = useCallback(
    async (args: CloudinaryUploadArgs) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      try {
        const ok = await uploadToCloudinary(
          { ...args, notifyError: args.notifyError ?? toast.error },
          setProgress,
        );
        if (!ok) {
          setError('Upload thất bại.');
        }
        return ok;
      } catch (err) {
        const message = describeError(err);
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [toast],
  );

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  return { isUploading, progress, error, upload, reset };
}

/** Hook dạng mutation cho react-query (tiện dùng trong component). */
export function useCloudinaryUploadMutation() {
  return useMutation({
    mutationFn: (args: CloudinaryUploadArgs) => uploadToCloudinary(args),
  });
}
