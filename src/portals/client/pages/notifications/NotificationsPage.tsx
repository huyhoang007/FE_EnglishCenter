/**
 * NotificationsPage — Wrapper cho NotificationsView
 * -----------------------------------------------------------
 * URL: /notifications
 */

import React from 'react';
import { NotificationsView } from '@/portals/client/features/notifications';

const NotificationsPage: React.FC = () => {
  // Khung nội dung giống các trang client khác: max-w căn giữa
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <NotificationsView />
    </div>
  );
};

export default NotificationsPage;
