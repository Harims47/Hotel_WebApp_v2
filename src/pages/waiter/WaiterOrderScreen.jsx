import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ArrowLeft, Plus, Minus, Send, CheckCircle, Receipt,
  ShoppingBag, Search, X, ChevronUp, Clock, Sparkles,
  Utensils, Flame, CupSoda, Dessert, Cookie, Layers, Star
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusPill } from '../../components/ui/Badge';
import { BottomSheet } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { sendOrderToKOT, pickupItem, serveItem, cancelItem, cancelOrder } from '../../features/workflows/waiterWorkflow';
import { completeOrder } from '../../features/workflows/cashierWorkflow';

const CATEGORY_IMAGES = {
  'cat-1': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=75&auto=format&fit=crop',
  'cat-2': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=75&auto=format&fit=crop',
  'cat-3': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=75&auto=format&fit=crop',
  'cat-4': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=75&auto=format&fit=crop',
  'cat-5': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=75&auto=format&fit=crop',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75&auto=format&fit=crop';
function getMenuImage(item) {
  if (item.image) return item.image;
  return CATEGORY_IMAGES[item.categoryId] || DEFAULT_IMG;
}

const CATEGORY_ICONS = {
  'cat-1': Sparkles,
  'cat-2': Utensils,
  'cat-3': Flame,
  'cat-4': CupSoda,
  'cat-5': Dessert,
};

function VegNonVegDot({ name }) {
  const isNonVeg = /chicken|mutton|fish|prawn|egg|meat/i.test(name);
  return (
    <span className={cn(
      'inline-flex w-4 h-4 items-center justify-center border-2 rounded bg-white shrink-0 shadow-sm',
      isNonVeg ? 'border-status-danger' : 'border-status-success'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isNonVeg ? 'bg-status-danger' : 'bg-status-success')} />
    </span>
  );
}

function QuantityControl({ count, onIncrease, onDecrease }) {
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
      if (searchQuery.trim()) return isAvailable && matchesSearch;
      return isAvailable && item.categoryId === activeCategory;
    });
  }, [menuItems, activeCategory, searchQuery]);

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
        'p-3 rounded-xl border transition-colors',
        oi.status === 'READY' ? 'bg-status-success-bg border-status-success/30 animate-pulse' :
        oi.status === 'PREPARING' ? 'bg-status-preparing-bg border-purple-200' :
        oi.status === 'SERVED' ? 'bg-canvas border-border opacity-70' :
        oi.status === 'CANCELLED' ? 'bg-status-danger-bg border-status-danger/20 opacity-50' :
        'bg-surface border-border'
      )}>
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <VegNonVegDot name={menuItem?.name || ''} />
            <p className="font-bold text-text-main text-xs leading-tight truncate">{menuItem?.name}</p>
          </div>
          <StatusPill status={oi.status} size="xs" />
        </div>
        <div className="flex justify-between items-center text-xs text-text-muted pl-6">
          <span>Qty: {oi.quantity}</span>
          <span className="font-semibold text-text-main">₹{oi.unitPrice * oi.quantity}</span>
        </div>

        {/* Actions */}
        {isOrderInProgress && oi.status === 'READY' && (
          activePickupItemId !== oi.id ? (
            <Button
              size="sm"
              className="w-full mt-2.5 h-8 text-xs font-bold"
              onClick={() => handlePickupClick(oi.id)}
            >
              Pickup Item
            </Button>
          ) : (
            <div className="mt-2.5 flex gap-1.5">
              <input
                type="text"
                placeholder={`Table code (${table.tableNumber})`}
                className="flex-1 h-8 rounded-lg border border-border px-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                value={pickupCode}
                onChange={e => setPickupCode(e.target.value)}
              />
              <Button size="sm" className="h-8 px-3 text-xs" variant="success" onClick={() => confirmPickup(oi.id)}>Go</Button>
              <button
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-main border border-border rounded-lg bg-surface shrink-0"
                onClick={() => setActivePickupItemId(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        )}
        {isOrderInProgress && oi.status === 'PICKED_UP' && (
          <Button size="sm" variant="secondary" className="w-full mt-2.5 h-8 text-xs font-bold" onClick={() => handleServe(oi.id)}>
            Serve to Customer
          </Button>
        )}
        {isOrderInProgress && ['ORDERED', 'PREPARING'].includes(oi.status) && (
          <button
            className="w-full mt-2 text-[10px] font-bold text-status-danger-text hover:underline py-1 text-center"
            onClick={() => { setItemToCancel({ id: oi.id, name: menuItem?.name || 'Item' }); setCancelReason(''); }}
          >
            Cancel Item
          </button>
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
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
              New Items to Send
            </h3>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted">
                <ShoppingBag className="w-5 h-5 text-text-faint mb-2" />
                <p className="text-xs">No unsent items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-canvas/30 rounded-xl border border-border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-text-main leading-tight truncate">{item.name}</p>
                      <p className="text-xs font-bold text-primary mt-1">₹{item.price * item.quantity}</p>
                    </div>
                    <QuantityControl
                      count={item.quantity}
                      onDecrease={() => handleUpdateQuantity(item.id, -1)}
                      onIncrease={() => handleAddToCart(item)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Totals & Actions Footer */}
      <div className="border-t border-border bg-canvas/40 p-4 shrink-0 space-y-3">
        <div className="space-y-1.5 text-xs text-text-muted">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-text-main">₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>CGST (2.5%)</span>
            <span className="font-semibold text-text-main">₹{cgst}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST (2.5%)</span>
            <span className="font-semibold text-text-main">₹{sgst}</span>
          </div>
          <div className="border-t border-border/60 my-2 pt-2 flex justify-between text-sm font-bold text-text-main">
            <span>Grand Total</span>
            <span className="text-base font-extrabold text-primary">₹{grandTotal}</span>
          </div>
        </div>

        {isOrderInProgress && cart.length > 0 && (
          <Button
            className="w-full h-11 text-sm font-bold"
            onClick={handleSendToKOT}
            leftIcon={Send}
          >
            SEND TO KITCHEN
          </Button>
        )}
        
        {isOrderInProgress && cart.length === 0 && allItemsFinished && (
          <Button
            className="w-full h-11 text-sm font-bold"
            variant="success"
            onClick={handleCompleteOrder}
            leftIcon={CheckCircle}
          >
            COMPLETE ORDER
          </Button>
        )}

        {isOrderInProgress && activeOrder && activeOrder.items.length > 0 && (
          <Button
            variant="danger-outline"
            className="w-full h-9 text-xs font-bold"
            onClick={handleCancelOrderClick}
          >
            Cancel Entire Order
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden -m-4 md:-m-6">
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

        {/* Search */}
        {isOrderInProgress && (
          <div className="relative w-48 md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint w-4 h-4" />
            <input
              type="text"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-border rounded-xl text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all focus:bg-surface h-10"
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
        // ─── Order Entry Layout ───
        <div className="flex flex-1 overflow-hidden">
          
          {/* Categories Sidebar (Tablet Landscape + Desktop) */}
          {!searchQuery && (
            <div className="hidden md:flex md:w-[130px] lg:w-[140px] flex-col border-r border-border bg-canvas/40 overflow-y-auto custom-scrollbar shrink-0 py-4 px-2.5 gap-1.5">
              {activeCategories.map(cat => {
                const IconComponent = CATEGORY_ICONS[cat.id] || Utensils;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'w-full flex flex-col items-center justify-center text-center p-3 rounded-2xl text-xs font-bold transition-all gap-1.5',
                      activeCategory === cat.id
                        ? 'bg-primary text-white shadow-primary-sm'
                        : 'bg-surface text-text-muted border border-border hover:border-primary/20 hover:text-text-main'
                    )}
                  >
                    <IconComponent className="w-5 h-5 shrink-0" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Center Content: Menu grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-canvas/10">
            {/* Mobile/Portrait Category scrolling list */}
            {!searchQuery && (
              <div className="md:hidden category-scroll px-4 pt-3 pb-2 shrink-0 gap-2">
                {activeCategories.map(cat => {
                  const IconComponent = CATEGORY_ICONS[cat.id] || Utensils;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
                        activeCategory === cat.id
                          ? 'bg-primary text-white border-primary shadow-primary-sm'
                          : 'bg-surface text-text-muted border-border'
                      )}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {filteredMenuItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-text-faint mb-3" />
                  <p className="font-semibold text-text-sub">No items found</p>
                  <p className="text-sm text-text-muted mt-1">Try another category or query</p>
                </div>
              ) : (
                <div
                  className="grid gap-4 pb-6"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}
                >
                  {filteredMenuItems.map(item => {
                    const qty = getCartQty(item.id);
                    const isBestseller = ['mi-1', 'mi-3', 'mi-4', 'mi-9'].includes(item.id);
                    const isNew = ['mi-5', 'mi-11'].includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className="menu-card flex flex-col group bg-surface"
                        onClick={() => handleAddToCart(item)}
                      >
                        {/* Image section */}
                        <div className="relative h-28 sm:h-32 overflow-hidden bg-canvas shrink-0">
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

                          {qty > 0 && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-primary-sm animate-scale-in">
                                {qty}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-text-main leading-tight group-hover:text-primary transition-colors line-clamp-1">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 h-8">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-text-main text-base">₹{item.price}</span>
                            {qty > 0 ? (
                              <QuantityControl
                                count={qty}
                                onIncrease={() => handleAddToCart(item)}
                                onDecrease={() => handleUpdateQuantity(item.id, -1)}
                              />
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl font-bold text-xs px-3 text-primary border-primary/20 hover:bg-primary hover:text-white"
                                onClick={e => { e.stopPropagation(); handleAddToCart(item); }}
                              >
                                + Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
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
              <Badge variant="primary" className="text-[10px] font-bold py-0.5 px-2">
                {(activeOrder?.items?.length || 0) + cartItemCount} Items
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <CartContent />
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
