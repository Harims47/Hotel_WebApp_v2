import React from 'react';
import { cn } from '../../utils/cn';

export function Tabs({ className, children }) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}

export function TabsList({ className, children, variant = 'pill' }) {
  if (variant === 'line') {
    return (
      <div className={cn('flex border-b border-border', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn(
      'inline-flex items-center rounded-xl bg-canvas border border-border p-1 gap-0.5',
      className
    )}>
      {children}
    </div>
  );
}

export function TabsTrigger({ className, isActive, onClick, children, count, variant = 'pill' }) {
  if (variant === 'line') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap',
          isActive
            ? 'border-primary text-primary'
            : 'border-transparent text-text-muted hover:text-text-main hover:border-border-strong',
          className
        )}
      >
        {children}
        {count !== undefined && (
          <span className={cn(
            'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
            isActive ? 'bg-primary text-white' : 'bg-border text-text-muted'
          )}>
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap',
        isActive
          ? 'bg-surface text-text-main shadow-card'
          : 'text-text-muted hover:text-text-main hover:bg-surface/60',
        className
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
          isActive ? 'bg-primary text-white' : 'bg-border text-text-muted'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

export function TabsContent({ className, isActive, children }) {
  if (!isActive) return null;
  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}
