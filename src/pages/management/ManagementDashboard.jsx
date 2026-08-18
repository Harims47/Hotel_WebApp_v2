import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee, Receipt, XCircle, Percent, Calculator,
  ChefHat, Truck, UtensilsCrossed, Activity, AlertCircle, ShoppingBag, BarChart2
} from 'lucide-react';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const getSafeNum = (v) => {
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

const formatCurrency = (n) => `₹${getSafeNum(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (n) => getSafeNum(n).toLocaleString('en-IN');
const shortId = (id) => {
  if (!id) return '-';
  const str = String(id);
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length >= 2) {
      return `${parts[0].toUpperCase()}-${parts[1].substring(0, 4).toUpperCase()}`;
    }
  }
  return str.substring(0, 8).toUpperCase();
};

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

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function ManagementDashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ preset: 'TODAY', from: today, to: today });

  const bills = useSelector(s => s.billing.data) || [];
  const orders = useSelector(s => s.orders.data) || [];
  const payments = useSelector(s => s.payments.data) || [];
  const kots = useSelector(s => s.kot.data) || [];
  const deliveries = useSelector(s => s.delivery.data) || [];
  const tables = useSelector(s => s.tables.data) || [];
  const logs = useSelector(s => s.audit.logs) || [];
  const invStock = useSelector(s => s.invStock.data) || [];
  const invItems = useSelector(s => s.invItems.data) || [];
  const purchaseOrders = useSelector(s => s.purchaseOrders.data) || [];
  const reimbursements = useSelector(s => s.reimbursements.data) || [];
  const users = useSelector(s => s.users.data) || [];

  const getUserName = (id) => users.find(u => u.id === id)?.name || id;

  const { from, to } = getDateBounds(dateRange.preset, dateRange.from, dateRange.to);

  const fBills = useMemo(() => (bills || []).filter(b => inRange(b.createdAt, from, to)), [bills, from, to]);
  const fOrders = useMemo(() => (orders || []).filter(o => inRange(o.createdAt, from, to)), [orders, from, to]);
  const fPayments = useMemo(() => (payments || []).filter(p => inRange(p.createdAt, from, to)), [payments, from, to]);
  const fKots = useMemo(() => (kots || []).filter(k => inRange(k.createdAt, from, to)), [kots, from, to]);
  const fDeliveries = useMemo(() => (deliveries || []).filter(d => inRange(d.createdAt, from, to)), [deliveries, from, to]);
  const fLogs = useMemo(() => (logs || []).filter(l => inRange(l.timestamp, from, to)), [logs, from, to]);

  // --- SALES ---
  const grossSales = useMemo(() => fBills.reduce((s, b) => s + getSafeNum(b.subtotal), 0), [fBills]);
  const discounts = useMemo(() => fBills.reduce((s, b) => s + getSafeNum(b.discountAmount), 0), [fBills]);
  const taxCollected = useMemo(() => fBills.reduce((s, b) => s + getSafeNum(b.taxAmount), 0), [fBills]);
  const netSales = useMemo(() => fBills.reduce((s, b) => s + getSafeNum(b.grandTotal), 0), [fBills]);
  const paidAmt = useMemo(() => fPayments.filter(p => p.status === 'PAID').reduce((s, p) => s + getSafeNum(p.amount), 0), [fPayments]);
  const pendingAmt = Math.max(0, netSales - paidAmt);

  // --- ORDERS ---
  const orderTotal = fOrders.length;
  const cancelledOrders = fOrders.filter(o => o.status === 'CANCELLED').length;
  const aov = orderTotal > 0 ? (netSales / orderTotal) : 0;

  const getTypeStats = (type) => {
    const list = fOrders.filter(o => o.type === type);
    return { name: type.replace('_', ' '), value: list.length };
  };
  const typeData = useMemo(() => [
    getTypeStats('DINE_IN'), getTypeStats('TAKEAWAY'), getTypeStats('DELIVERY'), getTypeStats('PHONE')
  ].filter(d => d.value > 0), [fOrders]);

  // --- PAYMENTS ---
  const paymentData = useMemo(() => {
    const list = fPayments.filter(p => p.status === 'PAID');
    const getAmt = (method) => list.filter(p => p.method === method).reduce((s, p) => s + getSafeNum(p.amount), 0);
    return [
      { name: 'Cash', value: getAmt('CASH') },
      { name: 'UPI', value: getAmt('UPI') },
      { name: 'Card', value: getAmt('CARD') }
    ].filter(d => d.value > 0);
  }, [fPayments]);

  // --- KOT ---
  const kotNew = fKots.filter(k => k.status === 'NEW').length;
  const kotPreparing = fKots.filter(k => k.status === 'PREPARING').length;
  const kotReady = fKots.filter(k => k.status === 'READY').length;
  const kotCompleted = fKots.filter(k => k.status === 'COMPLETED').length;
  const kotCancelled = fKots.filter(k => k.status === 'CANCELLED').length;

  // --- DELIVERY ---
  const delTotal = fDeliveries.length;
  const delPending = fDeliveries.filter(d => d.status === 'PENDING').length;
  const delAssigned = fDeliveries.filter(d => d.status === 'ASSIGNED').length;
  const delPickedUp = fDeliveries.filter(d => d.status === 'PICKED_UP').length;
  const delOut = fDeliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length;
  const delDelivered = fDeliveries.filter(d => d.status === 'DELIVERED').length;

  // --- TABLES ---
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
  const availableTables = tables.filter(t => t.status === 'AVAILABLE').length;

  // --- INVENTORY COMPACT ---
  const lowStockCount = useMemo(() => {
    return invStock.filter(s => {
      const item = invItems.find(i => i.id === s.itemId);
      return item && s.quantity <= getSafeNum(item.minStockLevel);
    }).length;
  }, [invStock, invItems]);
  const pendingPOs = purchaseOrders.filter(p => p.status === 'PENDING' || p.status === 'DRAFT').length;
  const pendingReimb = reimbursements.filter(r => r.status === 'PENDING').length;
  const approvedReimb = reimbursements.filter(r => r.status === 'APPROVED').length;

  const alertsCount = lowStockCount + pendingPOs + delPending;

  // --- TREND DATA ---
  const trendData = useMemo(() => {
    const dates = {};
    fBills.forEach(b => {
      const dateStr = b.createdAt?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, sales: 0, orders: 0 };
      dates[dateStr].sales += getSafeNum(b.grandTotal);
    });
    fOrders.forEach(o => {
      const dateStr = o.createdAt?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, sales: 0, orders: 0 };
      dates[dateStr].orders += 1;
    });
    
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [fBills, fOrders]);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      {/* Header + Date filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-border/50">
        <PageHeader
          title="Management Dashboard"
          description="Operational command center — read-only view."
          className="mb-0"
        />
        <DateRangeFilter value={dateRange} onChange={setDateRange} className="shrink-0" />
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <MetricCard label="Today's Sales" value={formatCurrency(netSales)} icon={IndianRupee} className="border-l-4 border-l-green-500" />
        <MetricCard label="Total Orders" value={formatNumber(orderTotal)} icon={Receipt} className="border-l-4 border-l-blue-500" />
        <MetricCard label="Avg Order Value" value={formatCurrency(aov)} icon={Calculator} />
        <MetricCard label="Pending Bills" value={formatCurrency(pendingAmt)} icon={ShoppingBag} className="border-l-4 border-l-orange-500" />
        <MetricCard label="Pending Deliveries" value={formatNumber(delPending)} icon={Truck} />
        <MetricCard label="Operational Alerts" value={formatNumber(alertsCount)} icon={AlertCircle} className={alertsCount > 0 ? "border-l-4 border-l-red-500" : ""} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT — Sales + Orders + Payments */}
        <div className="xl:col-span-2 space-y-6">
          {/* SALES ANALYSIS */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-base"><IndianRupee className="w-4 h-4" /> Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-text-muted mb-1">Gross Sales</p>
                  <p className="text-xl font-bold text-text-main">{formatCurrency(grossSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Discounts (−)</p>
                  <p className="text-xl font-bold text-red-500">{formatCurrency(discounts)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Tax (+)</p>
                  <p className="text-xl font-bold text-text-main">{formatCurrency(taxCollected)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Collected (Paid)</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(paidAmt)}</p>
                </div>
                <div className="col-span-2 md:col-span-4 bg-green-50 rounded-xl p-4 border border-green-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 font-semibold mb-1">Net Sales</p>
                    <p className="text-3xl font-black text-green-700">{formatCurrency(netSales)}</p>
                  </div>
                  <p className="text-xs text-green-800/60 hidden md:block">
                    Formula: Gross − Discount + Tax = Net Sales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TRENDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
                <CardTitle className="flex items-center gap-2 text-base"><BarChart2 className="w-4 h-4" /> Sales Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-64">
                {trendData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} width={80} />
                      <RechartsTooltip 
                        formatter={(value) => [formatCurrency(value), 'Sales']}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
                <CardTitle className="flex items-center gap-2 text-base"><Receipt className="w-4 h-4" /> Orders by Type</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-64">
                {typeData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [formatNumber(value), 'Orders']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {paymentData.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
                  <CardTitle className="flex items-center gap-2 text-base"><IndianRupee className="w-4 h-4" /> Payment Methods (Collected)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} width={60} />
                      <RechartsTooltip 
                        formatter={(value) => [formatCurrency(value), 'Amount']}
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-border/50 flex flex-row items-center justify-between py-4">
              <CardTitle className="flex items-center gap-2 text-base"><Activity className="w-4 h-4" /> Recent Staff Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/management/reports')} className="h-8">View Full Report →</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/30">
                    <TableHead className="whitespace-nowrap">Time</TableHead>
                    <TableHead className="whitespace-nowrap">User / Role</TableHead>
                    <TableHead className="whitespace-nowrap">Action</TableHead>
                    <TableHead className="whitespace-nowrap">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-text-muted py-12">No activity in this period.</TableCell>
                    </TableRow>
                  ) : (
                    [...fLogs].reverse().slice(0, 15).map((log, i) => (
                      <TableRow key={log.id || i} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="text-xs text-text-muted whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm font-medium text-text-main">{getUserName(log.userId)}</div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mt-0.5">{log.userRole?.replace(/_/g, ' ')}</div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          <Badge variant="outline" className="bg-white text-gray-700 shadow-sm font-normal">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-muted whitespace-nowrap">
                          {log.entityType} {log.entityId ? `#${shortId(log.entityId)}` : ''}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR — Tables, KOT, Delivery, Inventory */}
        <div className="space-y-6">
          {/* TABLES */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
              <CardTitle className="text-base flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Tables</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <p className="text-xs text-text-muted">Total</p>
                <p className="text-lg font-bold text-gray-700">{formatNumber(totalTables)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                <p className="text-xs text-orange-700">Occupied</p>
                <p className="text-lg font-bold text-orange-700">{formatNumber(occupiedTables)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                <p className="text-xs text-green-700">Available</p>
                <p className="text-lg font-bold text-green-700">{formatNumber(availableTables)}</p>
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
                  <span className={`font-bold ${cls}`}>{formatNumber(count)}</span>
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
                { label: 'Total', count: delTotal, cls: 'bg-gray-50 border border-gray-100 text-gray-700' },
                { label: 'Pending', count: delPending, cls: 'bg-blue-50 text-blue-700 border border-blue-100' },
                { label: 'Assigned', count: delAssigned, cls: 'bg-yellow-50 text-yellow-700 border border-yellow-100' },
                { label: 'Out', count: delOut, cls: 'bg-orange-50 text-orange-700 border border-orange-100' },
                { label: 'Picked Up', count: delPickedUp, cls: 'bg-purple-50 text-purple-700 border border-purple-100' },
                { label: 'Delivered', count: delDelivered, cls: 'bg-green-50 text-green-700 border border-green-100' },
              ].map(({ label, count, cls }) => (
                <div key={label} className={`rounded-lg p-2 ${cls}`}>
                  <p className="text-xs opacity-80 whitespace-nowrap">{label}</p>
                  <p className="text-lg font-bold">{formatNumber(count)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* INVENTORY SUMMARY */}
          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-border/50 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Inventory</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/dashboard')} className="text-xs h-7 px-2">
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
                  <span className={`font-bold ${cls}`}>{formatNumber(count)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}
