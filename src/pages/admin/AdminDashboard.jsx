import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function AdminDashboard() {
  const users = useSelector(state => state.users.data) || [];
  const tables = useSelector(state => state.tables.data) || [];
  const menuCategories = useSelector(state => state.menu.categories) || [];
  const menuItems = useSelector(state => state.menu.items) || [];
  
  const restaurantSettings = useSelector(state => state.restaurant.data?.settings) || {
    taxRate: 5,
    taxEnabled: true,
    paymentMethods: { CASH: true, UPI: true }
  };

  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const activeTables = tables.filter(t => t.configStatus !== 'INACTIVE').length;
  const activeItems = menuItems.filter(m => m.status === 'ACTIVE' || m.status === undefined).length;
  const activeCategories = menuCategories.filter(c => c.status === 'ACTIVE' || c.status === undefined).length;

  const paymentMethodsList = [];
  if (restaurantSettings.paymentMethods?.CASH) paymentMethodsList.push('Cash');
  if (restaurantSettings.paymentMethods?.UPI) paymentMethodsList.push('UPI');
  const activePaymentMethods = paymentMethodsList.join(', ') || 'None';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardTitle>Active Users</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{activeUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Tables</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{activeTables}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Menu Items</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{activeItems}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Menu Categories</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{activeCategories}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tax %</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {restaurantSettings.taxEnabled !== false ? `${restaurantSettings.taxRate}%` : 'Disabled'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Payment Methods</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-primary mt-2">{activePaymentMethods}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
