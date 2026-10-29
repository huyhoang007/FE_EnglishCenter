/**
 * useCertificateScale — thang điểm của đề theo cấu hình chứng chỉ (Dev 3)
 * -----------------------------------------------------------
 * GET /certificates (Dev 2) chỉ trả thông tin tóm tắt (không có parts) → tìm id theo id / tên ở danh sách,
 * rồi lấy chi tiết GET /certificates/{id} (có các phần thi + properties) để dựng thang bằng scaleFromCertificate.
 * Dùng chung cache với trang Chứng chỉ. Đề không gắn chứng chỉ → RAW_SCALE (điểm %).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCertificateById, fetchCertificates } from '@/shared/api/certificateService';
import { RAW_SCALE, findCertificate, scaleFromCertificate, type ScaleInfo } from '@/shared/constants/examScales';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

const STALE_TIME = 5 * 60_000;

export function useCertificates() {
  return useQuery({ queryKey: QUERY_KEYS.catalog.certificates, queryFn: fetchCertificates, staleTime: STALE_TIME });
}

export function useCertificateScale(certificateId?: string | null, certificateName?: string | null): ScaleInfo {
  const list = useCertificates();
  const summary = findCertificate(list.data, certificateId, certificateName);
  const id = certificateId || summary?.certificateId || '';
  const detail = useQuery({
    queryKey: QUERY_KEYS.catalog.certificate(id),
    queryFn: () => fetchCertificateById(id),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
  return useMemo(() => {
    if (!id) return RAW_SCALE;
    // Chi tiết chưa tải xong: dựng tạm từ bản tóm tắt (thang chung + phần thi mặc định của preset)
    return scaleFromCertificate(detail.data ?? summary);
  }, [id, detail.data, summary]);
}
