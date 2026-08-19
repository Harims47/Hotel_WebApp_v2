import React from 'react';
import { cn } from '../../utils/cn';

const STATUS_CONFIG = {
  // Order statuses
  ORDERED:      { label: 'Ordered',      dot: 'bg-status-info',      bg: 'bg-status-info-bg',      text: 'text-status-info-text' },
  PREPARING:    { label: 'Preparing',    dot: 'bg-status-preparing', bg: 'bg-status-preparing-bg', text: 'text-purple-700' },
  READY:        { label: 'Ready',        dot: 'bg-status-success',   bg: 'bg-status-success-bg',   text: 'text-status-success-text' },
  PICKED_UP:    { label: 'Picked Up',    dot: 'bg-primary',          bg: 'bg-primary-light',       text: 'text-primary-dark' },
  SERVED:       { label: 'Served',       dot: 'bg-gray-400',         bg: 'bg-gray-100',            text: 'text-gray-600' },
  CANCELLED:    { label: 'Cancelled',    dot: 'bg-status-danger',    bg: 'bg-status-danger-bg',    text: 'text-status-danger-text' },
  CLOSED:       { label: 'Closed',       dot: 'bg-gray-400',         bg: 'bg-gray-100',            text: 'text-gray-500' },
  IN_PROGRESS:  { label: 'In Progress',  dot: 'bg-status-info',      bg: 'bg-status-info-bg',      text: 'text-status-info-text' },
  // Delivery statuses
  PENDING:      { label: 'Pending',      dot: 'bg-status-warning',   bg: 'bg-status-warning-bg',   text: 'text-status-warning-text' },
  ASSIGNED:     { label: 'Assigned',     dot: 'bg-status-info',      bg: 'bg-status-info-bg',      text: 'text-status-info-text' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', dot: 'bg-primary',  bg: 'bg-primary-light',       text: 'text-primary-dark' },
  DELIVERED:    { label: 'Delivered',    dot: 'bg-status-success',   bg: 'bg-status-success-bg',   text: 'text-status-success-text' },
  // Table statuses
  AVAILABLE:    { label: 'Available',    dot: 'bg-status-success',   bg: 'bg-status-success-bg',   text: 'text-status-success-text' },
  OCCUPIED:     { label: 'Occupied',     dot: 'bg-primary',          bg: 'bg-primary-light',       text: 'text-primary-dark' },
  RESERVED:     { label: 'Reserved',     dot: 'bg-status-warning',   bg: 'bg-status-warning-bg',   text: 'text-status-warning-text' },
  CLEANING:     { label: 'Cleaning',     dot: 'bg-gray-400',         bg: 'bg-gray-100',            text: 'text-gray-600' },
  // Bill statuses
  REQUESTED:    { label: 'Requested',    dot: 'bg-status-warning',   bg: 'bg-status-warning-bg',   text: 'text-status-warning-text' },
  PRINTED:      { label: 'Printed',      dot: 'bg-status-info',      bg: 'bg-status-info-bg',      text: 'text-status-info-text' },
  PAID:         { label: 'Paid',         dot: 'bg-status-success',   bg: 'bg-status-success-bg',   text: 'text-status-success-text' },
  // Generic
  NEW:          { label: 'New',          dot: 'bg-status-info',      bg: 'bg-status-info-bg',      text: 'text-status-info-text' },
  ACTIVE:       { label: 'Active',       dot: 'bg-status-success',   bg: 'bg-status-success-bg',   text: 'text-status-success-text' },
  INACTIVE:     { label: 'Inactive',     dot: 'bg-gray-400',         bg: 'bg-gray-100',            text: 'text-gray-500' },
};

/**
 * StatusPill — semantic status indicator with dot + label
 */
export function StatusPill({ status, className, showDot = true, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    dot: 'bg-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  };

  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const dotSize = size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
      config.bg, config.text, sizeClass, className
    )}>
      {showDot && <span className={cn('rounded-full shrink-0', config.dot, dotSize)} />}
      {config.label}
    </span>
  );
}

/**
 * Badge — simple label badge
 */
export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default:   'bg-gray-100 text-gray-600',
    primary:   'bg-primary-light text-primary-dark',
    success:   'bg-status-success-bg text-status-success-text',
    warning:   'bg-status-warning-bg text-status-warning-text',
    danger:    'bg-status-danger-bg text-status-danger-text',
    secondary: 'bg-status-info-bg text-status-info-text',
    muted:     'bg-canvas text-text-muted',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
