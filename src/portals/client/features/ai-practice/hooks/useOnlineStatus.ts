/**
 * useOnlineStatus — trạng thái mạng của trình duyệt (sự kiện online / offline)
 * -----------------------------------------------------------
 * navigator.onLine = false là chắc chắn mất mạng; = true chỉ có nghĩa là còn kết nối tới router,
 * nên lỗi gọi API vẫn phải xử lý riêng (axiosClient đã trả "Không kết nối được máy chủ").
 */

import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
