import React from 'react';
import { cn } from '../../utils/cn';

export function Tabs({ className, children }) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={cn("inline-flex h-12 items-center justify-center rounded-lg bg-gray-100 p-1 text-text-muted", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ className, isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-white text-text-main shadow-sm" 
          : "hover:bg-gray-200 hover:text-text-main",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ className, isActive, children }) {
  if (!isActive) return null;
  return (
    <div className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
}
