import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/Card';
import { FileText, DollarSign, Activity, CheckCircle } from 'lucide-react';

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

  const stats = [
    {
      title: "Bill Requests",
      value: pendingBills.length.toString(),
      icon: <FileText className="w-6 h-6 text-primary" />,
      color: "border-primary"
    },
    {
      title: "Today's Bills",
      value: bills.length.toString(),
      icon: <Activity className="w-6 h-6 text-blue-500" />,
      color: "border-blue-500"
    },
    {
      title: "Today's Payments",
      value: todayPayments.length.toString(),
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      color: "border-green-500"
    },
    {
      title: "Total Collected",
      value: `₹${totalCollected.toFixed(2)}`,
      icon: <DollarSign className="w-6 h-6 text-purple-500" />,
      color: "border-purple-500"
    },
    {
      title: "Takeaway Active",
      value: activeTakeaway.toString(),
      icon: <Activity className="w-6 h-6 text-orange-500" />,
      color: "border-orange-500"
    },
    {
      title: "Ready for Pickup",
      value: readyTakeaway.toString(),
      icon: <CheckCircle className="w-6 h-6 text-teal-500" />,
      color: "border-teal-500"
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Cashier Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className={`border-t-4 ${stat.color}`}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-text-main">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full bg-gray-50`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access Pending Bills */}
      <div>
        <h2 className="text-lg font-bold text-text-main mb-4 mt-8">Recent Bill Requests</h2>
        {pendingBills.length === 0 ? (
          <div className="text-text-muted">No pending requests</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBills.slice(0, 4).map(bill => (
              <Card key={bill.id} className="border border-border">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-primary">{bill.billNumber}</p>
                    <p className="text-sm text-text-muted mt-1">₹{bill.grandTotal.toFixed(2)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bill.status === 'REQUESTED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {bill.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
