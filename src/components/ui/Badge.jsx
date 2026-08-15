import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-light text-primary',
    success: 'bg-green-100 text-status-success',
    warning: 'bg-yellow-100 text-status-warning',
    danger: 'bg-red-100 text-status-danger',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
