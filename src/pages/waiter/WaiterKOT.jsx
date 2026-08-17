import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChefHat, CheckCircle, Clock, Utensils, X, Search, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Badge';
import { pickupItem } from '../../features/workflows/waiterWorkflow';
import { cn } from '../../utils/cn';

export function WaiterKOT() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const orders = useSelector(state => state.orders.data);
  const tables = useSelector(state => state.tables.data);
  const menuItems = useSelector(state => state.menu.items);

  const [pickupCode, setPickupCode] = useState('');
  const [activePickupItemId, setActivePickupItemId] = useState(null);

  // Filter out orders that are closed or cancelled at the order level
  const activeOrders = orders.filter(
    o => o.waiterId === currentUser?.id && o.status !== 'CLOSED' && o.status !== 'CANCELLED'
  );

  // Flatten active order items
  const kotItems = [];
  activeOrders.forEach(order => {
    const table = tables.find(t => t.id === order.tableId);
    order.items.forEach(item => {
      if (['ORDERED', 'PREPARING', 'READY'].includes(item.status)) {
        kotItems.push({
          ...item,
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber: table?.tableNumber || 'Unknown',
          tableId: order.tableId,
          orderCreatedAt: order.createdAt
        });
      }
    });
  });

  const readyItems = kotItems.filter(i => i.status === 'READY');
  const preparingItems = kotItems.filter(i => i.status === 'PREPARING');
  const orderedItems = kotItems.filter(i => i.status === 'ORDERED');

  const handlePickupClick = (orderItemId) => { setActivePickupItemId(orderItemId); setPickupCode(''); };
  const confirmPickup = (orderId, orderItemId, tableNum) => {
    if (pickupCode === tableNum.toString()) {
      dispatch(pickupItem(orderId, orderItemId, currentUser.id));
      setActivePickupItemId(null); setPickupCode('');
    } else {
      alert('Invalid pickup code. Enter table number.');
    }
  };

  const renderSection = (title, items, icon, colorClass, emptyMessage) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className={cn("text-xs font-black tracking-widest uppercase mb-4 flex items-center gap-2", colorClass)}>
          {icon}
          {title} ({items.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            
            return (
              <div 
                key={item.id} 
                className={cn(
                  "p-4 rounded-xl border flex flex-col bg-surface shadow-sm transition-all",
                  item.status === 'READY' ? 'border-status-success/30 bg-status-success-bg/10 animate-pulse-slow' : 'border-border'
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-black text-text-main">T{item.tableNumber}</span>
                      <span className="text-xs font-bold text-text-muted">{item.orderNumber}</span>
                    </div>
                    <StatusPill status={item.status} size="xs" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-text-muted flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(item.orderCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-1 mb-4">
                  <p className="font-bold text-text-main text-sm">
                    {menuItem?.name || 'Unknown Item'}
                  </p>
                  <p className="text-xs font-bold text-text-muted">
                    Qty: {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs h-9 font-bold rounded-lg"
                    onClick={() => navigate(`/waiter/tables/${item.tableId}`)}
                  >
                    View
                  </Button>
                  
                  {item.status === 'READY' && (
                    activePickupItemId !== item.id ? (
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="flex-1 text-xs h-9 font-bold rounded-lg shadow-status-success-sm"
                        onClick={() => handlePickupClick(item.id)}
                      >
                        Pickup
                      </Button>
                    ) : (
                      <div className="flex-1 flex gap-1.5 h-9">
                        <input 
                          type="text" 
                          placeholder="Code" 
                          className="w-16 rounded border border-border px-1.5 text-xs outline-none focus:border-status-success" 
                          value={pickupCode} 
                          onChange={e => setPickupCode(e.target.value)} 
                        />
                        <Button size="sm" variant="success" className="h-9 px-3 text-xs rounded-lg" onClick={() => confirmPickup(item.orderId, item.id, item.tableNumber)}>Go</Button>
                        <button className="w-9 h-9 flex items-center justify-center text-text-muted border border-border rounded-lg bg-surface shrink-0 hover:bg-gray-100 transition-colors" onClick={() => setActivePickupItemId(null)}><X className="w-4 h-4" /></button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight mb-2">KOT Status</h1>
          <p className="text-text-muted font-medium max-w-2xl text-sm">
            Operational kitchen status. Track what's being prepared and what's ready for pickup.
          </p>
        </div>
      </div>

      {kotItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-border rounded-2xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ChefHat className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">No Active KOTs</h2>
          <p className="text-text-muted max-w-md">
            There are currently no items in the kitchen queue.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {renderSection('READY FOR PICKUP', readyItems, <Bell className="w-4 h-4" />, 'text-status-success')}
          {renderSection('PREPARING', preparingItems, <ChefHat className="w-4 h-4" />, 'text-status-preparing')}
          {renderSection('ORDERED', orderedItems, <Utensils className="w-4 h-4" />, 'text-text-muted')}
        </div>
      )}
    </div>
  );
}
