import React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../utils/cn';

export function EmptyState({ icon: Icon = FileText, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-border/50">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-bold text-lg text-text-main mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-sm mx-auto mb-6">{description}</p>}
      {action}
    </div>
  );
}
