import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Plus, Phone, Store, ShoppingBag, CheckCircle, Clock, Search } from 'lucide-react';
import { handoverTakeawayOrder, cancelTakeawayOrder } from '../../features/workflows/cashierWorkflow';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function CashierTakeaway() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const orders = useSelector(state => state.orders.data);
  const kots = useSelector(state => state.kot.data);
  const menuItems = useSelector(state => state.menu.items);
  
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter takeaway orders
  const takeawayOrders = orders.filter(o => o.orderType === 'TAKEAWAY');

  const activeOrders = takeawayOrders.filter(o => o.status === 'IN_PROGRESS' && kots.some(k => k.orderId === o.id && k.status !== 'READY'));
  const readyOrders = takeawayOrders.filter(o => o.status === 'IN_PROGRESS' && kots.some(k => k.orderId === o.id && k.status === 'READY'));
  const completedOrders = takeawayOrders.filter(o => o.status !== 'IN_PROGRESS' && o.status !== 'CANCELLED');

  const baseOrders = activeTab === 'ACTIVE' ? activeOrders 
                   : activeTab === 'READY' ? readyOrders 
                   : completedOrders;

  const displayedOrders = baseOrders.filter(o => {
    if (!searchQuery.trim()) return true;
    return o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || o.id?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleHandover = (orderId) => {
    if (window.confirm('Confirm handover to customer?')) {
      dispatch(handoverTakeawayOrder(orderId, currentUser.id));
      navigate('/cashier/bills');
    }
  };

  const handleCancel = (orderId) => {
    if (window.confirm('Cancel this takeaway order?')) {
      dispatch(cancelTakeawayOrder(orderId, currentUser.id));
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-canvas max-w-7xl mx-auto w-full">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <PageHeader 
          title="Takeaway Orders" 
          description="Manage active and completed takeaway orders."
          actions={
            <Button onClick={() => navigate('/cashier/takeaway/new')} className="font-bold shadow-md shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> New Order
            </Button>
          }
        />
        <div className="mt-4">
          <Tabs>
            <TabsList>
              <TabsTrigger isActive={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')}>
                Active Orders
                <span className="ml-2 bg-surface text-text-muted px-2 py-0.5 rounded-full text-[10px] font-bold border border-border">{activeOrders.length}</span>
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === 'READY'} onClick={() => setActiveTab('READY')}>
                Ready for Pickup
                <span className={cn(
                  "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  readyOrders.length > 0 ? "bg-status-success/10 text-status-success border-status-success/20" : "bg-surface text-text-muted border-border"
                )}>{readyOrders.length}</span>
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === 'COMPLETED'} onClick={() => setActiveTab('COMPLETED')}>
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4 flex items-center relative max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3" />
            <input 
              type="text" 
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-8 mt-4">
        {displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl shadow-sm">
            <ShoppingBag className="w-12 h-12 text-text-faint mb-4" />
            <p className="font-bold text-lg text-text-main">No {activeTab.toLowerCase()} orders</p>
            <p className="text-sm text-text-muted mt-1">There are currently no orders in this state.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {displayedOrders.map(order => (
              <div 
                key={order.id} 
                className={cn(
                  "flex flex-col bg-white rounded-xl border border-border shadow-sm overflow-hidden transition-all",
                  order.status === 'IN_PROGRESS' && activeTab === 'READY' ? "ring-1 ring-status-success/30 border-status-success/30" : 
                  activeTab === 'ACTIVE' ? "hover:border-border-strong hover:shadow-md" : ""
                )}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border bg-surface/50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-text-main text-sm">{order.orderNumber}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(order.createdAt)}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-0.5">Customer</p>
                      <p className="text-sm font-bold text-text-main flex items-center gap-1">
                        {order.source === 'PHONE' ? <Phone className="w-3 h-3 text-blue-500" /> : <Store className="w-3 h-3 text-purple-500" />}
                        {order.customerName || 'Walk-in'}
                      </p>
                      {order.customerPhone && (
                        <p className="text-xs text-text-muted mt-0.5">{order.customerPhone}</p>
                      )}
                    </div>
                    <StatusPill status={order.status === 'IN_PROGRESS' && activeTab === 'READY' ? 'READY' : order.status} />
                  </div>

                  <div className="mt-2 pt-3 border-t border-dashed border-border/60">
                    <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2">Items</p>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                      {order.items.map(item => {
                        const mItem = menuItems.find(m => m.id === item.menuItemId);
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-text-main truncate pr-2 font-medium">
                              <span className="text-primary mr-1.5 font-bold">{item.quantity}×</span> 
                              {mItem?.name || 'Item'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                {activeTab === 'READY' && (
                  <div className="p-3 bg-status-success/5 border-t border-status-success/20">
                    <Button 
                      className="w-full font-bold h-10 bg-status-success hover:bg-status-success/90 text-white"
                      onClick={() => handleHandover(order.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> HANDOVER
                    </Button>
                  </div>
                )}
                
                {activeTab === 'ACTIVE' && (
                  <div className="p-3 bg-surface/30 border-t border-border">
                    <Button 
                      className="w-full text-xs font-bold text-status-danger border-border hover:bg-status-danger/10 hover:border-status-danger/30"
                      variant="outline"
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancel Order
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
