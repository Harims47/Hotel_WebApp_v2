import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Sparkles, Utensils, Flame, CupSoda, Dessert } from 'lucide-react';
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

      <div className="flex flex-1 overflow-hidden">
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
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

        {/* Right Pane: Order Details & Cart */}
        <div className="hidden lg:flex flex-col w-[35%] bg-white shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20 overflow-y-auto">
          
          <div className="p-5 border-b border-border bg-surface/50">
            <h2 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4">Customer Details</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setSource('OFFLINE')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all border", source === 'OFFLINE' ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-text-muted border-border")}
                >
                  Walk-in
                </button>
                <button 
                  onClick={() => setSource('PHONE')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all border", source === 'PHONE' ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-text-muted border-border")}
                >
                  Phone
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Name</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Phone</label>
                  <input 
                    type="tel" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Fulfillment</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFulfillmentType('CUSTOMER_PICKUP')}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all border", fulfillmentType === 'CUSTOMER_PICKUP' ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-text-muted border-border")}
                  >
                    Customer Pickup
                  </button>
                  <button 
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all border", fulfillmentType === 'DELIVERY' ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-text-muted border-border")}
                  >
                    Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-border bg-surface/50">
            <h2 className="text-sm font-bold text-text-main uppercase tracking-wider mb-4 flex justify-between">
              <span>Current Order</span>
              <span className="text-primary">{cart.length} Items</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center text-text-muted py-10">
                <p>Cart is empty</p>
                <p className="text-xs mt-1">Add items from the menu</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-white border border-border rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-text-main text-sm">{item.name}</span>
                    <span className="font-bold text-text-main text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-sub font-semibold">₹{item.price.toFixed(2)} / each</span>
                    <QuantityControl 
                      count={item.quantity} 
                      onIncrease={() => handleUpdateQuantity(item.id, 1)} 
                      onDecrease={() => handleUpdateQuantity(item.id, -1)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-white border-t border-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-30">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm font-semibold text-text-sub">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-text-sub">
                <span>Taxes (5%)</span>
                <span>₹{(cartTotal * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-primary pt-2 border-t border-dashed border-border">
                <span>Grand Total</span>
                <span>₹{(cartTotal * 1.05).toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-12 text-base font-bold shadow-xl shadow-primary/30"
              disabled={cart.length === 0}
              onClick={handleSendToKOT}
            >
              Place Order & Send to Kitchen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
