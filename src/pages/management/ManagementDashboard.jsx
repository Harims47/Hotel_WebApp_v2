import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, Receipt, XCircle, Percent, Calculator,
  ChefHat, Truck, UtensilsCrossed, Activity, BarChart2
} from 'lucide-react';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getDateBounds(preset, from, to) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (preset === 'ALL') return { from: '1900-01-01', to: '2999-12-31' };
  if (preset === 'TODAY') return { from: todayStr, to: todayStr };
  if (preset === 'YESTERDAY') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const s = y.toISOString().split('T')[0];
    return { from: s, to: s };
  }
  if (preset === 'THIS_WEEK') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return { from: start.toISOString().split('T')[0], to: todayStr };
  }
  if (preset === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString().split('T')[0], to: todayStr };
  }
  return { from: from || todayStr, to: to || todayStr };
}

function inRange(dateStr, from, to) {
  if (!dateStr) return false;
  const d = dateStr.split('T')[0];
  return d >= from && d <= to;
}

// Simple horizontal bar chart (CSS only)
function BarRow({ label, value, max, color = 'bg-primary', secondaryLabel }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-text-main">{label}</span>
        <span className="text-text-muted">{secondaryLabel ?? value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function ManagementDashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ preset: 'TODAY', from: today, to: today });

  const bills     = useSelector(s => s.billing.data)       || [];
  const orders    = useSelector(s => s.orders.data)        || [];
  const payments  = useSelector(s => s.payments.data)      || [];
  const kots      = useSelector(s => s.kot.data)           || [];
  const deliveries= useSelector(s => s.delivery.data)      || [];
  const tables    = useSelector(s => s.tables.data)        || [];
  const logs      = useSelector(s => s.audit.logs)         || [];
  const invStock  = useSelector(s => s.invStock.data)      || [];
  const invItems  = useSelector(s => s.invItems.data)      || [];
  const purchaseOrders = useSelector(s => s.purchaseOrders.data) || [];
  const reimbursements = useSelector(s => s.reimbursements.data) || [];

  const { from, to } = getDateBounds(dateRange.preset, dateRange.from, dateRange.to);

  const fBills     = useMemo(() => bills.filter(b => inRange(b.createdAt, from, to)), [bills, from, to]);
  const fOrders    = useMemo(() => orders.filter(o => inRange(o.createdAt, from, to)), [orders, from, to]);
  const fPayments  = useMemo(() => payments.filter(p => inRange(p.createdAt, from, to)), [payments, from, to]);
  const fKots      = useMemo(() => kots.filter(k => inRange(k.createdAt, from, to)), [kots, from, to]);
  const fDeliveries= useMemo(() => deliveries.filter(d => inRange(d.createdAt, from, to)), [deliveries, from, to]);
  const fLogs      = useMemo(() => logs.filter(l => inRange(l.timestamp, from, to)), [logs, from, to]);

  // --- SALES ---
  const grossSales  = useMemo(() => fBills.reduce((s, b) => s + (b.subtotal || 0), 0), [fBills]);
  const discounts   = useMemo(() => fBills.reduce((s, b) => s + (b.discountAmount || 0), 0), [fBills]);
  const taxCollected= useMemo(() => fBills.reduce((s, b) => s + (b.taxAmount || 0), 0), [fBills]);
  const netSales    = useMemo(() => fBills.reduce((s, b) => s + (b.grandTotal || 0), 0), [fBills]);
  const paidAmt     = useMemo(() => fPayments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount || 0), 0), [fPayments]);
  const pendingAmt  = Math.max(0, netSales - paidAmt);

  // --- ORDERS ---
  const orderTotal  = fOrders.length;
  const cancelledOrders = fOrders.filter(o => o.status === 'CANCELLED').length;
  const aov = orderTotal > 0 ? netSales / orderTotal : 0;

  const getTypeStats = (type) => {
    const list = fOrders.filter(o => o.type === type);
    const amt  = list.reduce((s, o) => {
      const bill = fBills.find(b => b.orderId === o.id);
      return s + (bill?.grandTotal || 0);
    }, 0);
    return { count: list.length, amount: amt };
  };
  const dineIn   = useMemo(() => getTypeStats('DINE_IN'),   [fOrders, fBills]);
  const takeaway = useMemo(() => getTypeStats('TAKEAWAY'),  [fOrders, fBills]);
  const delivery = useMemo(() => getTypeStats('DELIVERY'),  [fOrders, fBills]);
  const phone    = useMemo(() => getTypeStats('PHONE'),     [fOrders, fBills]);

  // --- PAYMENTS ---
  const getMethodStats = (method) => {
    const list = fPayments.filter(p => p.method === method && p.status === 'PAID');
    return { count: list.length, amount: list.reduce((s, p) => s + (p.amount || 0), 0) };
  };
  const cash = useMemo(() => getMethodStats('CASH'), [fPayments]);
  const upi  = useMemo(() => getMethodStats('UPI'),  [fPayments]);
  const card = useMemo(() => getMethodStats('CARD'), [fPayments]);

  // --- KOT ---
  const kotNew       = fKots.filter(k => k.status === 'NEW').length;
  const kotPreparing = fKots.filter(k => k.status === 'PREPARING').length;
  const kotReady     = fKots.filter(k => k.status === 'READY').length;
  const kotCompleted = fKots.filter(k => k.status === 'COMPLETED').length;
  const kotCancelled = fKots.filter(k => k.status === 'CANCELLED').length;

  // --- DELIVERY ---
  const delTotal     = fDeliveries.length;
  const delPending   = fDeliveries.filter(d => d.status === 'PENDING').length;
  const delAssigned  = fDeliveries.filter(d => d.status === 'ASSIGNED').length;
  const delPickedUp  = fDeliveries.filter(d => d.status === 'PICKED_UP').length;
  const delOut       = fDeliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length;
  const delDelivered = fDeliveries.filter(d => d.status === 'DELIVERED').length;

  // --- TABLES ---
  const totalTables    = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
  const availableTables= tables.filter(t => t.status === 'AVAILABLE').length;

  // --- INVENTORY COMPACT ---
  // Low stock based on invStock vs invItems minStockLevel
  const lowStockCount = useMemo(() => {
    return invStock.filter(s => {
      const item = invItems.find(i => i.id === s.itemId);
      return item && s.quantity <= (item.minStockLevel || 0);
    }).length;
  }, [invStock, invItems]);
  const pendingPOs     = purchaseOrders.filter(p => p.status === 'PENDING' || p.status === 'DRAFT').length;
  const pendingReimb   = reimbursements.filter(r => r.status === 'PENDING').length;
  const approvedReimb  = reimbursements.filter(r => r.status === 'APPROVED').length;

  const orderMax = Math.max(dineIn.count, takeaway.count, delivery.count, phone.count, 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header + Date filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-border/50">
        <PageHeader
          title="Management Dashboard"
          description="Operational command center — read-only view."
        />
        <DateRangeFilter value={dateRange} onChange={setDateRange} className="shrink-0" />
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard title="Net Sales" value={fmt(netSales)} icon={IndianRupee} className="border-l-4 border-l-green-500" />
        <MetricCard title="Total Orders" value={orderTotal} icon={Receipt} className="border-l-4 border-l-blue-500" />
        <MetricCard title="Avg Order Value" value={fmt(aov)} icon={Calculator} />
        <MetricCard title="Cancelled Orders" value={cancelledOrders} icon={XCircle} className="border-l-4 border-l-red-500" />
        <MetricCard title="Discounts Given" value={fmt(discounts)} icon={Percent} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT — Sales + Orders + Payments */}
        <div className="xl:col-span-2 space-y-6">
          {/* SALES ANALYSIS */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50">
              <CardTitle className="flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-text-muted mb-1">Gross Sales (subtotal)</p>
                  <p className="text-xl font-bold text-text-main">{fmt(grossSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Discounts (−)</p>
                  <p className="text-xl font-bold text-red-500">{fmt(discounts)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Tax (+)</p>
                  <p className="text-xl font-bold text-text-main">{fmt(taxCollected)}</p>
                </div>
                <div className="col-span-2 md:col-span-1 bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs text-green-700 mb-1 font-semibold">Net Sales (grandTotal)</p>
                  <p className="text-2xl font-black text-green-700">{fmt(netSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Collected (Paid)</p>
                  <p className="text-xl font-bold text-green-600">{fmt(paidAmt)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Pending Collection</p>
                  <p className="text-xl font-bold text-orange-500">{fmt(pendingAmt)}</p>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-4 pt-3 border-t border-border/30">
                Formula: Gross − Discount + Tax = Net Sales
              </p>
            </CardContent>
          </Card>

          {/* ORDERS + PAYMENTS CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-gray-50/50 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base"><BarChart2 className="w-4 h-4" /> Orders by Type</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {orderTotal === 0 ? (
                  <p className="text-center text-text-muted py-6 text-sm">No orders in this period</p>
                ) : (
                  <>
                    <BarRow label="Dine-In" value={dineIn.count} max={orderMax} color="bg-blue-500" secondaryLabel={`${dineIn.count} orders · ${fmt(dineIn.amount)}`} />
                    <BarRow label="Takeaway" value={takeaway.count} max={orderMax} color="bg-green-500" secondaryLabel={`${takeaway.count} orders · ${fmt(takeaway.amount)}`} />
                    <BarRow label="Delivery" value={delivery.count} max={orderMax} color="bg-purple-500" secondaryLabel={`${delivery.count} orders · ${fmt(delivery.amount)}`} />
                    <BarRow label="Phone" value={phone.count} max={orderMax} color="bg-orange-500" secondaryLabel={`${phone.count} orders · ${fmt(phone.amount)}`} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gray-50/50 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base"><IndianRupee className="w-4 h-4" /> Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {paidAmt === 0 ? (
                  <p className="text-center text-text-muted py-6 text-sm">No payments in this period</p>
                ) : (
                  <>
                    <BarRow label="Cash" value={cash.amount} max={paidAmt} color="bg-emerald-500" secondaryLabel={`${fmt(cash.amount)} (${cash.count})`} />
                    <BarRow label="UPI" value={upi.amount} max={paidAmt} color="bg-blue-500" secondaryLabel={`${fmt(upi.amount)} (${upi.count})`} />
                    <BarRow label="Card" value={card.amount} max={paidAmt} color="bg-indigo-500" secondaryLabel={`${fmt(card.amount)} (${card.count})`} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Tables, KOT, Delivery, Inventory */}
        <div className="space-y-6">
          {/* TABLES */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
              <CardTitle className="text-base flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Tables</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-text-muted">Total</p>
                <p className="text-lg font-bold">{totalTables}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2">
                <p className="text-xs text-orange-700">Occupied</p>
                <p className="text-lg font-bold text-orange-700">{occupiedTables}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-green-700">Available</p>
                <p className="text-lg font-bold text-green-700">{availableTables}</p>
              </div>
            </CardContent>
          </Card>

          {/* KOT */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
              <CardTitle className="text-base flex items-center gap-2"><ChefHat className="w-4 h-4" /> KOT Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                { label: 'New', count: kotNew, cls: 'text-text-main' },
                { label: 'Preparing', count: kotPreparing, cls: 'text-orange-600' },
                { label: 'Ready', count: kotReady, cls: 'text-green-600' },
                { label: 'Completed', count: kotCompleted, cls: 'text-text-muted' },
                { label: 'Cancelled', count: kotCancelled, cls: 'text-red-500' },
              ].map(({ label, count, cls }) => (
                <div key={label} className="flex justify-between items-center text-sm py-1 border-b border-border/20 last:border-0">
                  <span className="text-text-muted">{label}</span>
                  <span className={`font-bold ${cls}`}>{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* DELIVERY */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
              <CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" /> Delivery Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-3 text-center">
              {[
                { label: 'Total', count: delTotal, cls: 'bg-gray-50' },
                { label: 'Pending', count: delPending, cls: 'bg-blue-50 text-blue-700' },
                { label: 'Assigned', count: delAssigned, cls: 'bg-yellow-50 text-yellow-700' },
                { label: 'Out', count: delOut, cls: 'bg-orange-50 text-orange-700' },
                { label: 'Picked Up', count: delPickedUp, cls: 'bg-purple-50 text-purple-700' },
                { label: 'Delivered', count: delDelivered, cls: 'bg-green-50 text-green-700' },
              ].map(({ label, count, cls }) => (
                <div key={label} className={`rounded-lg p-2 ${cls}`}>
                  <p className="text-xs">{label}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* INVENTORY SUMMARY */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Inventory</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/dashboard')} className="text-xs">
                  View →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                { label: 'Low Stock Items', count: lowStockCount, cls: lowStockCount > 0 ? 'text-red-500' : 'text-text-main' },
                { label: 'Pending POs', count: pendingPOs, cls: 'text-orange-600' },
                { label: 'Pending Reimbursements', count: pendingReimb, cls: 'text-orange-600' },
                { label: 'Approved (Unpaid)', count: approvedReimb, cls: 'text-text-main' },
              ].map(({ label, count, cls }) => (
                <div key={label} className="flex justify-between items-center text-sm py-1 border-b border-border/20 last:border-0">
                  <span className="text-text-muted">{label}</span>
                  <span className={`font-bold ${cls}`}>{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Staff Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/management/reports')}>View Full Report →</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User / Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-text-muted py-8">No activity in this period.</TableCell>
                </TableRow>
              ) : (
                [...fLogs].reverse().slice(0, 15).map((log, i) => (
                  <TableRow key={log.id || i}>
                    <TableCell className="text-xs text-text-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userId}</div>
                      <div className="text-xs text-text-muted">{log.userRole}</div>
                    </TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="text-xs font-mono text-text-muted">
                      {log.entityType} {log.entityId ? `#${String(log.entityId).slice(0, 8)}` : ''}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
