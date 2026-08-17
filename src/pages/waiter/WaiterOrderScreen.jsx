import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Plus, Minus, Send, CheckCircle, Receipt, ShoppingBag, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { sendOrderToKOT, pickupItem, serveItem, cancelItem, cancelOrder } from '../../features/workflows/waiterWorkflow';
import { completeOrder } from '../../features/workflows/cashierWorkflow';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

export function WaiterOrderScreen() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const table = useSelector(state => state.tables.data.find(t => t.id === tableId));
  const menuCategories = useSelector(state => state.menu.categories);
  const menuItems = useSelector(state => state.menu.items);
  
  // Find active order for this table (anything not CLOSED)
  const activeOrder = useSelector(state => state.orders.data.find(o => o.tableId === tableId && o.status !== 'CLOSED'));
  
  const activeCategories = useMemo(() => menuCategories.filter(c => !c.status || c.status === 'ACTIVE'), [menuCategories]);
  
  const [activeCategory, setActiveCategory] = useState(activeCategories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  
  // For static pickup code
  const [pickupCode, setPickupCode] = useState('');
  const [activePickupItemId, setActivePickupItemId] = useState(null);

  // For cancellation
  const [itemToCancel, setItemToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const isAvailable = item.isAvailable !== false && (!item.status || item.status === 'ACTIVE');
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If searching, ignore category filter to show all matches
      if (searchQuery.trim()) {
        return isAvailable && matchesSearch;
      }
      
      return isAvailable && item.categoryId === activeCategory;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const handleAddToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === menuItem.id);
      if (existing) {
        return prev.map(i => i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const handleSendToKOT = () => {
    if (cart.length === 0) return;
    dispatch(sendOrderToKOT(table.id, currentUser.id, cart));
    setCart([]);
  };

  const handlePickupClick = (orderItemId) => {
    setActivePickupItemId(orderItemId);
    setPickupCode('');
  };

  const confirmPickup = (orderItemId) => {
    if (pickupCode === table.tableNumber) {
      dispatch(pickupItem(activeOrder.id, orderItemId, currentUser.id));
      setActivePickupItemId(null);
      setPickupCode('');
    } else {
      alert('Invalid table code. Please enter the exact table number (e.g. T04)');
    }
  };

  const handleServe = (orderItemId) => {
    dispatch(serveItem(activeOrder.id, orderItemId, currentUser.id));
  };

  const handleCompleteOrder = () => {
    const hasActiveItems = activeOrder.items.some(i => i.status !== 'SERVED' && i.status !== 'CANCELLED');
    if (hasActiveItems) {
      alert("All items must be served or cancelled before completing the order.");
      return;
    }
    dispatch(completeOrder(activeOrder.id, currentUser.id));
  };

  const confirmCancelItem = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason.");
      return;
    }
    dispatch(cancelItem(activeOrder.id, itemToCancel.id, currentUser.id, cancelReason));
    setItemToCancel(null);
    setCancelReason('');
  };

  const handleCancelOrderClick = () => {
    const hasServedItems = activeOrder.items.some(i => ['SERVED', 'PICKED_UP'].includes(i.status));
    if (hasServedItems) {
      alert("This order contains picked up or served items and cannot be completely cancelled. You can cancel remaining active items individually.");
      return;
    }
    setCancelReason('');
    setShowCancelOrderModal(true);
  };

  const confirmCancelOrder = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason.");
      return;
    }
    dispatch(cancelOrder(activeOrder.id, currentUser.id, cancelReason));
    setShowCancelOrderModal(false);
    setCancelReason('');
    navigate('/waiter/tables');
  };

  if (!table) return <div>Table not found</div>;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isOrderInProgress = !activeOrder || activeOrder.status === 'IN_PROGRESS';
  const allItemsFinished = activeOrder && activeOrder.items.length > 0 && activeOrder.items.every(i => i.status === 'SERVED' || i.status === 'CANCELLED');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-1 flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Pane: Menu or Status Screen */}
        <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Unified Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-white shadow-sm z-10">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/waiter/tables')} className="rounded-full shadow-sm bg-white shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-text-main flex items-center gap-3">
                  Table {table.tableNumber}
                  {activeOrder && (
                    <Badge variant={isOrderInProgress ? "warning" : "success"} className="text-xs px-2 py-0.5">
                      Order #{activeOrder.orderNumber}
                    </Badge>
                  )}
                </h1>
                <p className="text-xs font-medium text-text-muted mt-0.5">{table.capacity} Seats • Dine-In</p>
              </div>
            </div>

            {isOrderInProgress && (
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search menu items..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50/50 focus:bg-white"
                />
              </div>
            )}
          </div>
          {isOrderInProgress ? (
            <>


              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Categories Strip / Sidebar */}
                {!searchQuery && (
                  <div className="md:w-48 border-b md:border-b-0 md:border-r border-border bg-gray-50/30 overflow-x-auto md:overflow-y-auto custom-scrollbar p-3 flex md:flex-col gap-2 shrink-0">
                    {activeCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "whitespace-nowrap w-auto md:w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shrink-0",
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
                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 content-start custom-scrollbar bg-gray-50/20">
                  {filteredMenuItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex flex-col bg-white rounded-2xl border border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group overflow-hidden" 
                      onClick={() => handleAddToCart(item)}
                    >
                      <div className="h-32 w-full overflow-hidden bg-gray-100 relative">
                        {/* Placeholder image for a premium look */}
                        <img 
                          src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&auto=format&fit=crop`} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="font-extrabold text-lg text-text-main">₹{item.price}</span>
                          <button 
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-muted">
                      No items found.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Receipt className="w-10 h-10 text-status-success" />
              </div>
              <h2 className="text-3xl font-bold text-text-main mb-3">Bill Requested</h2>
              <p className="text-text-muted mb-8 max-w-sm text-lg leading-relaxed">
                This order has been sent to the Cashier. No further items can be added to this table.
              </p>
              <Badge variant="success" className="text-xl py-2 px-6 shadow-sm">{activeOrder.status}</Badge>
            </div>
          )}
        </div>

        {/* Right Pane: Cart & Active Order */}
        <div className="w-full lg:w-96 shrink-0 bg-white rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border/60 bg-gray-50/50">
            <h2 className="font-bold text-lg text-text-main flex items-center justify-between">
              Order Summary
              <span className="text-sm font-medium text-text-muted bg-gray-200/50 px-2.5 py-1 rounded-md">
                {(activeOrder?.items?.length || 0) + cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
            
            {/* Existing Active Order Items */}
            {activeOrder && activeOrder.items.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 pl-1">Kitchen Items</h3>
                <div className="space-y-3">
                  {activeOrder.items.map(oi => {
                    const menuItem = menuItems.find(m => m.id === oi.menuItemId);
                    return (
                      <div key={oi.id} className="bg-white p-4 rounded-xl border border-border hover:border-primary/30 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-text-main text-sm leading-tight mb-1">{menuItem?.name}</p>
                            <p className="text-xs font-semibold text-text-muted bg-gray-100 inline-block px-2 py-0.5 rounded">Qty: {oi.quantity}</p>
                          </div>
                          <Badge 
                            variant={
                              oi.status === 'READY' ? 'success' : 
                              oi.status === 'PREPARING' ? 'warning' : 
                              oi.status === 'SERVED' ? 'default' : 'primary'
                            }
                            className="text-[10px] px-2 py-0.5"
                          >
                            {oi.status}
                          </Badge>
                        </div>
                        
                        {/* Pickup / Serve Actions */}
                        {isOrderInProgress && oi.status === 'READY' && activePickupItemId !== oi.id && (
                          <Button size="sm" className="w-full mt-2 font-semibold shadow-sm" onClick={() => handlePickupClick(oi.id)}>
                            Pickup Item
                          </Button>
                        )}
                        
                        {isOrderInProgress && oi.status === 'READY' && activePickupItemId === oi.id && (
                          <div className="mt-2 flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Table Code (e.g. T04)" 
                              className="flex-1 h-9 rounded-lg border border-border px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                              value={pickupCode}
                              onChange={(e) => setPickupCode(e.target.value)}
                            />
                            <Button size="sm" variant="success" className="font-semibold shadow-sm" onClick={() => confirmPickup(oi.id)}>
                              Confirm
                            </Button>
                          </div>
                        )}

                        {isOrderInProgress && oi.status === 'PICKED_UP' && (
                          <Button size="sm" variant="secondary" className="w-full mt-2 font-semibold" onClick={() => handleServe(oi.id)}>
                            Serve to Customer
                          </Button>
                        )}
                        
                        {/* Cancel Action */}
                        {isOrderInProgress && ['ORDERED', 'PREPARING'].includes(oi.status) && (
                          <button 
                            className="w-full mt-3 text-xs font-semibold text-status-danger hover:text-red-700 transition-colors py-1" 
                            onClick={() => {
                              setItemToCancel({ id: oi.id, name: menuItem?.name || 'Item' });
                              setCancelReason('');
                            }}
                          >
                            Cancel Item
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Items Cart */}
            {isOrderInProgress && (
              <div>
                {cart.length > 0 && <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 pl-1">New Items</h3>}
                
                {cart.length === 0 && (!activeOrder || activeOrder.items.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-border/50">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-semibold text-text-main">Cart is empty</p>
                    <p className="text-sm text-text-muted mt-1 max-w-[200px]">Select items from the menu to add to this order.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-border/60 shadow-sm">
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-text-main text-sm mb-1 leading-tight">{item.name}</p>
                          <p className="text-primary font-bold text-sm">₹{item.price * item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-3 bg-gray-50 border border-border/50 rounded-lg p-1">
                          <button onClick={() => handleUpdateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded bg-white shadow-sm hover:bg-gray-100 text-text-main transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded bg-white shadow-sm hover:bg-gray-100 text-text-main transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
          
          {/* Action Buttons Container */}
          <div className="p-5 border-t border-border/60 bg-gray-50/80 space-y-3">
            {/* Send to KOT */}
            {isOrderInProgress && cart.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="font-bold text-text-main">Subtotal</span>
                  <span className="font-extrabold text-xl text-primary">₹{cartTotal}</span>
                </div>
                <Button className="w-full h-12 text-base font-bold shadow-md shadow-primary/20" onClick={handleSendToKOT}>
                  <Send className="w-4 h-4 mr-2" /> SEND TO KITCHEN
                </Button>
              </div>
            )}
  
            {/* Complete Order */}
            {isOrderInProgress && cart.length === 0 && allItemsFinished && (
              <Button className="w-full h-12 text-base font-bold shadow-md shadow-green-500/20" variant="success" onClick={handleCompleteOrder}>
                <CheckCircle className="w-4 h-4 mr-2" /> COMPLETE ORDER
              </Button>
            )}

            {/* Cancel Whole Order */}
            {isOrderInProgress && activeOrder && activeOrder.items.length > 0 && (
              <Button variant="outline" className="w-full h-10 font-bold border-red-200 text-status-danger hover:bg-red-50 hover:text-red-700 hover:border-red-300" onClick={handleCancelOrderClick}>
                CANCEL ENTIRE ORDER
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Item Modal */}
      {itemToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-[90%] overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-text-main">Cancel Item</h3>
              <button onClick={() => setItemToCancel(null)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-main">Cancel <strong>{itemToCancel.name}</strong>?</p>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Reason:</label>
                <input 
                  type="text" 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer changed order"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100">
              <Button variant="outline" onClick={() => setItemToCancel(null)}>Keep Item</Button>
              <Button variant="danger" className="bg-red-500 hover:bg-red-600 text-white border-red-600" onClick={confirmCancelItem}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-96 max-w-[90%] overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-text-main">Cancel Order</h3>
              <button onClick={() => setShowCancelOrderModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-main">Are you sure you want to cancel the entire order?</p>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Reason:</label>
                <input 
                  type="text" 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer left"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowCancelOrderModal(false)}>Keep Order</Button>
              <Button variant="danger" className="bg-red-500 hover:bg-red-600 text-white border-red-600" onClick={confirmCancelOrder}>
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
