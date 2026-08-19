import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Sparkles, Utensils, Flame, CupSoda, Dessert, Trash2, ShoppingBasket, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { createTakeawayOrder } from '../../features/workflows/cashierWorkflow';
import { FoodCard, QuantityControl } from '../../components/waiter/WaiterUI';
import { cn } from '../../utils/cn';

const CATEGORY_ICONS = {
  'cat-1': Sparkles,
  'cat-2': Utensils,
  'cat-3': Flame,
  'cat-4': CupSoda,
  'cat-5': Dessert,
};

export function NewTakeawayOrder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const menuCategories = useSelector(state => state.menu.categories);
  const menuItems = useSelector(state => state.menu.items);
  
  const activeCategories = useMemo(() => menuCategories.filter(c => !c.status || c.status === 'ACTIVE'), [menuCategories]);
  const [activeCategory, setActiveCategory] = useState(activeCategories[0]?.id);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [source, setSource] = useState('OFFLINE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('CUSTOMER_PICKUP');
  
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => item.categoryId === activeCategory && item.isAvailable !== false && (!item.status || item.status === 'ACTIVE'));
  }, [menuItems, activeCategory]);

  const handleAddToCart = useCallback((menuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === menuItem.id);
      if (existing) {
        return prev.map(i => i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  }, []);

  const handleUpdateQuantity = useCallback((itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : null;
      }
      return i;
    }).filter(Boolean));
  }, []);

  const handleSendToKOT = () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      alert("Customer Name and Phone are required for takeaway orders.");
      return;
    }

    dispatch(createTakeawayOrder(
      source,
      customerName,
      customerPhone,
      '', // notes
      cart,
      currentUser.id,
      fulfillmentType,
      null // address
    ));
    
    navigate('/cashier/takeaway');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col h-full bg-canvas max-w-[1600px] mx-auto w-full">
      {/* Top Header */}
      <div className="px-4 md:px-6 py-4 flex items-center justify-between border-b border-border bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/cashier/takeaway')} className="p-2 -ml-2 text-text-muted hover:text-text-main">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">New Takeaway Order</h1>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Pane: Menu */}
        <div className="w-full lg:w-[65%] flex flex-col bg-canvas border-r border-border overflow-hidden">
          {/* Category Tabs */}
          <div className="px-4 pt-4 pb-2 shrink-0 bg-white border-b border-border shadow-sm z-10">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 snap-x">
              {activeCategories.map(cat => {
                const isSelected = activeCategory === cat.id;
                const Icon = CATEGORY_ICONS[cat.id] || Utensils;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 snap-start",
                      isSelected 
                        ? "bg-primary text-white shadow-md shadow-primary/30" 
                        : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text-main border border-border"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-text-muted")} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 min-h-0">
            {filteredMenuItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <p>No items available in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20">
                {filteredMenuItems.map(item => {
                  const cartItem = cart.find(c => c.id === item.id);
                  return (
                    <FoodCard
                      key={item.id}
                      item={item}
                      qty={cartItem?.quantity || 0}
                      onAdd={handleAddToCart}
                      onUpdateQty={handleUpdateQuantity}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isCartOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsCartOpen(false)}
          />
        )}

        {/* Right Pane: Order Details & Cart */}
        <div className={cn(
          "flex flex-col bg-white shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-300 z-50",
          "fixed lg:static inset-y-0 right-0 w-[85%] sm:w-[400px] lg:w-[35%] lg:flex",
          isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          
          <div className="p-3 md:p-4 border-b border-border bg-surface/30 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[11px] font-black text-text-muted uppercase tracking-widest">Customer Details</h2>
              <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-1.5 text-text-muted hover:text-text-main rounded-md bg-white border border-border shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <button 
                  onClick={() => setSource('OFFLINE')}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border", source === 'OFFLINE' ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-white text-text-muted border-border hover:bg-surface-hover")}
                >
                  Walk-in
                </button>
                <button 
                  onClick={() => setSource('PHONE')}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border", source === 'PHONE' ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-white text-text-muted border-border hover:bg-surface-hover")}
                >
                  Phone
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Name</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Phone</label>
                  <input 
                    type="tel" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Fulfillment</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFulfillmentType('CUSTOMER_PICKUP')}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border", fulfillmentType === 'CUSTOMER_PICKUP' ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-white text-text-muted border-border hover:bg-surface-hover")}
                  >
                    Customer Pickup
                  </button>
                  <button 
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border", fulfillmentType === 'DELIVERY' ? "bg-primary/10 text-primary border-primary/30 shadow-sm" : "bg-white text-text-muted border-border hover:bg-surface-hover")}
                  >
                    Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 md:p-4 border-b border-border bg-white shrink-0">
            <h2 className="text-[11px] font-black text-text-muted uppercase tracking-widest flex justify-between items-center">
              <span>Current Order</span>
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cart.length} ITEMS</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-3 min-h-0 bg-surface/20">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60 min-h-[200px]">
                <ShoppingBasket className="w-12 h-12 mb-3 stroke-[1.5]" />
                <p className="font-bold text-sm text-text-main">No items added yet</p>
                <p className="text-xs mt-1">Select dishes from the menu</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex flex-col gap-3 p-3.5 bg-white border border-border rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-text-main text-[13px] leading-tight">{item.name}</h4>
                      <p className="text-[11px] font-medium text-text-muted mt-0.5">Regular</p>
                    </div>
                    <span className="font-black text-text-main text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-3">
                      <QuantityControl 
                        count={item.quantity} 
                        onIncrease={() => handleUpdateQuantity(item.id, 1)} 
                        onDecrease={() => handleUpdateQuantity(item.id, -1)} 
                      />
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, -item.quantity)}
                        className="p-1.5 text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-30 shrink-0">
            <div className="space-y-1.5 mb-4 px-1">
              <div className="flex justify-between text-[13px] font-semibold text-text-sub">
                <span>Subtotal</span>
                <span className="text-text-main font-bold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-semibold text-text-sub">
                <span>Taxes (5%)</span>
                <span className="text-text-main font-bold">₹{(cartTotal * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[16px] font-black text-primary pt-3 mt-1.5 border-t border-border">
                <span>Grand Total</span>
                <span>₹{(cartTotal * 1.05).toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full min-h-[48px] text-[15px] font-black uppercase tracking-wider shadow-xl shadow-primary/30 rounded-xl"
              disabled={cart.length === 0}
              onClick={handleSendToKOT}
            >
              Place Order & Send to Kitchen
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile View Cart Button */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-30">
        <Button 
          className="w-full min-h-[56px] text-[15px] font-black uppercase tracking-wider shadow-xl shadow-primary/30 rounded-xl flex justify-between items-center px-6"
          onClick={() => setIsCartOpen(true)}
        >
          <div className="flex items-center gap-2">
            <ShoppingBasket className="w-5 h-5" />
            <span>{cart.length} Items</span>
          </div>
          <span>View Cart • ₹{cartTotal.toFixed(2)}</span>
        </Button>
      </div>
    </div>
  );
}
