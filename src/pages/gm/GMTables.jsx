import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/currency';
import { UtensilsCrossed, Receipt, User } from 'lucide-react';

const getSafeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

export function GMTables() {
  const tables = useSelector(state => state.tables?.data || []);
  const orders = useSelector(state => state.orders?.data || []);
  const users = useSelector(state => state.users?.data || []);
  const menuItems = useSelector(state => state.menu?.items || []);
  
  const [selectedTable, setSelectedTable] = useState(null);

  const getTableDetails = (table) => {
    if (table.status !== 'OCCUPIED') return null;
    
    // Find active order for this table
    const activeOrder = orders.find(o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    if (!activeOrder) return null;
    
    const waiter = users.find(u => u.id === activeOrder.waiterId);
    
    return {
      orderId: activeOrder.id,
      orderNumber: activeOrder.orderNumber,
      waiterName: waiter ? waiter.name : (activeOrder.waiterId || 'Unknown'),
      orderValue: getSafeNum(activeOrder.totalAmount || activeOrder.grandTotal),
      orderStatus: activeOrder.status,
      items: activeOrder.items || []
    };
  };

  const shortId = (id) => id ? (id.length > 8 ? id.substring(0, 8) + '...' : id) : '-';

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">
      <PageHeader 
        title="Tables Overview" 
        breadcrumbs="RESTAURANT OPS / TABLES"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted border-2 border-dashed border-border rounded-xl">
            No tables configured in the system.
          </div>
        ) : (
          tables.map(table => {
            const details = getTableDetails(table);
            const isOccupied = table.status === 'OCCUPIED';
            return (
              <Card 
                key={table.id} 
                className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedTable === table.id ? 'ring-2 ring-primary ring-offset-2' : ''} ${isOccupied ? 'border-orange-200 bg-orange-50/10' : 'border-border/50'}`}
                onClick={() => setSelectedTable(table.id)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-3">
                  <span className={`text-2xl font-bold ${isOccupied ? 'text-primary' : 'text-text-main'}`}>
                    {table.tableNumber || table.id}
                  </span>
                  
                  <Badge variant={isOccupied ? 'default' : 'outline'} className={isOccupied ? 'bg-primary' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}>
                    {table.status}
                  </Badge>
                  
                  {details ? (
                    <div className="text-xs text-gray-600 mt-2 space-y-1.5 w-full text-left bg-white p-2.5 rounded-lg border border-orange-100 shadow-sm">
                      <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Ord</span> <span className="font-mono text-[10px] font-bold" title={details.orderId}>{details.orderNumber || shortId(details.orderId)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Staff</span> <span className="truncate max-w-[80px] text-right">{details.waiterName}</span></div>
                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-200 font-semibold text-primary">
                        <span>Total</span> <span>{formatCurrency(details.orderValue)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[76px] w-full mt-2 flex items-center justify-center text-gray-300">
                      <UtensilsCrossed className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedTable && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-text-muted" /> Table Details (Read-Only)
          </h2>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              {(() => {
                const table = tables.find(t => t.id === selectedTable);
                const details = getTableDetails(table);
                
                if (!table || table.status !== 'OCCUPIED' || !details) {
                  return (
                    <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                      <UtensilsCrossed className="w-12 h-12 mb-3 text-emerald-200" />
                      <p className="text-emerald-700 font-medium">Table {table?.tableNumber || selectedTable} is currently Available.</p>
                      <p className="text-sm">No active order to display.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-border/50 pb-6 gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-text-main mb-1">Table {table.tableNumber || table.id}</h3>
                        <p className="text-sm text-text-muted font-mono bg-gray-100 px-2 py-1 rounded inline-block font-bold">Order: {details.orderNumber || details.orderId}</p>
                      </div>
                      <div className="md:text-right bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <p className="text-sm text-text-muted font-medium mb-1 uppercase tracking-wider">Current Bill</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(details.orderValue)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mr-6">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Assigned Staff:</span>
                        <span className="font-semibold">{details.waiterName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Order Status:</span>
                        <Badge variant="outline" className="bg-white">{details.orderStatus?.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-text-main mb-3">Order Items</h4>
                      <div className="border border-border/50 rounded-lg overflow-hidden">
                        {details.items.length === 0 ? (
                          <div className="p-4 text-center text-text-muted text-sm bg-gray-50">No items added to this order yet.</div>
                        ) : (
                          <div className="divide-y divide-border/50">
                            {details.items.map((item, idx) => {
                              const qty = getSafeNum(item.quantity);
                              const prc = getSafeNum(item.unitPrice || item.price);
                              const mItem = menuItems.find(m => m.id === item.menuItemId);
                              const name = mItem ? mItem.name : (item.name || 'Unknown Item');
                              return (
                                <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-sm w-10 text-center">{qty}x</span>
                                    <span className="font-medium text-text-main">{name}</span>
                                  </div>
                                  <span className="font-medium text-text-main">{formatCurrency(qty * prc)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
