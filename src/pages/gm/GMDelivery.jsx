import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMDelivery() {
  const deliveries = useSelector(state => state.delivery.data) || [];
  
  const ready = deliveries.filter(d => d.status === 'READY');
  const assigned = deliveries.filter(d => d.status === 'ASSIGNED');
  const pickedUp = deliveries.filter(d => d.status === 'PICKED_UP');
  const outForDelivery = deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY');
  const delivered = deliveries.filter(d => d.status === 'DELIVERED');

  const renderDeliveryCard = (delivery) => (
    <Card key={delivery.id} className="mb-4 text-sm border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2 border-b pb-2">
          <span className="font-bold">{delivery.id}</span>
          <span className="text-gray-500">{delivery.orderId}</span>
        </div>
        <div className="space-y-1 mt-2 text-xs text-gray-600">
          <div className="flex justify-between"><span>Customer:</span> <span>{delivery.customerId || 'Unknown'}</span></div>
          <div className="flex justify-between"><span>Address:</span> <span className="truncate w-32 text-right">{delivery.address || '-'}</span></div>
          <div className="flex justify-between"><span>Boy:</span> <span className="font-medium">{delivery.deliveryBoyId || 'Unassigned'}</span></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Delivery Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        <div className="min-w-[250px]">
          <h2 className="text-sm font-semibold mb-4 text-gray-600 border-b-2 border-gray-300 pb-1">READY ({ready.length})</h2>
          <div className="space-y-4">
            {ready.map(renderDeliveryCard)}
          </div>
        </div>
        <div className="min-w-[250px]">
          <h2 className="text-sm font-semibold mb-4 text-orange-500 border-b-2 border-orange-300 pb-1">ASSIGNED ({assigned.length})</h2>
          <div className="space-y-4">
            {assigned.map(renderDeliveryCard)}
          </div>
        </div>
        <div className="min-w-[250px]">
          <h2 className="text-sm font-semibold mb-4 text-blue-500 border-b-2 border-blue-300 pb-1">PICKED UP ({pickedUp.length})</h2>
          <div className="space-y-4">
            {pickedUp.map(renderDeliveryCard)}
          </div>
        </div>
        <div className="min-w-[250px]">
          <h2 className="text-sm font-semibold mb-4 text-indigo-500 border-b-2 border-indigo-300 pb-1">OUT FOR DELIVERY ({outForDelivery.length})</h2>
          <div className="space-y-4">
            {outForDelivery.map(renderDeliveryCard)}
          </div>
        </div>
        <div className="min-w-[250px]">
          <h2 className="text-sm font-semibold mb-4 text-green-600 border-b-2 border-green-300 pb-1">DELIVERED ({delivered.length})</h2>
          <div className="space-y-4">
            {delivered.map(renderDeliveryCard)}
          </div>
        </div>
      </div>
    </div>
  );
}
