/**
 * Schedule mock data
 * -----------------------------------------------------------
 * Mock cho lịch học, buổi kèm 1-1 và khung giờ đặt lịch.
 */

export interface UpcomingSession {
  id: string;
  dateLabel: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  topic: string;
  mentor: {
    fullName: string;
    title: string;
    avatarUrl: string;
  };
  roomUrl: string;
}

export interface MentorProfile {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
  rating: number;
  ratingCount: number;
  pricePerHour: number;
  bio: string;
}

export type SlotStatus = 'BOOKED' | 'AVAILABLE';

export interface ScheduleSlot {
  start: string;
  end: string;
  status: SlotStatus;
}

export interface DayLabel {
  short: string;
  full: string;
}

export const MOCK_UPCOMING_SESSION: UpcomingSession = {
  id: 'ses_001',
  dateLabel: 'Hôm nay',
  dateIso: '2026-10-11',
  startTime: '19:30',
  endTime: '20:30',
  topic: 'Luyện phản xạ Speaking Part 2 & 3',
  mentor: {
    fullName: 'David Smith',
    title: 'Chuyên gia IELTS · 8.5 Overall',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=david&backgroundColor=c0aede',
  },
  roomUrl: '#room-001',
};

export const MOCK_MENTOR_FOR_BOOKING: MentorProfile = {
  id: 'mnt_david_smith',
  fullName: 'David Smith',
  title: 'Chuyên gia IELTS · 8.5 Overall',
  avatarUrl:
    'https://api.dicebear.com/7.x/avataaars/svg?seed=david&backgroundColor=c0aede',
  rating: 4.9,
  ratingCount: 1284,
  pricePerHour: 300000,
  bio: 'Hơn 10 năm đào tạo IELTS cho học viên Việt Nam, từng là cựu giám khảo IDP.',
};

export const MOCK_DAY_LABELS: DayLabel[] = [
  { short: 'T2', full: 'Thứ 2' },
  { short: 'T3', full: 'Thứ 3' },
  { short: 'T4', full: 'Thứ 4' },
  { short: 'T5', full: 'Thứ 5' },
  { short: 'T6', full: 'Thứ 6' },
  { short: 'T7', full: 'Thứ 7' },
  { short: 'CN', full: 'Chủ Nhật' },
];

/** Khung giờ mở theo từng ngày (key: index 0..6 — T2..CN) */
export const MOCK_SLOTS_BY_DAY: Record<number, ScheduleSlot[]> = {
  0: [
    { start: '09:00', end: '10:00', status: 'BOOKED' },
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
  1: [
    { start: '09:00', end: '10:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'BOOKED' },
  ],
  2: [
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
  3: [
    { start: '09:00', end: '10:00', status: 'AVAILABLE' },
    { start: '14:00', end: '15:00', status: 'BOOKED' },
  ],
  4: [
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
  5: [{ start: '09:00', end: '10:00', status: 'AVAILABLE' }],
  6: [
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
};
