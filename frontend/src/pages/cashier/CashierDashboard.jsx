import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
import { FileText, DollarSign, Activity, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function CashierDashboard() {
  const bills = useSelector(state => state.billing.data);
  const payments = useSelector(state => state.payments.data);
  const orders = useSelector(state => state.orders.data);
  const kots = useSelector(state => state.kot.data);

  // Today's metrics (for simplicity, using all time for V1 demo unless we filter by date)
  const pendingBills = bills.filter(b => b.status === 'REQUESTED' || b.status === 'PRINTED');
  const todayPayments = payments; // In a real app, filter by today

  const totalCollected = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const takeawayOrders = orders.filter(o => o.orderType === 'TAKEAWAY');
  const activeTakeaway = takeawayOrders.filter(o => o.status === 'IN_PROGRESS' && kots.some(k => k.orderId === o.id && k.status !== 'READY')).length;
  const readyTakeaway = takeawayOrders.filter(o => o.status === 'IN_PROGRESS' && kots.some(k => k.orderId === o.id && k.status === 'READY')).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Cashier Dashboard" 
        description="Overview of billing, payments, and active takeaway orders."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Bill Requests"
          value={pendingBills.length.toString()}
          icon={FileText}
          className={cn("border-l-4", pendingBills.length > 0 ? "border-l-status-warning" : "border-l-status-success")}
        />
        <MetricCard
          title="Today's Bills"
          value={bills.length.toString()}
          icon={Activity}
          className="border-l-4 border-l-blue-500"
        />
        <MetricCard
          title="Today's Payments"
          value={todayPayments.length.toString()}
          icon={CheckCircle}
          className="border-l-4 border-l-status-success"
        />
        <MetricCard
          title="Total Collected"
          value={`₹${totalCollected.toFixed(2)}`}
          icon={DollarSign}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Access Pending Bills */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-border/60 bg-gray-50/50">
            <h2 className="text-lg font-bold text-text-main">Recent Bill Requests</h2>
          </div>
          <CardContent className="p-0">
            {pendingBills.length === 0 ? (
              <div className="p-12 text-center text-text-muted">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {pendingBills.slice(0, 6).map(bill => (
                  <div key={bill.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-text-main flex items-center gap-2">
                        {bill.billNumber}
                        <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded">Table {bill.tableId}</span>
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">₹{bill.grandTotal.toFixed(2)}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full shadow-sm tracking-wider uppercase", 
                      bill.status === 'REQUESTED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {bill.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Takeaway Summary */}
        <Card>
          <div className="p-6 border-b border-border/60 bg-gray-50/50">
            <h2 className="text-lg font-bold text-text-main">Takeaway Pulse</h2>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div>
                <p className="text-sm font-semibold text-orange-800">Active Orders</p>
                <p className="text-xs text-orange-600 mt-1">Currently in kitchen</p>
              </div>
              <span className="text-2xl font-black text-orange-600">{activeTakeaway}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
              <div>
                <p className="text-sm font-semibold text-green-800">Ready for Pickup</p>
                <p className="text-xs text-green-600 mt-1">Waiting for customer</p>
              </div>
              <span className="text-2xl font-black text-green-600">{readyTakeaway}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
