import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Phone, Store, ShoppingBag } from 'lucide-react';
import { handoverTakeawayOrder, cancelTakeawayOrder } from '../../features/workflows/cashierWorkflow';

export function CashierTakeaway() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const orders = useSelector(state => state.orders.data);
  const kots = useSelector(state => state.kot.data);
  const menuItems = useSelector(state => state.menu.items);
  
  const [activeTab, setActiveTab] = useState('ACTIVE');

  // Filter takeaway orders
  const takeawayOrders = orders.filter(o => o.orderType === 'TAKEAWAY');

  const activeOrders = takeawayOrders.filter(o => o.status === 'IN_PROGRESS' && kots.some(k => k.orderId === o.id && k.status !== 'READY'));
  const readyOrders = takeawayOrders.filter(o => o.status === 'IN_PROGRESS' && kots.some(k => k.orderId === o.id && k.status === 'READY'));
  const completedOrders = takeawayOrders.filter(o => o.status !== 'IN_PROGRESS' && o.status !== 'CANCELLED');

  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders 
                        : activeTab === 'READY' ? readyOrders 
                        : completedOrders;

  const handleHandover = (orderId) => {
    if (window.confirm('Confirm handover to customer?')) {
      dispatch(handoverTakeawayOrder(orderId, currentUser.id));
      // Handover transitions to BILL_REQUESTED. Cashier will then go to Bills to handle payment.
      navigate('/cashier/bills');
    }
  };

  const handleCancel = (orderId) => {
    if (window.confirm('Cancel this takeaway order?')) {
      dispatch(cancelTakeawayOrder(orderId, currentUser.id));
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main flex items-center">
          <ShoppingBag className="w-6 h-6 mr-2 text-primary" />
          Takeaway Orders
        </h1>
        <Button onClick={() => navigate('/cashier/takeaway/new')} className="bg-primary hover:bg-primary-dark">
          <Plus className="w-5 h-5 mr-2" /> New Takeaway Order
        </Button>
      </div>

      <div className="flex space-x-2 border-b border-border/50 pb-2">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${activeTab === 'ACTIVE' ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-100'}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${activeTab === 'READY' ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-100'}`}
          onClick={() => setActiveTab('READY')}
        >
          Ready for Pickup ({readyOrders.length})
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${activeTab === 'COMPLETED' ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-100'}`}
          onClick={() => setActiveTab('COMPLETED')}
        >
          Completed
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          No {activeTab.toLowerCase()} takeaway orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start overflow-y-auto pb-10">
          {displayedOrders.map(order => (
            <Card key={order.id} className="border-t-4 border-t-primary flex flex-col h-full">
              <CardHeader className="bg-gray-50 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-primary">{order.orderNumber}</CardTitle>
                    <p className="text-sm font-semibold text-text-main mt-1 flex items-center">
                      {order.source === 'PHONE' ? <Phone className="w-4 h-4 mr-1" /> : <Store className="w-4 h-4 mr-1" />}
                      {order.customerName || 'Customer'}
                    </p>
                    {order.customerPhone && (
                      <p className="text-xs text-text-muted mt-1">{order.customerPhone}</p>
                    )}
                  </div>
                  <Badge variant={order.status === 'CLOSED' ? 'success' : 'warning'}>
                    {order.status === 'IN_PROGRESS' && activeTab === 'READY' ? 'READY' : order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <div className="space-y-2 flex-1 mb-6">
                  {order.items.map(item => {
                    const mItem = menuItems.find(m => m.id === item.menuItemId);
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}× {mItem?.name || 'Item'}</span>
                        <span className="text-text-muted">{item.status}</span>
                      </div>
                    );
                  })}
                </div>

                {activeTab === 'READY' && (
                  <div className="pt-4 border-t border-border">
                    <Button 
                      className="w-full"
                      variant="success"
                      onClick={() => handleHandover(order.id)}
                    >
                      Pickup / Handover
                    </Button>
                  </div>
                )}
                
                {activeTab === 'ACTIVE' && (
                  <div className="pt-4 border-t border-border">
                    <Button 
                      className="w-full text-status-error border-status-error hover:bg-status-error/10"
                      variant="outline"
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancel Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
