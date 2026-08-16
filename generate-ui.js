const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'src', 'components', 'ui');
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

const components = {
  'IconButton.jsx': import React from 'react';
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
,
  'Input.jsx': import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, label, error, helperText, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-text-main mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-2 bg-white border border-border rounded-xl text-sm transition-all duration-200 outline-none",
          "focus:border-primary focus:ring-4 focus:ring-primary/10",
          "disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-text-muted">{helperText}</p>}
    </div>
  );
});
Input.displayName = 'Input';
,
  'Select.jsx': import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({ className, label, error, options = [], ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-text-main mb-1.5">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-2 pr-10 bg-white border border-border rounded-xl text-sm appearance-none transition-all duration-200 outline-none cursor-pointer",
            "focus:border-primary focus:ring-4 focus:ring-primary/10",
            "disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
          {props.children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';
,
  'SearchInput.jsx': import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchInput({ className, placeholder = 'Search...', value, onChange, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        {...props}
      />
    </div>
  );
}
,
  'Modal.jsx': import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Modal({ isOpen, onClose, title, children, footer, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn("bg-surface w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200", className)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <h2 className="text-lg font-bold text-text-main">{title}</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-6 bg-gray-50/30 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-white flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
,
  'Tabs.jsx': import React from 'react';
import { cn } from '../../utils/cn';

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn("flex space-x-1 border-b border-border overflow-x-auto custom-scrollbar", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-2",
            activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-main hover:bg-gray-50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
,
  'PageHeader.jsx': import React from 'react';
import { cn } from '../../utils/cn';

export function PageHeader({ title, description, breadcrumbs, actions, className }) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", className)}>
      <div>
        {breadcrumbs && (
          <div className="text-xs font-bold text-primary tracking-wider uppercase mb-1">
            {breadcrumbs}
          </div>
        )}
        <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        {description && (
          <p className="text-sm text-text-muted mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
,
  'QuantitySelector.jsx': import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { IconButton } from './IconButton';
import { cn } from '../../utils/cn';

export function QuantitySelector({ quantity, onIncrease, onDecrease, min = 0, className }) {
  return (
    <div className={cn("flex items-center bg-white border border-border rounded-xl shadow-sm p-1", className)}>
      <IconButton 
        icon={Minus} 
        size="sm" 
        onClick={onDecrease} 
        disabled={quantity <= min} 
      />
      <span className="w-8 text-center text-sm font-bold text-text-main">
        {quantity}
      </span>
      <IconButton 
        icon={Plus} 
        size="sm" 
        onClick={onIncrease} 
      />
    </div>
  );
}

};

for (const [filename, content] of Object.entries(components)) {
  fs.writeFileSync(path.join(uiDir, filename), content);
}
console.log('UI components generated successfully.');
