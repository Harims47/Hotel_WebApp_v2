import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export function WaiterMenu() {
  const menuCategories = useSelector(state => state.menu.categories);
  const menuItems = useSelector(state => state.menu.items);
  
  const activeCategories = useMemo(() => menuCategories.filter(c => !c.status || c.status === 'ACTIVE'), [menuCategories]);
  
  const [activeCategory, setActiveCategory] = useState(activeCategories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const isAvailable = item.isAvailable !== false && (!item.status || item.status === 'ACTIVE');
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (searchQuery.trim()) {
        return isAvailable && matchesSearch;
      }
      
      return isAvailable && item.categoryId === activeCategory;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Ensure active category is set
  React.useEffect(() => {
    if (!activeCategory && activeCategories.length > 0) {
      setActiveCategory(activeCategories[0].id);
    }
  }, [activeCategory, activeCategories]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Digital Menu</h1>
          <p className="text-sm text-text-muted mt-1">Browse all available items</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search menu items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex-1 flex bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          
          {/* Vertical Categories Sidebar */}
          {!searchQuery && (
            <div className="w-56 border-r border-border bg-gray-50/50 overflow-y-auto custom-scrollbar p-4 space-y-2">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 pl-2">Categories</h2>
              {activeCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                    activeCategory === cat.id 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "text-text-muted hover:bg-gray-100 hover:text-text-main"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start custom-scrollbar bg-white">
            {filteredMenuItems.map(item => (
              <div 
                key={item.id} 
                className="flex flex-col bg-white rounded-2xl border border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden" 
              >
                <div className="h-40 w-full overflow-hidden bg-gray-100 relative">
                  <img 
                    src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&auto=format&fit=crop`} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-text-main shadow-sm">
                    ₹{item.price}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredMenuItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted">
                No menu items found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
