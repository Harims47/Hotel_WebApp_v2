import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({ className, label, hideLabel, error, options = [], ...props }, ref) => {
  return (
    <div className="w-full">
      {label && !hideLabel && <label className="block text-sm font-bold text-text-main mb-1.5">{label}</label>}
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
            <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
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
