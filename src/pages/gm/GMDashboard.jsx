import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader 
        title="GM Command Center" 
        description="Comprehensive overview of restaurant operations."
      />
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link to="/gm/tables" className="block">
          <MetricCard
            title="Tables Occupied"
            value={`${occupiedTables} / ${totalTables}`}
            icon={UtensilsCrossed}
            className="hover:border-primary/50 cursor-pointer transition-colors border-l-4 border-l-primary"
            subtext="Currently occupied"
          />
        </Link>

        <Link to="/gm/orders" className="block">
          <MetricCard
            title="Active Orders"
            value={activeOrdersCount.toString()}
            icon={Receipt}
            className="hover:border-blue-500/50 cursor-pointer transition-colors border-l-4 border-l-blue-500"
            subtext="In progress"
          />
        </Link>

        <Link to="/gm/bills" className="block">
          <MetricCard
            title="Pending Bills"
            value={pendingBills.toString()}
            icon={Clock}
            className="hover:border-orange-500/50 cursor-pointer transition-colors border-l-4 border-l-orange-500"
            subtext="Awaiting payment"
          />
        </Link>

        <MetricCard
          title="Revenue (Paid)"
          value={`₹${totalPaid.toFixed(2)}`}
          icon={IndianRupee}
          className="border-l-4 border-l-green-500"
          subtext="Total collected"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kitchen Status */}
        <Card>
          <div className="p-5 border-b border-border/60 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main flex items-center">
              <ChefHat className="w-5 h-5 mr-2 text-primary" /> Kitchen KOT
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="flex justify-between items-center p-3 bg-white border border-border/50 rounded-lg shadow-sm">
                <span className="text-sm font-semibold text-text-muted">New</span>
                <span className="text-xl font-black text-text-main">{kotNew}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
                <span className="text-sm font-semibold text-orange-800">Preparing</span>
                <span className="text-xl font-black text-orange-600">{kotPreparing}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg shadow-sm">
                <span className="text-sm font-semibold text-green-800">Ready</span>
                <span className="text-xl font-black text-green-600">{kotReady}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Status */}
        <Card>
          <div className="p-5 border-b border-border/60 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main flex items-center">
              <Truck className="w-5 h-5 mr-2 text-primary" /> Fulfillment
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="flex justify-between items-center p-4 bg-white border border-border/50 rounded-xl shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-1.5 text-status-success"/> Takeaway Ready
                  </span>
                  <span className="text-xs text-text-muted mt-1">Waiting for customer</span>
                </div>
                <span className="text-2xl font-black text-status-success">{takeawayReady}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white border border-border/50 rounded-xl shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main flex items-center">
                    <Truck className="w-4 h-4 mr-1.5 text-blue-500"/> Deliveries Out
                  </span>
                  <span className="text-xs text-text-muted mt-1">En route to customer</span>
                </div>
                <span className="text-2xl font-black text-blue-600">{deliveriesOut}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="p-5 border-b border-border/60 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" /> Recent Activity
            </h2>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 h-[300px] overflow-y-auto custom-scrollbar">
              {logs.slice(0, 10).map((log, i) => (
                <div key={i} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-text-main text-sm">{log.action}</span>
                    <span className="text-xs font-semibold text-text-muted bg-gray-100 px-2 py-0.5 rounded">
                      {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted flex justify-between items-center mt-2">
                    <span className="bg-gray-100 px-2 py-1 rounded text-text-main font-medium border border-border/50">
                      {log.entityType} #{log.entityId}
                    </span>
                    <span className="font-semibold">{log.userRole || log.userId}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-8 text-center text-text-muted">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
