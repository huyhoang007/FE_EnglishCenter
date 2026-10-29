import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Backend Dev 2 chạy ở http://127.0.0.1:8080
      // Giữ nguyên đường dẫn /api/v1/... nên không phải sửa service.
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
      // Dev 5: WebSocket STOMP thông báo realtime (BE endpoint /ws-connect)
      '/ws-connect': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
