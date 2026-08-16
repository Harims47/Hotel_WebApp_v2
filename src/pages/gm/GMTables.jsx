import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMTables() {
  const tables = useSelector(state => state.tables.data) || [];
  const orders = useSelector(state => state.orders.data) || [];
  const users = useSelector(state => state.users.data) || [];
  
  const [selectedTable, setSelectedTable] = useState(null);

  const getTableDetails = (table) => {
    if (table.status !== 'OCCUPIED') return null;
    // Find active order for this table
    const activeOrder = orders.find(o => o.tableId === table.id && o.status === 'IN_PROGRESS');
    if (!activeOrder) return null;
    
    const waiter = users.find(u => u.id === activeOrder.waiterId);
    
    return {
      orderId: activeOrder.id,
      waiterName: waiter ? waiter.name : activeOrder.waiterId,
      orderValue: activeOrder.totalAmount || 0,
      orderStatus: activeOrder.status,
      items: activeOrder.items || []
    };
  };
  const shortId = (id) => id ? (id.length > 8 ? id.substring(0, 8) + '...' : id) : '-';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Tables Overview</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map(table => {
          const details = getTableDetails(table);
          return (
            <Card 
              key={table.id} 
              className={`cursor-pointer transition-shadow hover:shadow-md ${table.status === 'OCCUPIED' ? 'border-primary/50' : ''}`}
              onClick={() => setSelectedTable(table.id)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-xl font-bold text-text-main">{table.tableNumber || table.id}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  table.status === 'OCCUPIED' ? 'bg-orange-100 text-primary' : 'bg-green-100 text-green-700'
                }`}>
                  {table.status}
                </span>
                
                {details && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1 w-full text-left bg-gray-50 p-2 rounded">
                    <div className="flex justify-between"><span>Ord:</span> <span className="font-mono" title={details.orderId}>{shortId(details.orderId)}</span></div>
                    <div className="flex justify-between"><span>Wtr:</span> <span>{details.waiterName}</span></div>
                    <div className="flex justify-between font-medium"><span>₹</span> <span>{details.orderValue}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTable && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-text-main mb-4">Table Details (Read-Only)</h2>
          <Card>
            <CardContent className="p-6">
              {(() => {
                const table = tables.find(t => t.id === selectedTable);
                const details = getTableDetails(table);
                
                if (table.status !== 'OCCUPIED' || !details) {
                  return <p className="text-gray-500">Table {table.tableNumber || table.id} is currently Available.</p>;
                }

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <h3 className="text-lg font-bold">Table {table.tableNumber || table.id}</h3>
                        <p className="text-sm text-gray-500">Order: {details.orderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">₹{details.orderValue}</p>
                        <p className="text-sm text-gray-500">Status: {details.orderStatus}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {details.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-medium">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
