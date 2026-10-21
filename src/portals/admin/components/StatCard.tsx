import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface SparklineProps {
  color?: string;
  className?: string;
  points?: number[];
}

export const Sparkline: React.FC<SparklineProps> = ({
  color = '#2563EB',
  className,
  points = [20, 35, 25, 45, 30, 60, 48, 75],
}) => {
  const width = 80;
  const height = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Generate smooth curve command
  const pathD = coords.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr}`;
    const [prevX, prevY] = arr[idx - 1].split(',').map(Number);
    const [currX, currY] = curr.split(',').map(Number);
    const midX = (prevX + currX) / 2;
    return `${acc} C ${midX},${prevY} ${midX},${currY} ${currX},${currY}`;
  }, '');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={cn('overflow-visible shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d={pathD}
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose';
  trendPoints?: number[];
  className?: string;
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50/80',
    text: 'text-[#0052CC]',
    sparkline: '#0052CC',
    subtext: 'text-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-600',
    sparkline: '#10B981',
    subtext: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50/80',
    text: 'text-amber-600',
    sparkline: '#F59E0B',
    subtext: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50/80',
    text: 'text-purple-600',
    sparkline: '#9333EA',
    subtext: 'text-purple-600',
  },
  cyan: {
    bg: 'bg-cyan-50/80',
    text: 'text-cyan-600',
    sparkline: '#06B6D4',
    subtext: 'text-cyan-600',
  },
  rose: {
    bg: 'bg-rose-50/80',
    text: 'text-rose-600',
    sparkline: '#F43F5E',
    subtext: 'text-rose-600',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorScheme = 'blue',
  trendPoints,
  className,
}) => {
  const conf = COLOR_MAP[colorScheme] || COLOR_MAP.blue;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner',
            conf.bg,
            conf.text,
          )}
        >
          <Icon className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {value}
          </p>
          {subtext && (
            <p className={cn('text-xs font-bold mt-0.5 flex items-center gap-1', conf.subtext)}>
              {subtext}
            </p>
          )}
        </div>
      </div>

      <div className="hidden sm:block shrink-0">
        <Sparkline color={conf.sparkline} points={trendPoints} />
      </div>
    </div>
  );
};

export default StatCard;
