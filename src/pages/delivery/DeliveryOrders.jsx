import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Phone, User, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-main">Active Deliveries</h1>
        <p className="text-text-muted mt-1">Orders assigned to you for delivery</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeDeliveries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
            <Package className="w-16 h-16 mb-4" />
            <p className="text-lg">No active deliveries</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 content-start">
            {activeDeliveries.map(delivery => {
              const bill = bills.find(b => b.orderId === delivery.orderId);

              return (
                <Card key={delivery.id} className="flex flex-col hover:border-primary transition-colors cursor-pointer" onClick={() => navigate(`/delivery/orders/${delivery.id}`)}>
                  <CardContent className="p-5 flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-text-main">{delivery.orderId.replace('ord-', 'ORD-').toUpperCase()}</h3>
                        <Badge variant={delivery.status === 'OUT_FOR_DELIVERY' ? 'primary' : 'warning'} className="mt-2">
                          {delivery.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary">₹{bill?.grandTotal || 0}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-border">
                      <div className="flex items-start">
                        <User className="w-4 h-4 mr-3 text-text-muted shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-text-main text-sm">{delivery.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="w-4 h-4 mr-3 text-text-muted shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-muted text-sm">{delivery.customerPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-3 text-text-muted shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-muted text-sm line-clamp-2">
                            {delivery.address}, {delivery.area}, {delivery.city} {delivery.pincode}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full mt-auto" onClick={(e) => { e.stopPropagation(); navigate(`/delivery/orders/${delivery.id}`); }}>
                      View Details
                    </Button>
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
