import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  ...props
}, ref) => {
  const baseStyles = [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
    'transition-all duration-150 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'active:scale-[0.97]',
  ].join(' ');

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-primary-sm hover:shadow-primary-md focus-visible:ring-primary',
    secondary: 'bg-surface border border-border text-text-main hover:bg-canvas hover:border-border-strong focus-visible:ring-primary shadow-card',
    outline: 'border border-border text-text-main hover:bg-canvas hover:border-border-strong focus-visible:ring-primary',
    ghost: 'text-text-muted hover:bg-canvas hover:text-text-main focus-visible:ring-primary',
    danger: 'bg-status-danger text-white hover:bg-red-600 focus-visible:ring-status-danger shadow-sm',
    success: 'bg-status-success text-white hover:bg-green-600 focus-visible:ring-status-success shadow-sm',
    'danger-outline': 'border border-status-danger/40 text-status-danger-text hover:bg-status-danger-bg focus-visible:ring-status-danger',
  };

  const sizes = {
    xs: 'h-8 px-3 text-xs rounded-lg',
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-base',
    icon: 'h-11 w-11',
    'icon-sm': 'h-9 w-9 rounded-xl',
    'icon-lg': 'h-12 w-12',
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {RightIcon && !loading && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
});
Button.displayName = 'Button';
