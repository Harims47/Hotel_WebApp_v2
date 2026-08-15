import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-orange-600 focus:ring-primary',
    secondary: 'bg-primary-light text-primary hover:bg-orange-100 focus:ring-primary',
    outline: 'border border-border text-text-main hover:bg-gray-50 focus:ring-gray-200',
    ghost: 'hover:bg-gray-100 text-text-main focus:ring-gray-200',
    danger: 'bg-status-danger text-white hover:bg-red-600 focus:ring-status-danger',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg',
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
