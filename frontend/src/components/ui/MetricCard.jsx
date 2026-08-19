import React from 'react';
import { cn } from '../../utils/cn';

/**
 * StatCard — operational metric display used on dashboards
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-light',
  trend,
  trendLabel,
  accentBar,
  accentBarColor = 'bg-primary',
  className,
  onClick,
  ...props
}) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'relative bg-surface rounded-2xl border border-border shadow-card overflow-hidden',
        isClickable && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {accentBar && (
        <div className={cn('absolute top-0 left-0 right-0 h-0.5', accentBarColor)} />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-text-muted leading-none">{label}</p>
          {Icon && (
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
              <Icon className={cn('w-4.5 h-4.5', iconColor)} style={{ width: '18px', height: '18px' }} />
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-text-main leading-none">{value}</p>
        {(sub || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-2.5">
            {trend !== undefined && (
              <span className={cn(
                'inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md',
                trend >= 0 ? 'bg-status-success-bg text-status-success-text' : 'bg-status-danger-bg text-status-danger-text'
              )}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
            {(sub || trendLabel) && (
              <p className="text-xs text-text-muted">{sub || trendLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Backward-compatible alias — many pages import MetricCard from this file
export { StatCard as MetricCard };
