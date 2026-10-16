/**
 * queryClient — TanStack Query singleton
 * -----------------------------------------------------------
 * Cấu hình mặc định cho toàn bộ ứng dụng: retry 1 lần, refetch on
 * focus tắt theo ngữ cảnh EdTech, stale 30s, cache 5 phút.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
