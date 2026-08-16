import React from 'react';
import { cn } from '../../utils/cn';

export function IconButton({ icon: Icon, onClick, className, variant = 'default', size = 'default', disabled, title }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'text-text-muted hover:text-text-main hover:bg-gray-100',
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20',
    danger: 'text-red-500 hover:bg-red-50',
    outline: 'border border-border text-text-muted hover:text-text-main hover:bg-gray-50'
  };

  const sizes = {
    sm: 'w-7 h-7',
    default: 'w-9 h-9',
    lg: 'w-11 h-11'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button 
      onClick={onClick} 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      title={title}
      type="button"
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}
