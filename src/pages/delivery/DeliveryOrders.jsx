import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Phone, User, Package, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export function DeliveryOrders() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);
  const bills = useSelector(state => state.billing.data);
  const orders = useSelector(state => state.orders.data);

  const [activeTab, setActiveTab] = useState('ACTIVE');

  const myDeliveries = deliveryData.filter(d => d.assignedDeliveryUserId === currentUser.id);

  const activeDeliveries = myDeliveries.filter(d => 
    d.status !== 'DELIVERED' && 
    d.status !== 'CANCELLED'
  );

  const completedDeliveries = myDeliveries.filter(d => 
    d.status === 'DELIVERED'
  );

  const displayedDeliveries = activeTab === 'ACTIVE' ? activeDeliveries : completedDeliveries;

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-[1600px] mx-auto w-full bg-canvas">
      {/* Compact Header with Tabs */}
      <div className="px-4 md:px-6 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-canvas">
        <div>
          <h1 className="text-2xl font-black text-text-main leading-none uppercase tracking-tight">My Orders</h1>
          <p className="text-sm text-text-muted mt-1 font-medium">Orders assigned to you for delivery</p>
        </div>
        <div className="flex w-full sm:w-auto p-1 bg-surface border border-border/80 rounded-lg shadow-sm">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-md text-[13px] font-bold transition-all whitespace-nowrap", activeTab === 'ACTIVE' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main")}
          >
            Active
            <span className={cn("inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[10px] font-black", activeTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm border border-border/50")}>
              {activeDeliveries.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-md text-[13px] font-bold transition-all whitespace-nowrap", activeTab === 'COMPLETED' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main")}
          >
            Completed
            <span className={cn("inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[10px] font-black", activeTab === 'COMPLETED' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm border border-border/50")}>
              {completedDeliveries.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-10">
        {displayedDeliveries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted pb-12">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-border/60 shadow-sm">
              {activeTab === 'ACTIVE' ? (
                <Package className="w-8 h-8 text-text-faint" />
              ) : (
                <CheckCircle className="w-8 h-8 text-text-faint" />
              )}
            </div>
            <p className="text-xl font-bold text-text-main">
              {activeTab === 'ACTIVE' ? 'No active deliveries' : 'No completed deliveries'}
            </p>
            <p className="text-sm mt-1 font-medium">
              {activeTab === 'ACTIVE' ? 'You have no pending deliveries assigned to you.' : "You haven't completed any deliveries yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {displayedDeliveries.map(delivery => {
              const bill = bills.find(b => b.orderId === delivery.orderId);
              const order = orders.find(o => o.id === delivery.orderId);
              const orderIdDisplay = order?.orderNumber || delivery.orderId.substring(0, 8).toUpperCase();
              
              const itemCount = order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              const isCompleted = delivery.status === 'DELIVERED';

              return (
                <Card 
                  key={delivery.id} 
                  className={cn(
                    "flex flex-col hover:shadow-lg transition-shadow cursor-pointer border shadow-sm overflow-hidden",
                    isCompleted ? "border-border/60 opacity-80" : "border-border/60"
                  )}
                  onClick={() => navigate(`/delivery/orders/${delivery.id}`)}
                >
                  <div className={cn(
                    "h-1.5 w-full",
                    isCompleted ? "bg-gray-400" :
                    delivery.status === 'ASSIGNED' ? "bg-status-warning" : 
                    delivery.status === 'PICKED_UP' ? "bg-primary" : "bg-status-success"
                  )} />
                  <CardContent className="p-0 flex flex-col h-full bg-white">
                    <div className={cn("p-4 border-b border-border/60", isCompleted ? "bg-surface/50" : "bg-surface/50")}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <h3 className={cn("text-xl font-black tracking-tight font-mono", isCompleted ? "text-text-muted" : "text-text-main")}>{orderIdDisplay}</h3>
                          <Badge variant={isCompleted ? 'default' : delivery.status === 'OUT_FOR_DELIVERY' ? 'primary' : 'warning'} className="font-bold shadow-sm w-fit text-[10px] px-2 py-0.5">
                            {delivery.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className={cn("text-xl font-black", isCompleted ? "text-text-muted" : "text-primary")}>₹{bill?.grandTotal || 0}</span>
                          <span className="text-xs font-semibold text-text-muted mt-1">{itemCount} items</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn("p-4 flex-1 flex flex-col gap-3", isCompleted && "bg-surface/20")}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("font-bold leading-tight truncate", isCompleted ? "text-text-muted" : "text-text-main")}>{delivery.customerName}</p>
                          <p className="text-text-muted text-xs font-semibold mt-0.5">{delivery.customerPhone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-surface p-3 rounded-lg border border-border/50">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-text-main text-xs font-medium leading-relaxed">
                          {delivery.address ? (
                            <span className={isCompleted ? "text-text-muted" : ""}>
                              {delivery.address}, {delivery.area} <br/>{delivery.city} {delivery.pincode}
                            </span>
                          ) : (
                            <span className="text-status-warning italic">Address not provided yet</span>
                          )}
                        </div>
                      </div>

                      <Button className="w-full mt-2 font-bold shadow-sm h-11 text-sm bg-gray-50 text-text-main border border-border hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); navigate(`/delivery/orders/${delivery.id}`); }}>
                        View Order <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
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
