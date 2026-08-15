import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export function WaiterDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const orders = useSelector(state => state.orders.data);
  const notifications = useSelector(state => state.notifications.data);

  const myActiveOrders = orders.filter(o => o.waiterId === currentUser?.id && o.status === 'IN_PROGRESS');
  const myTablesCount = new Set(myActiveOrders.map(o => o.tableId)).size;
  
  const readyItemsCount = myActiveOrders.reduce((total, order) => {
    return total + order.items.filter(i => i.status === 'READY').length;
  }, 0);

  const unreadNotificationsCount = notifications.filter(n => n.userId === currentUser?.id && !n.isRead).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Waiter Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/waiter/tables')}>
          <CardHeader><CardTitle>My Tables</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{myTablesCount}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/waiter/orders')}>
          <CardHeader><CardTitle>Active Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{myActiveOrders.length}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/waiter/tables')}>
          <CardHeader><CardTitle>Ready Items</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{readyItemsCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{unreadNotificationsCount}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
