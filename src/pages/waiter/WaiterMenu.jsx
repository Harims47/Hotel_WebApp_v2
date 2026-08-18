import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Search, Utensils, X, Star, Layers, Sparkles, Flame, LayoutGrid } from 'lucide-react';
import { FoodCard, CATEGORY_ICONS } from '../../components/waiter/WaiterUI';
import { cn } from '../../utils/cn';

export function WaiterMenu() {
  const menuCategories = useSelector(state => state.menu.categories);
  const menuItems = useSelector(state => state.menu.items);

  const activeCategories = useMemo(() => menuCategories.filter(c => !c.status || c.status === 'ACTIVE'), [menuCategories]);

  const [activeCategory, setActiveCategory] = useState(activeCategories[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const isAvailable = item.isAvailable !== false && (!item.status || item.status === 'ACTIVE');
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isBestseller = ['mi-1', 'mi-3', 'mi-4', 'mi-9'].includes(item.id);
      const isNonVeg = /chicken|mutton|fish|prawn|egg|meat|beef|kozhi|shawaya|alfaham/i.test(item.name);

      let matchesFilter = true;
      if (activeFilter === 'veg') matchesFilter = !isNonVeg;
      else if (activeFilter === 'nonveg') matchesFilter = isNonVeg;
      else if (activeFilter === 'bestseller' || activeFilter === 'popular') matchesFilter = isBestseller;

      if (searchQuery.trim()) return isAvailable && matchesSearch && matchesFilter;
      return isAvailable && item.categoryId === activeCategory && matchesFilter;
    });
  }, [menuItems, activeCategory, searchQuery, activeFilter]);

  return (
    <div className="flex flex-col h-full bg-canvas max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tight">Menu Catalog</h1>
            <p className="text-text-muted text-sm font-medium mt-1">Browse the full restaurant menu.</p>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint w-4 h-4" />
            <input
              type="text"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-border rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-10 font-semibold shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Category Rail */}
      {!searchQuery && (
        <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3 bg-canvas shrink-0">
          {activeCategories.map(cat => {
            const IconComponent = CATEGORY_ICONS[cat.id] || Utensils;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border whitespace-nowrap shadow-sm',
                  isActive
                    ? 'bg-primary text-white border-primary shadow-primary-sm'
                    : 'bg-surface text-text-sub border-border hover:border-border-strong hover:bg-white'
                )}
              >
                <IconComponent className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-muted')} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden mt-1">
        
        {/* Vertical Filter Rail (Left) */}
        {!searchQuery && (
          <div className="hidden md:flex w-[110px] flex-col overflow-y-auto custom-scrollbar shrink-0 py-2 px-4 gap-2">
            {[
              { id: 'all', label: 'All', icon: LayoutGrid },
              { id: 'popular', label: 'Popular', icon: Star },
              { id: 'veg', label: 'Veg', icon: Sparkles },
              { id: 'nonveg', label: 'Non-Veg', icon: Layers },
              { id: 'bestseller', label: 'Bestseller', icon: Flame },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id === 'all' ? null : filter.id)}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl text-[11px] font-bold transition-all gap-1.5 shadow-sm border',
                  (activeFilter === filter.id || (filter.id === 'all' && !activeFilter))
                    ? 'bg-primary text-white border-primary shadow-primary-sm' 
                    : 'bg-surface text-text-muted border-transparent hover:text-text-main hover:border-border'
                )}
              >
                <filter.icon className="w-5 h-5" />
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-2 pb-8">
          {filteredMenuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-12 h-12 text-text-faint mb-4" />
              <p className="font-bold text-lg text-text-main">No items found</p>
              <p className="text-sm text-text-muted mt-1">Try another category or filter</p>
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              {filteredMenuItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                  qty={0}
                  disableAdd={true}
                  onAdd={() => {}}
                  onUpdateQty={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
