import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { UtensilsCrossed, Receipt, ChefHat, Truck, IndianRupee, ShoppingBag, Clock } from 'lucide-react';

export function GMDashboard() {
  const tables = useSelector(state => state.tables.data) || [];
  const orders = useSelector(state => state.orders.data) || [];
  const kotItems = useSelector(state => state.kot.data) || [];
  const bills = useSelector(state => state.billing.data) || [];
  const payments = useSelector(state => state.payments.data) || [];
  const deliveries = useSelector(state => state.delivery.data) || [];
  const logs = useSelector(state => state.audit.logs) || [];

  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;

  const activeOrders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'NEW' || o.status === 'PREPARING');
  const activeOrdersCount = activeOrders.length;

  const pendingBills = bills.filter(b => b.status === 'PENDING' || b.paymentStatus === 'PENDING').length;

  const kotNew = kotItems.filter(k => k.status === 'NEW').length;
  const kotPreparing = kotItems.filter(k => k.status === 'PREPARING').length;
  const kotReady = kotItems.filter(k => k.status === 'READY').length;

  const takeawayReady = orders.filter(o => o.type === 'TAKEAWAY' && o.status === 'READY').length;
  const deliveriesOut = deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length;

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">GM Command Center</h1>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link to="/gm/tables">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tables</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-main">{occupiedTables} <span className="text-sm font-normal text-gray-500">/ {totalTables}</span></div>
              <p className="text-xs text-gray-500 mt-1">Occupied currently</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/gm/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Orders</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-main">{activeOrdersCount}</div>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/gm/bills">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Bills</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-main">{pendingBills}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-main">₹{totalPaid}</div>
            <p className="text-xs text-gray-500 mt-1">Total Available Paid</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kitchen Status */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Kitchen Operations (KOT)</CardTitle>
            <ChefHat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">New</span>
                <span className="font-medium text-text-main">{kotNew}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Preparing</span>
                <span className="font-medium text-orange-600">{kotPreparing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Ready</span>
                <span className="font-medium text-green-600">{kotReady}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Status */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Fulfillment</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 flex items-center"><ShoppingBag className="w-3 h-3 mr-1"/> Takeaway Ready</span>
                <span className="font-medium text-green-600">{takeawayReady}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 flex items-center"><Truck className="w-3 h-3 mr-1"/> Deliveries Out</span>
                <span className="font-medium text-text-main">{deliveriesOut}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2 h-40 overflow-y-auto pr-2">
              {logs.slice(0, 10).map((log, i) => (
                <div key={i} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-text-main">{log.action}</span>
                    <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>{log.entityType} {log.entityId}</span>
                    <span>{log.userRole || log.userId}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-sm text-gray-500 text-center mt-4">No recent activity</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
