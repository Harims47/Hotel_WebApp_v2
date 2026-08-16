import React from 'react';
import { cn } from '../../utils/cn';

export function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", className)}>
      <div>
        <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
