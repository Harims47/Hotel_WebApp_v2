import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Plus, Phone, Store, ShoppingBag, CheckCircle } from 'lucide-react';
import { handoverTakeawayOrder, cancelTakeawayOrder } from '../../features/workflows/cashierWorkflow';
import { cn } from '../../utils/cn';

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
    <div className="space-y-6 h-full flex flex-col max-w-[1600px] mx-auto">
      <PageHeader 
        title="Takeaway Orders" 
        description="Manage active and completed takeaway orders."
        action={
          <Button onClick={() => navigate('/cashier/takeaway/new')} className="font-bold shadow-md shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" /> New Order
          </Button>
        }
      >
        <Tabs>
          <TabsList>
            <TabsTrigger isActive={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')}>Active Orders <Badge variant="secondary" className="ml-2 text-[10px]">{activeOrders.length}</Badge></TabsTrigger>
            <TabsTrigger isActive={activeTab === 'READY'} onClick={() => setActiveTab('READY')}>Ready for Pickup <Badge variant={readyOrders.length > 0 ? "success" : "secondary"} className="ml-2 text-[10px]">{readyOrders.length}</Badge></TabsTrigger>
            <TabsTrigger isActive={activeTab === 'COMPLETED'} onClick={() => setActiveTab('COMPLETED')}>Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      {displayedOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-border/50 shadow-inner">
            <ShoppingBag className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-text-main">No {activeTab.toLowerCase()} orders</p>
          <p className="text-sm mt-1">There are currently no orders in this state.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start overflow-y-auto pb-10 custom-scrollbar pr-2">
          {displayedOrders.map(order => (
            <Card key={order.id} className="flex flex-col h-full hover:shadow-lg transition-shadow border-0 ring-1 ring-border shadow-sm overflow-hidden">
              <div className={cn(
                "h-1.5 w-full",
                order.status === 'IN_PROGRESS' && activeTab === 'READY' ? "bg-status-success" : 
                order.status === 'IN_PROGRESS' ? "bg-status-warning" : 
                order.status === 'CLOSED' ? "bg-gray-400" : "bg-primary"
              )} />
              <CardHeader className="bg-gray-50/80 pb-4 border-b border-border/60">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-black tracking-tight text-text-main">{order.orderNumber}</CardTitle>
                    <p className="text-sm font-bold text-text-main mt-2 flex items-center bg-white border border-border/50 px-2 py-1 rounded w-fit shadow-sm">
                      {order.source === 'PHONE' ? <Phone className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> : <Store className="w-3.5 h-3.5 mr-1.5 text-purple-500" />}
                      {order.customerName || 'Customer'}
                    </p>
                    {order.customerPhone && (
                      <p className="text-xs text-text-muted mt-1.5 font-medium">{order.customerPhone}</p>
                    )}
                  </div>
                  <Badge variant={order.status === 'CLOSED' ? 'default' : (activeTab === 'READY' ? 'success' : 'warning')} className="font-bold shadow-sm">
                    {order.status === 'IN_PROGRESS' && activeTab === 'READY' ? 'READY' : order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="space-y-0 flex-1 overflow-y-auto max-h-[250px] custom-scrollbar">
                  {order.items.map((item, index) => {
                    const mItem = menuItems.find(m => m.id === item.menuItemId);
                    return (
                      <div key={item.id} className={cn("flex justify-between items-center p-3 px-4 border-b border-border/50 text-sm", index % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                        <span className="font-semibold text-text-main"><span className="text-primary mr-1.5">{item.quantity}×</span> {mItem?.name || 'Item'}</span>
                        <span className="text-xs font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded">{item.status}</span>
                      </div>
                    );
                  })}
                </div>

                {activeTab === 'READY' && (
                  <div className="p-4 bg-green-50/50 border-t border-green-100">
                    <Button 
                      className="w-full font-bold shadow-md shadow-green-500/20 text-base h-12"
                      variant="success"
                      onClick={() => handleHandover(order.id)}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" /> HANDOVER
                    </Button>
                  </div>
                )}
                
                {activeTab === 'ACTIVE' && (
                  <div className="p-4 bg-gray-50 border-t border-border/60">
                    <Button 
                      className="w-full font-bold border-red-200 text-status-danger hover:bg-red-50 hover:text-red-700 hover:border-red-300"
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
