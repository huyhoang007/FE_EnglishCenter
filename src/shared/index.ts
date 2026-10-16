/**
 * Shared module barrel
 * -----------------------------------------------------------
 * Một điểm vào duy nhất cho mọi module trong tầng shared.
 * Các portal import từ đây để đảm bảo phân lớp rõ ràng.
 */

export * from './api';
export * from './auth';
export * from './components';
export * from './config';
export * from './constants';
export * from './hooks';
export * from './stores';
export * from './types';
export * from './utils';
