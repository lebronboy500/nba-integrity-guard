import React from 'react';
import { formatPercentage, formatCurrency } from '@/utils/format';

interface StatsCardProps {
  title: string;
  value: number | string;
  format?: 'number' | 'percentage' | 'currency';
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'danger' | 'warning' | 'neutral';
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  format = 'number',
  trend = 'neutral',
  color = 'primary',
  subtitle
}: StatsCardProps) {
  const formattedValue = formatValue(value, format);
  const colorClass = getColorClass(color);
  const trendIcon = getTrendIcon(trend);

  return (
    <div className="card">
      <div className="flex flex-col gap-2">
        {/* Title */}
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${colorClass}`}>
            {formattedValue}
          </span>
          {trend !== 'neutral' && (
            <span className={`text-sm ${
              trend === 'up' ? 'text-primary-400' : 'text-danger-400'
            }`}>
              {trendIcon}
            </span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function formatValue(value: number | string, format: string): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'percentage':
      return formatPercentage(value);
    case 'currency':
      return formatCurrency(value);
    default:
      return value.toFixed(2);
  }
}

function getColorClass(color: string): string {
  switch (color) {
    case 'primary':
      return 'text-primary-400';
    case 'danger':
      return 'text-danger-400';
    case 'warning':
      return 'text-yellow-400';
    default:
      return 'text-slate-100';
  }
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '';
  }
}
