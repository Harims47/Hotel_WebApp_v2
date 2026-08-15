import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

export function DeliveryDashboard() {
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);

  const assignedToMe = deliveryData.filter(d => d.assignedDeliveryUserId === currentUser.id);

  const readyForPickup = assignedToMe.filter(d => d.status === 'ASSIGNED').length;
  const inPossession = assignedToMe.filter(d => d.status === 'PICKED_UP').length;
  const outForDelivery = assignedToMe.filter(d => d.status === 'OUT_FOR_DELIVERY').length;
  const deliveredToday = assignedToMe.filter(d => d.status === 'DELIVERED').length;

  const metrics = [
    { label: 'Ready for Pickup', value: readyForPickup, icon: Package, color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'In Possession', value: inPossession, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Out for Delivery', value: outForDelivery, icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { label: 'Delivered', value: deliveredToday, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-main">Delivery Dashboard</h1>
        <p className="text-text-muted mt-1">Welcome back, {currentUser.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-6 flex items-center">
                <div className={`p-4 rounded-full ${metric.bg} ${metric.color} mr-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-text-muted text-sm font-medium">{metric.label}</p>
                  <p className="text-3xl font-bold text-text-main">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
