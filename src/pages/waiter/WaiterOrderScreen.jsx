import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Plus, Minus, Send, CheckCircle, Receipt } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { sendOrderToKOT, pickupItem, serveItem } from '../../features/workflows/waiterWorkflow';
import { completeOrder } from '../../features/workflows/cashierWorkflow';
import { cn } from '../../utils/cn';

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
  
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]?.id);
  const [cart, setCart] = useState([]);
  
  // For static pickup code
  const [pickupCode, setPickupCode] = useState('');
  const [activePickupItemId, setActivePickupItemId] = useState(null);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => item.categoryId === activeCategory && item.isAvailable);
  }, [menuItems, activeCategory]);

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

  if (!table) return <div>Table not found</div>;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isOrderInProgress = !activeOrder || activeOrder.status === 'IN_PROGRESS';
  const allItemsFinished = activeOrder && activeOrder.items.length > 0 && activeOrder.items.every(i => i.status === 'SERVED' || i.status === 'CANCELLED');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/waiter/tables')} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-text-main">
          Table {table.tableNumber} <span className="text-lg font-normal text-text-muted">({table.capacity} Seats)</span>
        </h1>
        {activeOrder && (
          <Badge variant={isOrderInProgress ? "warning" : "success"} className="ml-4">
            Order {activeOrder.orderNumber} - {activeOrder.status}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Pane: Menu or Status Screen */}
        <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-border overflow-hidden">
          {isOrderInProgress ? (
            <>
              {/* Categories */}
              <div className="flex overflow-x-auto p-4 border-b border-border space-x-2">
                {menuCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                      activeCategory === cat.id ? "bg-primary text-white" : "bg-gray-100 text-text-main hover:bg-gray-200"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              
              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                {filteredMenuItems.map(item => (
                  <Card key={item.id} className="flex flex-col hover:border-primary transition-colors cursor-pointer" onClick={() => handleAddToCart(item)}>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-text-main">{item.name}</h3>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="font-bold text-primary">₹{item.price}</span>
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <Receipt className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold text-text-main mb-2">Bill Requested</h2>
              <p className="text-text-muted mb-6">
                This order has been sent to the Cashier. No further items can be added.
              </p>
              <Badge variant="success" className="text-lg py-2 px-4">{activeOrder.status}</Badge>
            </div>
          )}
        </div>

        {/* Right Pane: Cart & Active Order */}
        <div className="w-96 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-gray-50">
            <h2 className="font-bold text-lg text-text-main">Order Summary</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Existing Active Order Items */}
            {activeOrder && activeOrder.items.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Kitchen Items</h3>
                <div className="space-y-3">
                  {activeOrder.items.map(oi => {
                    const menuItem = menuItems.find(m => m.id === oi.menuItemId);
                    return (
                      <div key={oi.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-text-main text-sm">{menuItem?.name}</p>
                            <p className="text-xs text-text-muted">Qty: {oi.quantity}</p>
                          </div>
                          <Badge 
                            variant={
                              oi.status === 'READY' ? 'success' : 
                              oi.status === 'PREPARING' ? 'warning' : 
                              oi.status === 'SERVED' ? 'default' : 'primary'
                            }
                          >
                            {oi.status}
                          </Badge>
                        </div>
                        
                        {/* Pickup / Serve Actions */}
                        {isOrderInProgress && oi.status === 'READY' && activePickupItemId !== oi.id && (
                          <Button size="sm" className="w-full mt-2" onClick={() => handlePickupClick(oi.id)}>
                            Pickup Item
                          </Button>
                        )}
                        
                        {isOrderInProgress && oi.status === 'READY' && activePickupItemId === oi.id && (
                          <div className="mt-2 flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Table Code (e.g. T04)" 
                              className="flex-1 h-8 rounded border border-border px-2 text-sm"
                              value={pickupCode}
                              onChange={(e) => setPickupCode(e.target.value)}
                            />
                            <Button size="sm" variant="success" className="bg-status-success hover:bg-green-600 text-white" onClick={() => confirmPickup(oi.id)}>
                              Confirm
                            </Button>
                          </div>
                        )}

                        {isOrderInProgress && oi.status === 'PICKED_UP' && (
                          <Button size="sm" variant="secondary" className="w-full mt-2" onClick={() => handleServe(oi.id)}>
                            Serve to Customer
                          </Button>
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
                {cart.length > 0 && <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">New Items</h3>}
                
                {cart.length === 0 && (!activeOrder || activeOrder.items.length === 0) ? (
                  <div className="text-center py-10 text-text-muted">
                    <p>Cart is empty</p>
                    <p className="text-xs mt-1">Select items from the menu to add</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-text-main text-sm">{item.name}</p>
                          <p className="text-primary font-medium text-sm">₹{item.price * item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                          <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 rounded bg-white shadow-sm hover:bg-gray-50 text-text-main">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 rounded bg-white shadow-sm hover:bg-gray-50 text-text-main">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
          
          {isOrderInProgress && cart.length > 0 && (
            <div className="p-4 border-t border-border bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-text-main">Subtotal</span>
                <span className="font-bold text-lg text-primary">₹{cartTotal}</span>
              </div>
              <Button className="w-full h-12 text-lg" onClick={handleSendToKOT}>
                <Send className="w-5 h-5 mr-2" /> Send to KOT
              </Button>
            </div>
          )}

          {isOrderInProgress && cart.length === 0 && allItemsFinished && (
            <div className="p-4 border-t border-border bg-gray-50">
              <Button className="w-full h-12 text-lg bg-status-success hover:bg-green-600 text-white" onClick={handleCompleteOrder}>
                <CheckCircle className="w-5 h-5 mr-2" /> Complete Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
