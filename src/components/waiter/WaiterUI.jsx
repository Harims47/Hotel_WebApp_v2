import React from 'react';
import { Plus, Minus, Star, Sparkles, Utensils, Flame, CupSoda, Dessert } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const CATEGORY_IMAGES = {
  'cat-1': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=75&auto=format&fit=crop',
  'cat-2': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=75&auto=format&fit=crop',
  'cat-3': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=75&auto=format&fit=crop',
  'cat-4': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=75&auto=format&fit=crop',
  'cat-5': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=75&auto=format&fit=crop',
};

export const DEFAULT_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75&auto=format&fit=crop';

export function getMenuImage(item) {
  if (item.image) return item.image;
  return CATEGORY_IMAGES[item.categoryId] || DEFAULT_IMG;
}

export const CATEGORY_ICONS = {
  'cat-1': Sparkles,
  'cat-2': Utensils,
  'cat-3': Flame,
  'cat-4': CupSoda,
  'cat-5': Dessert,
};

export function VegNonVegDot({ name }) {
  const isNonVeg = /chicken|mutton|fish|prawn|egg|meat|beef|kozhi|shawaya|alfaham/i.test(name);
  return (
    <span className={cn(
      'inline-flex w-4 h-4 items-center justify-center border-2 rounded bg-white shrink-0 shadow-sm',
      isNonVeg ? 'border-status-danger' : 'border-status-success'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isNonVeg ? 'bg-status-danger' : 'bg-status-success')} />
    </span>
  );
}

export function QuantityControl({ count, onIncrease, onDecrease }) {
  return (
    <div className="flex items-center gap-1.5 bg-canvas border border-border rounded-xl p-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onDecrease(); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface hover:text-text-main transition-colors active:scale-90"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="font-bold text-text-main text-center select-none w-6 text-sm">
        {count}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onIncrease(); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors active:scale-90"
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function FoodCard({ item, qty = 0, onAdd, onUpdateQty, disableAdd = false }) {
  const isBestseller = ['mi-1', 'mi-3', 'mi-4', 'mi-9'].includes(item.id);
  const isNew = ['mi-5', 'mi-11'].includes(item.id);

  return (
    <div
      className="menu-card flex flex-col group bg-surface cursor-pointer h-full"
      onClick={() => {
        if (disableAdd) return;
        if (qty === 0) onAdd(item);
        else onUpdateQty(item.id, 1);
      }}
    >
      {/* Image section */}
      <div className="relative h-28 sm:h-32 overflow-hidden bg-canvas shrink-0 rounded-t-2xl">
        <img
          src={getMenuImage(item)}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isBestseller && (
            <span className="bg-primary text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" /> Bestseller
            </span>
          )}
          {isNew && (
            <span className="bg-status-success text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Veg/Nonveg indicator */}
        <div className="absolute top-2 right-2 z-10">
          <VegNonVegDot name={item.name} />
        </div>

        {qty > 0 && !disableAdd && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-primary-sm animate-scale-in">
              {qty}
            </div>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5 rounded-b-2xl border-x border-b border-border bg-surface">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-main leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 h-8">
            {item.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-extrabold text-text-main text-base">₹{item.price}</span>
          {!disableAdd && (
            qty > 0 ? (
              <QuantityControl
                count={qty}
                onIncrease={() => onUpdateQty(item.id, 1)}
                onDecrease={() => onUpdateQty(item.id, -1)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl font-bold text-xs px-3 text-primary border-primary/20 hover:bg-primary hover:text-white"
                onClick={e => { e.stopPropagation(); onAdd(item); }}
              >
                + Add
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
