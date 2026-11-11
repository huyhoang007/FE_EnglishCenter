/**
 * useStudySchedule — hook TanStack Query cho lịch học của học viên (Dev 5)
 * -----------------------------------------------------------
 * Lịch học lấy từ các buổi kèm 1-1 của mentor. Query key nằm dưới QUERY_KEYS.schedule.all
 * nên khi hủy / xin dời buổi ở trang Mentor 1-1 thì danh sách này cũng tự tải lại.
 */

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import type { StudyScheduleStatus } from '@/shared/types';
import { getMyStudySchedulesApi } from './studyScheduleService';

/** Lịch học của tôi (30 ngày tới), lọc theo trạng thái nếu có */
export function useMyStudySchedules(status: StudyScheduleStatus | undefined, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.studySchedule.list(status ?? 'all', page),
    queryFn: async () => unwrapOrThrow(await getMyStudySchedulesApi(status, page)),
  });
}
