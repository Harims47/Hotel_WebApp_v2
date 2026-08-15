import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function WaiterOrders() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const orders = useSelector(state => state.orders.data);
  const tables = useSelector(state => state.tables.data);
  const menuItems = useSelector(state => state.menu.items);
  const bills = useSelector(state => state.billing.data);
  const payments = useSelector(state => state.payments.data);

  // Show all active or today's orders (for simplicity, we'll show everything for this waiter)
  const myOrders = orders.filter(o => o.waiterId === currentUser?.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">My Orders</h1>
      
      {myOrders.length === 0 ? (
        <div className="text-text-muted">You have no orders.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myOrders.map(order => {
            const table = tables.find(t => t.id === order.tableId);
            const bill = bills.find(b => b.orderId === order.id);
            const payment = bill ? payments.find(p => p.billId === bill.id) : null;
            
            return (
              <Card key={order.id} className="border-t-4 border-t-primary flex flex-col h-full">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-primary">{order.orderNumber}</CardTitle>
                      <p className="text-sm font-semibold text-text-main mt-1">Table {table?.tableNumber || 'Unknown'}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={order.status === 'IN_PROGRESS' ? 'primary' : order.status === 'CLOSED' ? 'default' : 'warning'}>
                        {order.status}
                      </Badge>
                      {bill && (
                        <span className="text-xs font-semibold text-text-muted">{bill.billNumber}</span>
                      )}
                      {payment && (
                        <span className="text-xs font-bold text-green-600">PAID</span>
                      )}
                      {!payment && bill && (
                        <span className="text-xs font-bold text-orange-500">PENDING</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-text-muted mt-2">
                    {order.orderType} • {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-4">
                  <div className="space-y-3 flex-1 mb-6">
                    {order.items.map(oi => {
                      const menuItem = menuItems.find(m => m.id === oi.menuItemId);
                      return (
                        <div key={oi.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-text-main text-sm">
                              {menuItem?.name} <span className="text-text-muted">×{oi.quantity}</span>
                            </p>
                          </div>
                          <Badge 
                            variant={
                              oi.status === 'READY' ? 'success' : 
                              oi.status === 'PREPARING' ? 'warning' : 
                              oi.status === 'SERVED' ? 'default' : 'primary'
                            }
                          >
                            {oi.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate(`/waiter/tables/${order.tableId}`)}
                    disabled={order.status === 'CLOSED'}
                  >
                    View Order
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
