import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, interactive = false, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-border shadow-card',
        interactive && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] active:shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1 p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-base font-bold leading-snug text-text-main', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-text-muted leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center p-5 pt-0 gap-3', className)} {...props}>
      {children}
    </div>
  );
}
