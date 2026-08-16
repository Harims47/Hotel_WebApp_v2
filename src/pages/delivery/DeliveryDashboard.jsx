import React from 'react';
import { useSelector } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

export function DeliveryDashboard() {
  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);

  const assignedToMe = deliveryData.filter(d => d.assignedDeliveryUserId === currentUser.id);

  const readyForPickup = assignedToMe.filter(d => d.status === 'ASSIGNED').length;
  const inPossession = assignedToMe.filter(d => d.status === 'PICKED_UP').length;
  const outForDelivery = assignedToMe.filter(d => d.status === 'OUT_FOR_DELIVERY').length;
  const deliveredToday = assignedToMe.filter(d => d.status === 'DELIVERED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Delivery Dashboard" 
        description={`Welcome back, ${currentUser.name}. Here's your delivery overview.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ready for Pickup"
          value={readyForPickup.toString()}
          icon={Package}
          className={cn("border-l-4", readyForPickup > 0 ? "border-l-orange-500" : "border-l-border")}
        />
        <MetricCard
          title="In Possession"
          value={inPossession.toString()}
          icon={Clock}
          className="border-l-4 border-l-blue-500"
        />
        <MetricCard
          title="Out for Delivery"
          value={outForDelivery.toString()}
          icon={Truck}
          className="border-l-4 border-l-indigo-500"
        />
        <MetricCard
          title="Delivered Today"
          value={deliveredToday.toString()}
          icon={CheckCircle}
          className="border-l-4 border-l-green-500"
        />
      </div>
      
      {/* Optional: Add a quick overview map or activity list in V2, left empty for now as in original */}
    </div>
  );
}
