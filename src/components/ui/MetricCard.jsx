import React from 'react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

export function MetricCard({ title, value, icon: Icon, trend, trendValue, className }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <h4 className="mt-2 text-2xl font-bold text-text-main">{value}</h4>
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span
            className={cn(
              "font-medium",
              trend === 'up' ? "text-status-success" : trend === 'down' ? "text-status-danger" : "text-text-muted"
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
          </span>
          <span className="ml-2 text-text-muted">vs last period</span>
        </div>
      )}
    </Card>
  );
}
