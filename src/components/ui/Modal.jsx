import React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, description, children, className, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className={cn(
          'bg-surface rounded-2xl shadow-modal w-full overflow-hidden border border-border animate-scale-in',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-text-main leading-tight">{title}</h3>
            {description && <p className="text-sm text-text-muted mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 p-1.5 text-text-muted hover:text-text-main hover:bg-canvas rounded-xl transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ children, className }) {
  return (
    <div className={cn('mt-6 flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}

/**
 * BottomSheet — tablet/mobile drawer from the bottom
 */
export function BottomSheet({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div
        className={cn('bottom-sheet-content', className)}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'sheet-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-base font-bold text-text-main">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-main hover:bg-canvas rounded-xl transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '75vh' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
