import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

import { Plus, Phone, Store, ShoppingBag, CheckCircle, Clock, Search } from 'lucide-react';
import { handoverTakeawayOrder, cancelTakeawayOrder } from '../../features/workflows/cashierWorkflow';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

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
    Swal.fire({
      title: 'Confirm Handover',
      text: "Handover this order to the customer?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c', // primary orange
      cancelButtonColor: '#6b7280', // gray
      confirmButtonText: 'Yes, Handover'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(handoverTakeawayOrder(orderId, currentUser.id));
        navigate('/cashier/bills');
        Swal.fire({
          title: 'Handover Complete',
          text: 'The order has been handed over successfully.',
          icon: 'success',
          confirmButtonColor: '#ea580c',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const handleCancel = (orderId) => {
    Swal.fire({
      title: 'Cancel Order?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // danger red
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel Order'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(cancelTakeawayOrder(orderId, currentUser.id));
        Swal.fire({
          title: 'Cancelled',
          text: 'The order has been cancelled.',
          icon: 'success',
          confirmButtonColor: '#ea580c',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-canvas max-w-7xl mx-auto w-full">
      <div className="px-4 md:px-6 pt-4 pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3" />
          <input 
            type="text" 
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:inline-flex items-center rounded-xl bg-canvas p-1.5 border border-border/60">
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
                activeTab === 'ACTIVE' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
              )}
            >
              Active Orders <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{activeOrders.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('READY')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
                activeTab === 'READY' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
              )}
            >
              Ready for Pickup <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'READY' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{readyOrders.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('COMPLETED')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
                activeTab === 'COMPLETED' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
              )}
            >
              Completed <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'COMPLETED' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{completedOrders.length}</span>
            </button>
          </div>
          <Button onClick={() => navigate('/cashier/takeaway/new')} className="font-bold shadow-md bg-green-600 hover:bg-green-700 text-white shadow-green-600/20 border-none whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" /> New Order
          </Button>
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
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="bg-surface/50 text-text-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[120px]">Order ID</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[100px]">Time</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Customer</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[250px]">Items</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[120px] text-right">Amount</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[140px] text-center">Status</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[120px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedOrders.map(order => {
                    const bill = kots.find(k => k.orderId === order.id); // Or order.totalAmount
                    const isReady = order.status === 'IN_PROGRESS' && activeTab === 'READY';
                    
                    return (
                      <tr 
                        key={order.id} 
                        className={cn(
                          "hover:bg-surface/30 transition-colors group",
                          isReady ? "bg-status-success/5" : ""
                        )}
                      >
                        <td className="px-5 py-4">
                          <span className="font-bold text-text-main">{order.orderNumber}</span>
                        </td>
                        <td className="px-5 py-4 text-text-sub font-semibold">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-main flex items-center gap-1.5">
                              {order.source === 'PHONE' ? <Phone className="w-3.5 h-3.5 text-blue-500" /> : <Store className="w-3.5 h-3.5 text-purple-500" />}
                              {order.customerName || 'Walk-in'}
                            </span>
                            {order.customerPhone && (
                              <span className="text-xs text-text-muted font-medium mt-0.5">{order.customerPhone}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-text-sub font-medium line-clamp-2">
                            {order.items.length === 1 ? (
                              <span className="font-semibold text-text-main">1 × {menuItems.find(m => m.id === order.items[0].menuItemId)?.name || 'Item'}</span>
                            ) : (
                              <span className="font-semibold text-text-main">{order.items.length} items</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-text-main text-base">
                            ₹{(order.totalAmount ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill status={isReady ? 'READY' : order.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            {activeTab === 'READY' ? (
                              <Button 
                                className="w-full font-bold h-10 bg-status-success hover:bg-status-success/90 text-white min-w-[100px]"
                                onClick={() => handleHandover(order.id)}
                              >
                                Handover
                              </Button>
                            ) : activeTab === 'ACTIVE' ? (
                              <Button 
                                className="w-full font-bold h-10 text-text-sub border-border hover:bg-surface/50 min-w-[100px]"
                                variant="outline"
                                onClick={() => navigate(`/waiter/orders/${order.id}`)}
                              >
                                View
                              </Button>
                            ) : (
                              <Button 
                                className="w-full font-bold h-10 text-text-sub border-border hover:bg-surface/50 min-w-[100px]"
                                variant="outline"
                                onClick={() => navigate(`/waiter/orders/${order.id}`)}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
