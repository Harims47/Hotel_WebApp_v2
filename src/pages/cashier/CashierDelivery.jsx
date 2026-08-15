import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Package, User, MapPin, Truck } from 'lucide-react';
import { assignDeliveryBoy } from '../../features/workflows/deliveryWorkflow';
import { cn } from '../../utils/cn';

export function CashierDelivery() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);
  const bills = useSelector(state => state.billing.data);
  const users = useSelector(state => state.users.data);

  const [activeTab, setActiveTab] = useState('READY'); // READY, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED
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

  const displayedOrders = activeTab === 'READY' ? readyOrders
                        : activeTab === 'ASSIGNED' ? assignedOrders
                        : activeTab === 'OUT_FOR_DELIVERY' ? outForDeliveryOrders
                        : deliveredOrders;

  const handleAssign = (deliveryId) => {
    const boyId = selectedDeliveryBoy[deliveryId];
    if (!boyId) {
      alert("Please select a delivery boy.");
      return;
    }
    dispatch(assignDeliveryBoy(deliveryId, boyId, currentUser.id));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Delivery Management</h1>
          <p className="text-text-muted mt-1">Assign and track delivery orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {[
          { id: 'READY', label: 'Ready for Assignment', count: readyOrders.length },
          { id: 'ASSIGNED', label: 'Assigned / Picked Up', count: assignedOrders.length },
          { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: outForDeliveryOrders.length },
          { id: 'DELIVERED', label: 'Delivered', count: deliveredOrders.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center px-4 py-2 rounded-lg font-medium transition-colors border",
              activeTab === tab.id
                ? "bg-primary text-white border-primary"
                : "bg-surface text-text-main border-border hover:bg-gray-50"
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-xs",
              activeTab === tab.id ? "bg-white text-primary" : "bg-gray-200 text-text-muted"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
            <Package className="w-16 h-16 mb-4" />
            <p className="text-lg">No orders in this status</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
            {displayedOrders.map(delivery => {
              const bill = bills.find(b => b.orderId === delivery.orderId);
              
              return (
                <Card key={delivery.id} className="flex flex-col">
                  <CardHeader className="pb-2 border-b border-border bg-gray-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{delivery.orderId.replace('ord-', 'ORD-').toUpperCase()}</CardTitle>
                        <p className="text-xs text-text-muted mt-1">PHONE • DELIVERY</p>
                      </div>
                      <Badge variant={delivery.status === 'DELIVERED' ? 'success' : delivery.status === 'READY' ? 'warning' : 'primary'}>
                        {delivery.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col space-y-4">
                    <div className="space-y-2 text-sm text-text-main">
                      <div className="flex items-start">
                        <User className="w-4 h-4 mr-2 text-text-muted shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{delivery.customerName}</p>
                          <p className="text-text-muted text-xs">{delivery.customerPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-text-muted shrink-0 mt-0.5" />
                        <div className="text-xs text-text-muted line-clamp-2">
                          {delivery.address}, {delivery.area}, {delivery.city} {delivery.pincode}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="text-text-muted text-sm">Bill Amount</span>
                      <span className="text-lg font-bold text-text-main">₹{bill?.grandTotal || 0}</span>
                    </div>

                    {delivery.status === 'READY' && (
                      <div className="mt-auto pt-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-text-muted mb-1 block">Assign Delivery Boy</label>
                          <select 
                            className="w-full border border-border rounded px-3 py-2 text-sm bg-white"
                            value={selectedDeliveryBoy[delivery.id] || ''}
                            onChange={(e) => setSelectedDeliveryBoy(prev => ({ ...prev, [delivery.id]: e.target.value }))}
                          >
                            <option value="" disabled>Select a delivery boy</option>
                            {deliveryBoys.map(boy => (
                              <option key={boy.id} value={boy.id}>{boy.name}</option>
                            ))}
                          </select>
                        </div>
                        <Button className="w-full" onClick={() => handleAssign(delivery.id)}>
                          <Truck className="w-4 h-4 mr-2" /> Assign Delivery
                        </Button>
                      </div>
                    )}

                    {delivery.assignedDeliveryUserId && delivery.status !== 'READY' && (
                      <div className="mt-auto pt-4 border-t border-border">
                        <p className="text-xs text-text-muted mb-1">Assigned To</p>
                        <p className="font-medium text-sm flex items-center">
                          <Truck className="w-3 h-3 mr-1 text-primary" />
                          {users.find(u => u.id === delivery.assignedDeliveryUserId)?.name || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
