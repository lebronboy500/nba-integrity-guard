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

  return (
    <div className="card">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${colorClass}`}>
          {formattedValue}
        </span>
        {trend !== 'neutral' && (
          <span className={`text-xs ${
            trend === 'up' ? 'text-primary-400' : 'text-danger-400'
          }`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
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
