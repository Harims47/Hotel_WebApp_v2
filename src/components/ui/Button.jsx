import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-sm',
    secondary: 'bg-white border border-border text-text-main hover:bg-gray-50 focus:ring-gray-200 shadow-sm',
    outline: 'border border-border text-text-main hover:bg-gray-50 focus:ring-gray-200',
    ghost: 'hover:bg-gray-100 text-text-main focus:ring-gray-200',
    danger: 'bg-status-danger text-white hover:bg-red-600 focus:ring-status-danger shadow-sm',
    success: 'bg-status-success text-white hover:bg-green-600 focus:ring-status-success shadow-sm',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';
