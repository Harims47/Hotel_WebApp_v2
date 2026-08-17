import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ArrowLeft, Plus, Minus, Send, CheckCircle, Receipt,
  ShoppingBag, Search, X, ChevronUp, Clock, Sparkles,
  Utensils, Flame, CupSoda, Dessert, Cookie, Layers, Star, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { BottomSheet } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { CATEGORY_ICONS, FoodCard, VegNonVegDot, getMenuImage, QuantityControl } from '../../components/waiter/WaiterUI';
import { sendOrderToKOT, pickupItem, serveItem, cancelItem, cancelOrder } from '../../features/workflows/waiterWorkflow';
import { completeOrder } from '../../features/workflows/cashierWorkflow';



export function WaiterOrderScreen() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const table = useSelector(state => state.tables.data.find(t => t.id === tableId));
  const menuCategories = useSelector(state => state.menu.categories);
  const menuItems = useSelector(state => state.menu.items);
  const activeOrder = useSelector(state =>
    state.orders.data.find(o => o.tableId === tableId && o.status !== 'CLOSED')
  );

  const activeCategories = useMemo(() => menuCategories.filter(c => !c.status || c.status === 'ACTIVE'), [menuCategories]);

  const [activeCategory, setActiveCategory] = useState(activeCategories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCartSheet, setShowCartSheet] = useState(false);

  // Cancel/pickup state
  const [pickupCode, setPickupCode] = useState('');
  const [activePickupItemId, setActivePickupItemId] = useState(null);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const isAvailable = item.isAvailable !== false && (!item.status || item.status === 'ACTIVE');
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isBestseller = ['mi-1', 'mi-3', 'mi-4', 'mi-9'].includes(item.id);
      const isNonVeg = /chicken|mutton|fish|prawn|egg|meat/i.test(item.name);

      let matchesFilter = true;
      if (activeFilter === 'veg') matchesFilter = !isNonVeg;
      else if (activeFilter === 'nonveg') matchesFilter = isNonVeg;
      else if (activeFilter === 'bestseller' || activeFilter === 'popular') matchesFilter = isBestseller;

      if (searchQuery.trim()) return isAvailable && matchesSearch && matchesFilter;
      return isAvailable && item.categoryId === activeCategory && matchesFilter;
    });
  }, [menuItems, activeCategory, searchQuery, activeFilter]);

  const handleAddToCart = useCallback((menuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === menuItem.id);
      if (existing) return prev.map(i => i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
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
    dispatch(sendOrderToKOT(table.id, currentUser.id, cart));
    setCart([]);
    setShowCartSheet(false);
  };

  const handlePickupClick = (orderItemId) => { setActivePickupItemId(orderItemId); setPickupCode(''); };
  const confirmPickup = (orderItemId) => {
    if (pickupCode === table.tableNumber) {
      dispatch(pickupItem(activeOrder.id, orderItemId, currentUser.id));
      setActivePickupItemId(null); setPickupCode('');
    } else {
      alert(`Invalid table code. Enter the exact table number (e.g. ${table.tableNumber})`);
    }
  };
  const handleServe = (orderItemId) => dispatch(serveItem(activeOrder.id, orderItemId, currentUser.id));
  const handleCompleteOrder = () => {
    const hasActiveItems = activeOrder.items.some(i => i.status !== 'SERVED' && i.status !== 'CANCELLED');
    if (hasActiveItems) { alert('All items must be served or cancelled before completing the order.'); return; }
    dispatch(completeOrder(activeOrder.id, currentUser.id));
  };
  const confirmCancelItem = () => {
    if (!cancelReason.trim()) { alert('Please provide a cancellation reason.'); return; }
    dispatch(cancelItem(activeOrder.id, itemToCancel.id, currentUser.id, cancelReason));
    setItemToCancel(null); setCancelReason('');
  };
  const confirmCancelOrder = () => {
    if (!cancelReason.trim()) { alert('Please provide a cancellation reason.'); return; }
    dispatch(cancelOrder(activeOrder.id, currentUser.id, cancelReason));
    setShowCancelOrderModal(false); setCancelReason('');
    navigate('/waiter/tables');
  };
  const handleCancelOrderClick = () => {
    const hasServedItems = activeOrder.items.some(i => ['SERVED', 'PICKED_UP'].includes(i.status));
    if (hasServedItems) { alert('Cannot cancel — order has served or picked up items. Cancel remaining items individually.'); return; }
    setCancelReason(''); setShowCancelOrderModal(true);
  };

  if (!table) return <div className="p-8 text-text-muted">Table not found</div>;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isOrderInProgress = !activeOrder || activeOrder.status === 'IN_PROGRESS';

  // Subtotal including kitchen items
  const activeOrderSubtotal = activeOrder
    ? activeOrder.items.reduce((sum, item) => item.status !== 'CANCELLED' ? sum + (item.unitPrice * item.quantity) : sum, 0)
    : 0;
  
  const subtotal = cartTotal + activeOrderSubtotal;
  const cgst = parseFloat((subtotal * 0.025).toFixed(2));
  const sgst = parseFloat((subtotal * 0.025).toFixed(2));
  const grandTotal = subtotal + cgst + sgst;

  const allItemsFinished = activeOrder && activeOrder.items.length > 0 &&
    activeOrder.items.every(i => i.status === 'SERVED' || i.status === 'CANCELLED');

  const getCartQty = (itemId) => cart.find(i => i.id === itemId)?.quantity || 0;

  // Compact item card for the kitchen status section
  const KitchenItemCard = ({ oi }) => {
    const menuItem = menuItems.find(m => m.id === oi.menuItemId);
    return (
      <div className={cn(
        'p-2.5 rounded-xl border transition-colors',
        oi.status === 'READY' ? 'bg-status-success-bg border-status-success/30 animate-pulse' :
        oi.status === 'PREPARING' ? 'bg-status-preparing-bg border-purple-200' :
        oi.status === 'SERVED' ? 'bg-canvas border-border opacity-70' :
        oi.status === 'CANCELLED' ? 'bg-status-danger-bg border-status-danger/20 opacity-50' :
        'bg-surface border-border'
      )}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5"><VegNonVegDot name={menuItem?.name || ''} /></div>
            <div>
              <p className="font-bold text-text-main text-xs leading-tight line-clamp-1">{menuItem?.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Qty: {oi.quantity} • ₹{oi.unitPrice * oi.quantity}</p>
            </div>
          </div>
          <StatusPill status={oi.status} size="xs" />
        </div>

        {/* Actions */}
        {isOrderInProgress && oi.status === 'READY' && (
          activePickupItemId !== oi.id ? (
            <Button size="sm" className="w-full mt-2 h-7 text-[10px] font-bold" onClick={() => handlePickupClick(oi.id)}>Pickup</Button>
          ) : (
            <div className="mt-2 flex gap-1.5">
              <input type="text" placeholder="Code" className="w-16 h-7 rounded border border-border px-1 text-[10px] outline-none" value={pickupCode} onChange={e => setPickupCode(e.target.value)} />
              <Button size="sm" className="h-7 px-2 text-[10px]" variant="success" onClick={() => confirmPickup(oi.id)}>Go</Button>
              <button className="w-7 h-7 flex items-center justify-center text-text-muted border border-border rounded bg-surface shrink-0" onClick={() => setActivePickupItemId(null)}><X className="w-3 h-3" /></button>
            </div>
          )
        )}
        {isOrderInProgress && oi.status === 'PICKED_UP' && (
          <Button size="sm" variant="secondary" className="w-full mt-2 h-7 text-[10px] font-bold" onClick={() => handleServe(oi.id)}>Serve</Button>
        )}
        {isOrderInProgress && ['ORDERED', 'PREPARING'].includes(oi.status) && (
          <Button variant="danger-outline" size="sm" className="w-full mt-1.5 h-7 text-[10px] font-bold" onClick={() => { setItemToCancel({ id: oi.id, name: menuItem?.name || 'Item' }); setCancelReason(''); }}>
            Cancel Item
          </Button>
        )}
      </div>
    );
  };

  // ─── CART PANEL ───
  const CartContent = () => (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/60">
        
        {/* Section: Kitchen items */}
        {activeOrder && activeOrder.items.length > 0 && (
          <div className="p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center justify-between">
              <span>Active Kitchen Order</span>
              <span className="text-text-main font-semibold">#{activeOrder.orderNumber}</span>
            </h3>
            <div className="space-y-2">
              {activeOrder.items.map(oi => <KitchenItemCard key={oi.id} oi={oi} />)}
            </div>
          </div>
        )}

        {/* Section: New Cart Items */}
        {isOrderInProgress && (
          <div className="p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted">
                <ShoppingBag className="w-5 h-5 text-text-faint mb-2" />
                <p className="text-xs">No unsent items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5"><VegNonVegDot name={item.name} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-text-main leading-tight line-clamp-2">{item.name}</p>
                      </div>
                      <span className="font-extrabold text-sm text-text-main shrink-0">₹{item.price * item.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between pl-6">
                      <QuantityControl count={item.quantity} onDecrease={() => handleUpdateQuantity(item.id, -1)} onIncrease={() => handleAddToCart(item)} />
                      <button onClick={() => handleUpdateQuantity(item.id, -item.quantity)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-canvas hover:text-status-danger transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Totals & Actions Footer */}
      <div className="border-t border-border bg-surface p-4 shrink-0 space-y-3 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] relative z-10">
        <div className="space-y-2 text-xs font-semibold text-text-sub">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-text-main">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST (2.5%)</span>
            <span className="text-text-main">₹{sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>CGST (2.5%)</span>
            <span className="text-text-main">₹{cgst.toFixed(2)}</span>
          </div>
          <div className="border-t border-border/60 mt-2 pt-3 flex justify-between items-center text-sm font-bold text-text-main">
            <span className="uppercase tracking-wider">Total</span>
            <span className="text-xl font-black text-primary">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {isOrderInProgress && cart.length > 0 && (
          <Button
            variant="success"
            className="w-full h-12 text-[15px] font-black rounded-xl"
            onClick={handleSendToKOT}
          >
            SEND TO KITCHEN
          </Button>
        )}

        {isOrderInProgress && cart.length === 0 && allItemsFinished && (
          <Button
            className="w-full h-12 text-[15px] font-black rounded-xl"
            variant="success"
            onClick={handleCompleteOrder}
          >
            COMPLETE ORDER
          </Button>
        )}

        {isOrderInProgress && activeOrder && activeOrder.items.length > 0 && (
          <div className="mt-2">
            <Button
              variant="danger"
              className="w-full h-10 text-xs font-bold rounded-xl"
              onClick={handleCancelOrderClick}
            >
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      {/* ─── Top Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/waiter/tables')}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-canvas transition-colors shrink-0"
            aria-label="Back to tables"
          >
            <ArrowLeft className="w-5 h-5 text-text-main" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-text-main">Table {table.tableNumber}</h1>
              {activeOrder && (
                <StatusPill status={activeOrder.status} size="xs" />
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {table.capacity} Seats · {table.section}
              {activeOrder && ` · ${activeOrder.orderNumber}`}
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {isOrderInProgress && (
            <div className="relative w-48 md:w-64 shrink-0 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint w-4 h-4" />
              <input
                type="text"
                placeholder="Search dishes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-border rounded-xl text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-surface h-10 font-semibold"
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
          )}
          
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-text-main leading-tight">{currentUser?.name}</span>
              <span className="text-[10px] text-text-muted font-bold uppercase">Waiter</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {currentUser?.name?.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bill Requested State ─── */}
      {!isOrderInProgress ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-canvas/10">
          <div className="w-20 h-20 bg-status-success-bg rounded-full flex items-center justify-center mb-5">
            <Receipt className="w-10 h-10 text-status-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Bill Requested</h2>
          <p className="text-text-muted text-sm max-w-xs leading-relaxed mb-6">
            This order has been sent to the Cashier. No further items can be added to this table.
          </p>
          <StatusPill status={activeOrder.status} />
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Horizontal Category Rail (Top) */}
          {!searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto category-scroll px-4 py-3 bg-surface border-b border-border shrink-0">
            {activeCategories.map(cat => {
              const IconComponent = CATEGORY_ICONS[cat.id] || Utensils;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-white border-primary shadow-primary-sm'
                      : 'bg-surface text-text-sub border-border hover:border-border-strong hover:bg-canvas'
                  )}
                >
                  <IconComponent className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-muted')} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Order Entry Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Vertical Filter Rail (Left) */}
          {!searchQuery && (
            <div className="hidden md:flex w-[110px] flex-col border-r border-border bg-canvas/30 overflow-y-auto custom-scrollbar shrink-0 py-3 px-2 gap-1">
              {[
                { id: 'popular', label: 'Popular', icon: Star },
                { id: 'veg', label: 'Veg', icon: Sparkles },
                { id: 'nonveg', label: 'Non-Veg', icon: Layers },
                { id: 'bestseller', label: 'Bestseller', icon: Flame },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(prev => prev === filter.id ? null : filter.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-xl text-[11px] font-bold transition-colors gap-1.5',
                    activeFilter === filter.id 
                      ? 'bg-primary text-white shadow-primary-sm' 
                      : 'text-text-muted hover:text-text-main hover:bg-surface'
                  )}
                >
                  <filter.icon className="w-5 h-5" />
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Center Content: Menu grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-canvas/20">
            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-5">
              {filteredMenuItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-text-faint mb-3" />
                  <p className="font-semibold text-text-sub">No items found</p>
                  <p className="text-sm text-text-muted mt-1">Try another category or query</p>
                </div>
              ) : (
                <div
                  className="grid gap-3 lg:gap-4 pb-6"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
                >
                  {filteredMenuItems.map(item => {
                    const qty = getCartQty(item.id);
                    const isBestseller = ['mi-1', 'mi-3', 'mi-4', 'mi-9'].includes(item.id);
                    const isNew = ['mi-5', 'mi-11'].includes(item.id);

                    return (
                      <FoodCard
                        key={item.id}
                        item={item}
                        qty={qty}
                        onAdd={handleAddToCart}
                        onUpdateQty={handleUpdateQuantity}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Cart Panel (Only on desktop/landscape layout) */}
          <div className="hidden lg:flex lg:w-[320px] xl:w-[350px] shrink-0 flex-col border-l border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-canvas/30 shrink-0 flex justify-between items-center">
              <h2 className="font-black text-sm uppercase tracking-wider text-text-main">Current Order</h2>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-status-danger-text hover:text-status-danger transition-colors p-1" aria-label="Clear cart">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <Badge variant="primary" className="text-[10px] font-bold py-0.5 px-2">
                  {(activeOrder?.items?.length || 0) + cartItemCount} Items
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <CartContent />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Sticky Bottom Cart Strip for Portrait Tablet / Mobile */}
      {isOrderInProgress && (cartItemCount > 0 || (activeOrder && activeOrder.items.length > 0)) && (
        <div className="lg:hidden border-t border-border bg-surface shrink-0 px-4 py-3 shadow-bottom-sheet">
          <button
            onClick={() => setShowCartSheet(true)}
            className="w-full flex items-center justify-between bg-primary text-white px-5 py-3.5 rounded-2xl shadow-primary-md active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm">
                {cartItemCount > 0 ? `${cartItemCount} item${cartItemCount > 1 ? 's' : ''} added` : 'View order'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cartItemCount > 0 && (
                <span className="font-black text-base">₹{cartTotal}</span>
              )}
              <ChevronUp className="w-4 h-4 animate-bounce" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet (for portrait viewports) */}
      <BottomSheet
        isOpen={showCartSheet}
        onClose={() => setShowCartSheet(false)}
        title="Current Order"
      >
        <div className="max-h-[70vh]">
          <CartContent />
        </div>
      </BottomSheet>

      {/* Cancel Item Modal */}
      {itemToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-sm animate-scale-in overflow-hidden border border-border">
            <div className="px-5 py-4 border-b border-border bg-canvas flex justify-between items-center">
              <h3 className="font-bold text-text-main">Cancel Item</h3>
              <button onClick={() => setItemToCancel(null)} className="p-1.5 text-text-muted hover:text-text-main rounded-xl hover:bg-border"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-main">Cancel <strong>{itemToCancel.name}</strong>?</p>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Reason <span className="text-status-danger">*</span></label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer changed order"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setItemToCancel(null)}>Keep</Button>
                <Button variant="danger" className="flex-1" onClick={confirmCancelItem}>Cancel Item</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-sm animate-scale-in overflow-hidden border border-border">
            <div className="px-5 py-4 border-b border-border bg-canvas flex justify-between items-center">
              <h3 className="font-bold text-text-main">Cancel Entire Order</h3>
              <button onClick={() => setShowCancelOrderModal(false)} className="p-1.5 text-text-muted hover:text-text-main rounded-xl hover:bg-border"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-muted">This will cancel all pending items in this order. This action cannot be undone.</p>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Reason <span className="text-status-danger">*</span></label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer left"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowCancelOrderModal(false)}>Keep Order</Button>
                <Button variant="danger" className="flex-1" onClick={confirmCancelOrder}>Cancel Order</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
