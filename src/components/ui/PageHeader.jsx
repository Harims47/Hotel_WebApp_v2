import React from 'react';
import { cn } from '../../utils/cn';

export function PageHeader({ title, description, breadcrumbs, actions, children, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", className)}>
      <div>
        {breadcrumbs && <p className="text-xs font-semibold tracking-wider text-primary uppercase mb-1">{breadcrumbs}</p>}
        <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
