import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { MapPin, Phone, User, Package, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export function DeliveryOrders() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);
  const bills = useSelector(state => state.billing.data);

  // Exclude completed orders from this main view, or just show active ones
  const activeDeliveries = deliveryData.filter(d => 
    d.assignedDeliveryUserId === currentUser.id && 
    d.status !== 'DELIVERED' && 
    d.status !== 'CANCELLED'
  );

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-[1600px] mx-auto">
      <PageHeader 
        title="Active Deliveries" 
        description="Orders assigned to you for delivery"
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {activeDeliveries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-border/50 shadow-inner">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-text-main">No active deliveries</p>
            <p className="text-sm mt-2 max-w-sm text-center">You have no pending deliveries assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 content-start">
            {activeDeliveries.map(delivery => {
              const bill = bills.find(b => b.orderId === delivery.orderId);

              return (
                <Card 
                  key={delivery.id} 
                  className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer border-0 ring-1 ring-border shadow-sm overflow-hidden" 
                  onClick={() => navigate(`/delivery/orders/${delivery.id}`)}
                >
                  <div className={cn(
                    "h-1.5 w-full",
                    delivery.status === 'ASSIGNED' ? "bg-status-warning" : 
                    delivery.status === 'PICKED_UP' ? "bg-primary" : "bg-status-success"
                  )} />
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="p-5 border-b border-border/60 bg-gray-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-text-main">{delivery.orderId.replace('ord-', 'ORD-').toUpperCase()}</h3>
                          <Badge variant={delivery.status === 'OUT_FOR_DELIVERY' ? 'primary' : 'warning'} className="mt-2 font-bold shadow-sm">
                            {delivery.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-primary">₹{bill?.grandTotal || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start bg-white p-3 rounded-lg border border-border/50 shadow-sm">
                          <User className="w-5 h-5 mr-3 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-text-main leading-tight">{delivery.customerName}</p>
                            <p className="text-text-muted text-sm font-medium mt-1 flex items-center">
                              <Phone className="w-3.5 h-3.5 mr-1" />
                              {delivery.customerPhone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start bg-white p-3 rounded-lg border border-border/50 shadow-sm">
                          <MapPin className="w-5 h-5 mr-3 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-text-main text-sm font-medium leading-relaxed">
                              {delivery.address}, {delivery.area}, <br/>{delivery.city} {delivery.pincode}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full mt-auto font-bold shadow-md h-12 text-base" onClick={(e) => { e.stopPropagation(); navigate(`/delivery/orders/${delivery.id}`); }}>
                        <Navigation className="w-5 h-5 mr-2" /> View Details & Navigate
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
