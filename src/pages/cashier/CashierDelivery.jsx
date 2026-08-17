import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Package, User, MapPin, Truck, Phone, Receipt, Search } from 'lucide-react';
import { assignDeliveryBoy } from '../../features/workflows/deliveryWorkflow';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function CashierDelivery() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);
  const bills = useSelector(state => state.billing.data);
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
      <div className="px-4 md:px-6 pt-4 pb-2">
        <PageHeader 
          title="Delivery Management" 
          description="Assign and track delivery orders."
        />
        <div className="mt-4">
          <Tabs>
            <TabsList>
              <TabsTrigger isActive={activeTab === 'READY'} onClick={() => setActiveTab('READY')}>
                Ready for Assignment
                <span className={cn(
                  "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  readyOrders.length > 0 ? "bg-status-warning/10 text-status-warning border-status-warning/20" : "bg-surface text-text-muted border-border"
                )}>{readyOrders.length}</span>
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === 'ASSIGNED'} onClick={() => setActiveTab('ASSIGNED')}>
                Assigned
                <span className="ml-2 bg-surface text-text-muted px-2 py-0.5 rounded-full text-[10px] font-bold border border-border">{assignedOrders.length}</span>
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === 'OUT_FOR_DELIVERY'} onClick={() => setActiveTab('OUT_FOR_DELIVERY')}>
                Out for Delivery
                <span className="ml-2 bg-surface text-text-muted px-2 py-0.5 rounded-full text-[10px] font-bold border border-border">{outForDeliveryOrders.length}</span>
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === 'DELIVERED'} onClick={() => setActiveTab('DELIVERED')}>
                Delivered
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
            <Package className="w-12 h-12 text-text-faint mb-4" />
            <p className="font-bold text-lg text-text-main">No orders in this status</p>
            <p className="text-sm text-text-muted mt-1">There are currently no orders that match this filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {displayedOrders.map(delivery => {
              const bill = bills.find(b => b.orderId === delivery.orderId);
              
              return (
                <div 
                  key={delivery.id} 
                  className={cn(
                    "flex flex-col bg-white rounded-xl border border-border shadow-sm overflow-hidden transition-all",
                    delivery.status === 'READY' ? "ring-1 ring-status-warning/30 border-status-warning/30" : "hover:border-border-strong hover:shadow-md"
                  )}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border bg-surface/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-main text-sm">{delivery.orderId.replace('ord-', 'ORD-').toUpperCase()}</span>
                    </div>
                    <StatusPill status={delivery.status} />
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col space-y-4">
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-0.5">Customer</p>
                        <p className="text-sm font-bold text-text-main flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-text-sub" /> {delivery.customerName}
                        </p>
                        {delivery.customerPhone && (
                          <p className="text-xs text-text-sub flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {delivery.customerPhone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-0.5">Amount</p>
                        <p className="text-lg font-black text-primary leading-none">
                          ₹{bill?.grandTotal.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-surface/50 p-3 rounded-lg border border-border/60 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-text-sub font-medium leading-relaxed">
                        {delivery.address}, {delivery.area}, {delivery.city} {delivery.pincode}
                      </p>
                    </div>

                    {delivery.status === 'READY' && (
                      <div className="mt-auto pt-2 border-t border-dashed border-border/60">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Assign Delivery Person</label>
                        <div className="flex gap-2">
                          <select 
                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                            value={selectedDeliveryBoy[delivery.id] || ''}
                            onChange={(e) => setSelectedDeliveryBoy(prev => ({ ...prev, [delivery.id]: e.target.value }))}
                          >
                            <option value="" disabled>Select person</option>
                            {deliveryBoys.map(boy => (
                              <option key={boy.id} value={boy.id}>{boy.name}</option>
                            ))}
                          </select>
                          <Button 
                            className="font-bold shadow-md shadow-primary/20"
                            onClick={() => handleAssign(delivery.id)}
                            disabled={!selectedDeliveryBoy[delivery.id]}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    )}

                    {delivery.assignedDeliveryUserId && delivery.status !== 'READY' && (
                      <div className="mt-auto pt-3 border-t border-dashed border-border/60 flex justify-between items-center">
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Assigned To</p>
                        <p className="font-bold text-sm text-text-main flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md">
                          <Truck className="w-3.5 h-3.5 mr-1.5" />
                          {users.find(u => u.id === delivery.assignedDeliveryUserId)?.name || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
