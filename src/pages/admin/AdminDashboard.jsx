import React from 'react';
import { useSelector } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
import { Users, Grid, UtensilsCrossed, Settings2, Receipt, CreditCard } from 'lucide-react';
import { cn } from '../../utils/cn';

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
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Super Admin Dashboard" 
        description="System configuration and global settings overview."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Active Users"
          value={activeUsers.toString()}
          icon={Users}
          className="border-l-4 border-l-blue-500"
          subtext={`Out of ${users.length} total`}
        />
        
        <MetricCard
          title="Active Tables"
          value={activeTables.toString()}
          icon={Grid}
          className="border-l-4 border-l-green-500"
          subtext={`Out of ${tables.length} total`}
        />
        
        <MetricCard
          title="Menu Items"
          value={activeItems.toString()}
          icon={UtensilsCrossed}
          className="border-l-4 border-l-orange-500"
          subtext={`Across ${activeCategories} categories`}
        />
        
        <MetricCard
          title="Tax Configuration"
          value={restaurantSettings.taxEnabled !== false ? `${restaurantSettings.taxRate}%` : 'Disabled'}
          icon={Receipt}
          className={cn("border-l-4", restaurantSettings.taxEnabled !== false ? "border-l-purple-500" : "border-l-gray-400")}
          subtext="Global tax rate"
        />

        <MetricCard
          title="Payment Methods"
          value={paymentMethodsList.length.toString()}
          icon={CreditCard}
          className="border-l-4 border-l-indigo-500"
          subtext={activePaymentMethods}
        />
        
        <MetricCard
          title="System Settings"
          value="Healthy"
          icon={Settings2}
          className="border-l-4 border-l-status-success"
          subtext="All services running"
        />
      </div>
    </div>
  );
}
