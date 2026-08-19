import React from 'react';
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
