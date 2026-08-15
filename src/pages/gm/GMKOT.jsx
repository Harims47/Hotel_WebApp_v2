import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMKOT() {
  const kotItems = useSelector(state => state.kot.data) || [];
  
  const newKots = kotItems.filter(k => k.status === 'NEW');
  const preparingKots = kotItems.filter(k => k.status === 'PREPARING');
  const readyKots = kotItems.filter(k => k.status === 'READY');

  const renderKOTCard = (kot) => (
    <Card key={kot.id} className="mb-4 text-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2 border-b pb-2">
          <span className="font-bold">{kot.id}</span>
          <span className="text-gray-500">{kot.orderId}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <span>{kot.type}</span>
          <span>{kot.type === 'DINE_IN' ? `Table ${kot.tableId}` : 'Takeaway'}</span>
        </div>
        <div className="space-y-1 mt-2">
          {kot.items && kot.items.map((item, idx) => (
            <div key={idx} className="flex justify-between bg-gray-50 p-1 rounded">
              <span>{item.quantity}x {item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">KOT Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-600 border-b-2 border-red-500 pb-1">NEW ({newKots.length})</h2>
          <div className="space-y-4">
            {newKots.map(renderKOTCard)}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4 text-orange-600 border-b-2 border-orange-500 pb-1">PREPARING ({preparingKots.length})</h2>
          <div className="space-y-4">
            {preparingKots.map(renderKOTCard)}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-600 border-b-2 border-green-500 pb-1">READY ({readyKots.length})</h2>
          <div className="space-y-4">
            {readyKots.map(renderKOTCard)}
          </div>
        </div>
      </div>
    </div>
  );
}
