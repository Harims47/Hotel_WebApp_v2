import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm',
          error && 'border-status-danger focus:ring-status-danger/20 focus:border-status-danger',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-status-danger">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';
