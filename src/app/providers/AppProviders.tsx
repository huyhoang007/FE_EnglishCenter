/**
 * AppProviders — root composition
 * -----------------------------------------------------------
 * Bọc QueryClientProvider + BrowserRouter duy nhất.
 * Mọi context khác (theme, toast, i18n) sẽ thêm ở đây.
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/shared/components/Toast';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { queryClient } from '@/shared/api/queryClient';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ToastProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
