import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchInput({ className, placeholder = 'Search...', value, onChange, onClear, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-9 py-2 bg-white border border-border rounded-xl text-sm transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        {...props}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
