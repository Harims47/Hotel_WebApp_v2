import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../../components/ui/Button';

import { Package, User, MapPin, Truck, Phone, Receipt, Search } from 'lucide-react';
import { assignDeliveryBoy } from '../../features/workflows/deliveryWorkflow';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function CashierDelivery() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);
  const bills = useSelector(state => state.billing.data);
  const orders = useSelector(state => state.orders.data);
  const users = useSelector(state => state.users.data);

  const [activeTab, setActiveTab] = useState('READY'); // READY, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState({});

  const deliveryBoys = users.filter(u => u.role === 'DELIVERY_BOY' && u.status === 'ACTIVE');

  // "Ready for Assignment" means Delivery.status === 'READY' AND Bill.status === 'PRINTED'
  const readyOrders = deliveryData.filter(d => {
    if (d.status !== 'READY') return false;
    const bill = bills.find(b => b.orderId === d.orderId);
    return bill && bill.status === 'PRINTED';
  });

  const assignedOrders = deliveryData.filter(d => d.status === 'ASSIGNED' || d.status === 'PICKED_UP');
  const outForDeliveryOrders = deliveryData.filter(d => d.status === 'OUT_FOR_DELIVERY');
  const deliveredOrders = deliveryData.filter(d => d.status === 'DELIVERED');

  const baseOrders = activeTab === 'READY' ? readyOrders
                   : activeTab === 'ASSIGNED' ? assignedOrders
                   : activeTab === 'OUT_FOR_DELIVERY' ? outForDeliveryOrders
                   : deliveredOrders;

  const displayedOrders = baseOrders.filter(d => {
    if (!searchQuery.trim()) return true;
    return d.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAssign = (deliveryId) => {
    const boyId = selectedDeliveryBoy[deliveryId];
    if (!boyId) {
      alert("Please select a delivery boy.");
      return;
    }
    dispatch(assignDeliveryBoy(deliveryId, boyId, currentUser.id));
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
        <div className="hidden lg:inline-flex items-center rounded-xl bg-canvas p-1.5 border border-border/60">
          <button 
            onClick={() => setActiveTab('READY')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'READY' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            Ready for Assignment <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'READY' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{readyOrders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('ASSIGNED')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'ASSIGNED' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            Assigned <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'ASSIGNED' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{assignedOrders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('OUT_FOR_DELIVERY')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'OUT_FOR_DELIVERY' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            Out for Delivery <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'OUT_FOR_DELIVERY' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{outForDeliveryOrders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('DELIVERED')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'DELIVERED' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            Delivered <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'DELIVERED' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{deliveredOrders.length}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-8 mt-4">
        {displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl shadow-sm">
            <Package className="w-12 h-12 text-text-faint mb-4" />
            <p className="font-bold text-lg text-text-main">No orders in this status</p>
            <p className="text-sm text-text-muted mt-1">There are currently no orders that match this filter.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="bg-surface/50 text-text-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[120px]">Order ID</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[100px]">Time</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Customer</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[250px]">Address</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[120px] text-right">Amount</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[200px]">Delivery Person</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[140px] text-center">Status</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs w-[140px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedOrders.map(delivery => {
                    const bill = bills.find(b => b.orderId === delivery.orderId);
                    const order = orders.find(o => o.id === delivery.orderId);
                    
                    return (
                      <tr 
                        key={delivery.id} 
                        className={cn(
                          "hover:bg-surface/30 transition-colors group",
                          delivery.status === 'READY' ? "bg-status-warning/5" : ""
                        )}
                      >
                        <td className="px-5 py-4">
                          <span className="font-bold text-text-main font-mono text-sm">{order?.orderNumber || delivery.orderId.substring(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="px-5 py-4 text-text-sub font-semibold">
                          {formatTime(delivery.createdAt || bill?.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-main flex items-center gap-1.5">
                              {delivery.customerName}
                            </span>
                            {delivery.customerPhone && (
                              <span className="text-xs text-text-muted font-medium mt-0.5">{delivery.customerPhone}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-text-sub font-medium line-clamp-2">
                            {delivery.address}, {delivery.area}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-text-main text-base">
                            ₹{bill?.grandTotal.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {delivery.status === 'READY' ? (
                            <select 
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white h-11"
                              value={selectedDeliveryBoy[delivery.id] || ''}
                              onChange={(e) => setSelectedDeliveryBoy(prev => ({ ...prev, [delivery.id]: e.target.value }))}
                            >
                              <option value="" disabled>Select person</option>
                              {deliveryBoys.map(boy => (
                                <option key={boy.id} value={boy.id}>{boy.name}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="font-bold text-sm text-text-main flex items-center bg-primary/10 text-primary px-3 py-2 rounded-lg w-max">
                              <Truck className="w-4 h-4 mr-2" />
                              {users.find(u => u.id === delivery.assignedDeliveryUserId)?.name || 'Assigned'}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill status={delivery.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            {delivery.status === 'READY' && (
                              <Button 
                                className="w-full font-bold h-11 bg-primary hover:bg-primary/90 text-white min-w-[100px]"
                                onClick={() => handleAssign(delivery.id)}
                                disabled={!selectedDeliveryBoy[delivery.id]}
                              >
                                Assign
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
