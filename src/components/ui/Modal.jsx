import React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, description, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={cn(
          "bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-border animate-in fade-in zoom-in duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-text-main">{title}</h3>
            {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
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
    <div className={cn("mt-6 flex justify-end space-x-3", className)}>
      {children}
    </div>
  );
}
