/**
 * notificationSocket — client STOMP tối giản qua WebSocket thuần (TASK-D5-02)
 * -----------------------------------------------------------
 * BE: endpoint /ws-connect, server đẩy thông báo tới /topic/notifications/{userId}.
 * - CONNECT gửi header Authorization: Bearer <accessToken> (BE kiểm tra JWT ở frame này).
 * - Chỉ SUBSCRIBE đúng topic của chính mình (BE chặn topic người khác).
 * - Mất kết nối thì tự kết nối lại sau vài giây; gọi hàm trả về để đóng hẳn.
 * Không cần thư viện ngoài: STOMP 1.2 chỉ là các frame văn bản kết thúc bằng ký tự NULL.
 */

const RECONNECT_DELAY_MS = 5_000;
const NULL_CHAR = '\u0000';

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

/** URL WebSocket: dev đi qua Vite proxy (cùng host), production lấy theo VITE_API_URL nếu có */
function socketUrl(): string {
  const apiUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL;
  const base = apiUrl ? new URL(apiUrl, window.location.href) : new URL(window.location.href);
  const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${base.host}/ws-connect`;
}

function buildFrame(command: string, headers: Record<string, string>): string {
  const lines = Object.entries(headers).map(([k, v]) => `${k}:${v}`);
  return `${command}\n${lines.join('\n')}\n\n${NULL_CHAR}`;
}

function parseFrames(data: string): StompFrame[] {
  return data
    .split(NULL_CHAR)
    .map((raw) => raw.replace(/^\n+/, ''))
    .filter((raw) => raw.trim().length > 0)
    .map((raw) => {
      const split = raw.indexOf('\n\n');
      const head = split >= 0 ? raw.slice(0, split) : raw;
      const body = split >= 0 ? raw.slice(split + 2) : '';
      const [command, ...headerLines] = head.split('\n');
      const headers: Record<string, string> = {};
      headerLines.forEach((line) => {
        const i = line.indexOf(':');
        if (i > 0) headers[line.slice(0, i)] = line.slice(i + 1);
      });
      return { command: command.trim(), headers, body };
    });
}

/**
 * Mở kết nối nhận thông báo realtime của user.
 * @returns hàm đóng kết nối (dùng trong cleanup của useEffect)
 */
export function connectNotificationSocket(
  accessToken: string,
  userId: string,
  onNotification: (payload: unknown) => void,
): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedByUser = false;

  const open = () => {
    socket = new WebSocket(socketUrl());

    socket.onopen = () => {
      socket?.send(
        buildFrame('CONNECT', {
          'accept-version': '1.2',
          'heart-beat': '0,0',
          host: window.location.hostname,
          Authorization: `Bearer ${accessToken}`,
        }),
      );
    };

    socket.onmessage = (event) => {
      parseFrames(String(event.data)).forEach((frame) => {
        if (frame.command === 'CONNECTED') {
          socket?.send(
            buildFrame('SUBSCRIBE', { id: 'notifications', destination: `/topic/notifications/${userId}` }),
          );
        } else if (frame.command === 'MESSAGE') {
          try {
            onNotification(JSON.parse(frame.body));
          } catch {
            onNotification(null);
          }
        } else if (frame.command === 'ERROR') {
          // Token hết hạn / sai quyền: BE đóng phiên, để onclose tự kết nối lại (token mới nếu đã refresh)
          console.warn('[notifications] STOMP ERROR:', frame.headers.message);
        }
      });
    };

    socket.onclose = () => {
      if (!closedByUser) reconnectTimer = setTimeout(open, RECONNECT_DELAY_MS);
    };
  };

  open();

  return () => {
    closedByUser = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(buildFrame('DISCONNECT', {}));
    }
    socket?.close();
  };
}
