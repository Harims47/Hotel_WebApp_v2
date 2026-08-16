import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  FileText, ShoppingBag, CreditCard, ChefHat, Truck,
  XCircle, Percent, Activity
} from 'lucide-react';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getDateBounds(preset, from, to) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (preset === 'ALL')       return { from: '1900-01-01', to: '2999-12-31' };
  if (preset === 'TODAY')     return { from: today, to: today };
  if (preset === 'YESTERDAY') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const s = y.toISOString().split('T')[0];
    return { from: s, to: s };
  }
  if (preset === 'THIS_WEEK') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return { from: start.toISOString().split('T')[0], to: today };
  }
  if (preset === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString().split('T')[0], to: today };
  }
  return { from: from || today, to: to || today };
}

function inRange(dateStr, from, to) {
  if (!dateStr) return false;
  const d = dateStr.split('T')[0];
  return d >= from && d <= to;
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/30 last:border-0 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text-main">{value}</span>
    </div>
  );
}

function EmptyRow({ cols }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-text-muted py-10">
        No records found for the selected period.
      </TableCell>
    </TableRow>
  );
}

// ------------------------------------------------------------------
// TABS CONFIG
// ------------------------------------------------------------------
const TABS = [
  { id: 'sales',       label: 'Sales',          icon: FileText },
  { id: 'orders',      label: 'Orders',         icon: ShoppingBag },
  { id: 'payments',    label: 'Payments',       icon: CreditCard },
  { id: 'kot',         label: 'KOT',            icon: ChefHat },
  { id: 'delivery',    label: 'Delivery',       icon: Truck },
  { id: 'cancellation',label: 'Cancellations',  icon: XCircle },
  { id: 'discount',    label: 'Discounts',      icon: Percent },
  { id: 'activity',   label: 'Staff Activity', icon: Activity },
];

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function ManagementReports() {
  const today = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ preset: 'THIS_MONTH', from: '', to: '' });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');

  const bills      = useSelector(s => s.billing.data)   || [];
  const orders     = useSelector(s => s.orders.data)    || [];
  const payments   = useSelector(s => s.payments.data)  || [];
  const kots       = useSelector(s => s.kot.data)       || [];
  const deliveries = useSelector(s => s.delivery.data)  || [];
  const logs       = useSelector(s => s.audit.logs)     || [];
  const users      = useSelector(s => s.users.data)     || [];

  const { from, to } = getDateBounds(dateRange.preset, dateRange.from, dateRange.to);

  const fBills     = useMemo(() => bills.filter(b => inRange(b.createdAt, from, to)), [bills, from, to]);
  const fOrders    = useMemo(() => orders.filter(o => inRange(o.createdAt, from, to)), [orders, from, to]);
  const fPayments  = useMemo(() => payments.filter(p => inRange(p.createdAt, from, to)), [payments, from, to]);
  const fKots      = useMemo(() => kots.filter(k => inRange(k.createdAt, from, to)), [kots, from, to]);
  const fDeliveries= useMemo(() => deliveries.filter(d => inRange(d.createdAt, from, to)), [deliveries, from, to]);
  const fLogs      = useMemo(() => logs.filter(l => inRange(l.timestamp, from, to)), [logs, from, to]);

  const userOptions = useMemo(() => {
    const ids = [...new Set(logs.map(l => l.userId).filter(Boolean))];
    return [{ value: 'ALL', label: 'All Users' }, ...ids.map(id => {
      const u = users.find(u => u.id === id);
      return { value: id, label: u ? u.name || u.email || id : id };
    })];
  }, [logs, users]);

  const q = search.toLowerCase();

  // ---- SALES REPORT ----
  const salesData = useMemo(() => {
    return fBills.filter(b => {
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
      if (q && !b.id?.toLowerCase().includes(q) && !b.orderId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fBills, filterStatus, q]);

  const salesSummary = useMemo(() => ({
    totalBills: salesData.length,
    gross: salesData.reduce((s, b) => s + (b.subtotal || 0), 0),
    discounts: salesData.reduce((s, b) => s + (b.discountAmount || 0), 0),
    tax: salesData.reduce((s, b) => s + (b.taxAmount || 0), 0),
    net: salesData.reduce((s, b) => s + (b.grandTotal || 0), 0),
  }), [salesData]);

  // ---- ORDER REPORT ----
  const ordersData = useMemo(() => {
    return fOrders.filter(o => {
      if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
      if (filterType !== 'ALL' && o.type !== filterType) return false;
      if (q && !o.id?.toLowerCase().includes(q) && !o.tableId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fOrders, filterStatus, filterType, q]);

  // ---- PAYMENT REPORT ----
  const paymentsData = useMemo(() => {
    const methodFilter = filterType !== 'ALL' ? filterType : null;
    return fPayments.filter(p => {
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
      if (methodFilter && p.method !== methodFilter) return false;
      if (q && !p.id?.toLowerCase().includes(q) && !p.billId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fPayments, filterStatus, filterType, q]);

  const paymentSummary = useMemo(() => {
    const paid = paymentsData.filter(p => p.status === 'PAID');
    const getMethod = (m) => paid.filter(p => p.method === m).reduce((s, p) => s + (p.amount || 0), 0);
    return {
      cash: getMethod('CASH'), upi: getMethod('UPI'), card: getMethod('CARD'),
      total: paid.reduce((s, p) => s + (p.amount || 0), 0),
    };
  }, [paymentsData]);

  // ---- KOT REPORT ----
  const kotData = useMemo(() => {
    return fKots.filter(k => {
      if (filterStatus !== 'ALL' && k.status !== filterStatus) return false;
      if (q && !k.id?.toLowerCase().includes(q) && !k.orderId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fKots, filterStatus, q]);

  // ---- DELIVERY REPORT ----
  const deliveryData = useMemo(() => {
    return fDeliveries.filter(d => {
      if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
      if (q && !d.id?.toLowerCase().includes(q) && !d.orderId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fDeliveries, filterStatus, q]);

  // ---- CANCELLATION REPORT ----
  const cancelData = useMemo(() => {
    const cancelledOrders = fOrders.filter(o => o.status === 'CANCELLED');
    return cancelledOrders.filter(o => {
      if (filterType !== 'ALL' && o.type !== filterType) return false;
      if (q && !o.id?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fOrders, filterType, q]);

  // ---- DISCOUNT REPORT ----
  const discountData = useMemo(() => {
    return fBills.filter(b => {
      const hasDiscount = (b.discountAmount || 0) > 0;
      if (!hasDiscount) return false;
      if (q && !b.id?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fBills, q]);

  // ---- STAFF ACTIVITY REPORT ----
  const activityData = useMemo(() => {
    return fLogs.filter(l => {
      if (filterUser !== 'ALL' && l.userId !== filterUser) return false;
      if (q && !l.action?.toLowerCase().includes(q) && !l.userId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fLogs, filterUser, q]);

  const shortId = (id) => id ? id.slice(0, 8) : '-';
  const fmtDt = (dt) => dt ? new Date(dt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-';
  const duration = (a, b) => {
    if (!a || !b) return '-';
    const mins = Math.round((new Date(b) - new Date(a)) / 60000);
    return mins >= 0 ? `${mins}m` : '-';
  };

  const statusBadgeVariant = (s) => {
    const m = {
      PAID: 'success', COMPLETED: 'success', DELIVERED: 'success',
      PENDING: 'warning', PREPARING: 'warning',
      NEW: 'secondary', ASSIGNED: 'secondary', PICKED_UP: 'secondary',
      OUT_FOR_DELIVERY: 'secondary',
      CANCELLED: 'danger', REJECTED: 'danger',
      READY: 'success',
    };
    return m[s] || 'default';
  };

  // Reset filters when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
    setFilterStatus('ALL');
    setFilterType('ALL');
    setFilterUser('ALL');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-border/50">
        <PageHeader title="Management Reports" description="Operational reports derived from live data." />
        <DateRangeFilter value={dateRange} onChange={setDateRange} className="shrink-0" />
      </div>

      {/* TABS */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-border/50 pb-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-muted hover:text-text-main hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* REPORT CONTENT */}
      <Card>
        {/* FILTERS TOOLBAR */}
        <div className="p-4 border-b border-border/50 bg-gray-50/50">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-bold text-text-main mb-1.5">Search</label>
              <SearchInput
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search records..."
              />
            </div>
            {/* Status filter (all tabs except activity/discount/cancellation) */}
            {!['activity', 'discount', 'cancellation'].includes(activeTab) && (
              <div className="min-w-[150px]">
                <Select
                  label="Status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    ...(activeTab === 'sales' ? [
                      { value: 'PAID', label: 'Paid' },
                      { value: 'PRINTED', label: 'Printed' },
                      { value: 'REQUESTED', label: 'Requested' },
                    ] : activeTab === 'orders' ? [
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ] : activeTab === 'payments' ? [
                      { value: 'PAID', label: 'Paid' },
                      { value: 'PENDING', label: 'Pending' },
                    ] : activeTab === 'kot' ? [
                      { value: 'NEW', label: 'New' },
                      { value: 'PREPARING', label: 'Preparing' },
                      { value: 'READY', label: 'Ready' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ] : activeTab === 'delivery' ? [
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'ASSIGNED', label: 'Assigned' },
                      { value: 'PICKED_UP', label: 'Picked Up' },
                      { value: 'OUT_FOR_DELIVERY', label: 'Out' },
                      { value: 'DELIVERED', label: 'Delivered' },
                    ] : []),
                  ]}
                />
              </div>
            )}
            {/* Type filter */}
            {['orders', 'cancellation'].includes(activeTab) && (
              <div className="min-w-[150px]">
                <Select
                  label="Order Type"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Types' },
                    { value: 'DINE_IN', label: 'Dine-In' },
                    { value: 'TAKEAWAY', label: 'Takeaway' },
                    { value: 'DELIVERY', label: 'Delivery' },
                    { value: 'PHONE', label: 'Phone' },
                  ]}
                />
              </div>
            )}
            {/* Payment method filter */}
            {activeTab === 'payments' && (
              <div className="min-w-[150px]">
                <Select
                  label="Method"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Methods' },
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'CARD', label: 'Card' },
                  ]}
                />
              </div>
            )}
            {/* User filter for activity */}
            {activeTab === 'activity' && (
              <div className="min-w-[180px]">
                <Select label="User" value={filterUser} onChange={e => setFilterUser(e.target.value)} options={userOptions} />
              </div>
            )}
          </div>
        </div>

        {/* ===== SALES REPORT ===== */}
        {activeTab === 'sales' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.length === 0 ? <EmptyRow cols={8} /> : salesData.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs text-text-muted">{fmtDt(b.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(b.id)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(b.orderId)}</TableCell>
                    <TableCell>{fmt(b.subtotal)}</TableCell>
                    <TableCell className="text-red-500">{fmt(b.discountAmount)}</TableCell>
                    <TableCell>{fmt(b.taxAmount)}</TableCell>
                    <TableCell className="font-bold">{fmt(b.grandTotal)}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(b.status)}>{b.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Summary */}
            <div className="p-6 border-t border-border/50 bg-gray-50/50">
              <h3 className="font-bold text-sm text-text-main mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center"><p className="text-xs text-text-muted">Bills</p><p className="text-lg font-bold">{salesSummary.totalBills}</p></div>
                <div className="text-center"><p className="text-xs text-text-muted">Gross</p><p className="text-lg font-bold">{fmt(salesSummary.gross)}</p></div>
                <div className="text-center"><p className="text-xs text-text-muted">Discount</p><p className="text-lg font-bold text-red-500">{fmt(salesSummary.discounts)}</p></div>
                <div className="text-center"><p className="text-xs text-text-muted">Tax</p><p className="text-lg font-bold">{fmt(salesSummary.tax)}</p></div>
                <div className="text-center"><p className="text-xs text-text-muted">Net Sales</p><p className="text-lg font-bold text-green-600">{fmt(salesSummary.net)}</p></div>
              </div>
            </div>
          </CardContent>
        )}

        {/* ===== ORDER REPORT ===== */}
        {activeTab === 'orders' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Table / Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.length === 0 ? <EmptyRow cols={7} /> : ordersData.map(o => {
                  const bill = bills.find(b => b.orderId === o.id);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs text-text-muted">{fmtDt(o.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                      <TableCell><Badge variant="default">{o.type?.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-sm">{o.tableId || o.customerName || '-'}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell>{bill ? fmt(bill.grandTotal) : '-'}</TableCell>
                      <TableCell className="text-xs text-text-muted">{o.createdBy || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}

        {/* ===== PAYMENT REPORT ===== */}
        {activeTab === 'payments' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsData.length === 0 ? <EmptyRow cols={7} /> : paymentsData.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-text-muted">{fmtDt(p.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(p.id)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(p.billId)}</TableCell>
                    <TableCell><Badge variant="default">{p.method}</Badge></TableCell>
                    <TableCell className="font-bold">{fmt(p.amount)}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(p.status)}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs text-text-muted">{p.receivedBy || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Summary */}
            <div className="p-6 border-t border-border/50 bg-gray-50/50">
              <h3 className="font-bold text-sm text-text-main mb-3">Summary (Paid transactions only)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><p className="text-xs text-text-muted">Cash</p><p className="text-lg font-bold">{fmt(paymentSummary.cash)}</p></div>
                <div><p className="text-xs text-text-muted">UPI</p><p className="text-lg font-bold">{fmt(paymentSummary.upi)}</p></div>
                <div><p className="text-xs text-text-muted">Card</p><p className="text-lg font-bold">{fmt(paymentSummary.card)}</p></div>
                <div><p className="text-xs text-text-muted">Total</p><p className="text-lg font-bold text-green-600">{fmt(paymentSummary.total)}</p></div>
              </div>
            </div>
          </CardContent>
        )}

        {/* ===== KOT REPORT ===== */}
        {activeTab === 'kot' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KOT No</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kotData.length === 0 ? <EmptyRow cols={5} /> : kotData.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono text-xs">{shortId(k.id)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(k.orderId)}</TableCell>
                    <TableCell className="text-xs text-text-muted">{fmtDt(k.createdAt)}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(k.status)}>{k.status}</Badge></TableCell>
                    <TableCell className="text-sm">{k.items?.length ?? 0} items</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}

        {/* ===== DELIVERY REPORT ===== */}
        {activeTab === 'delivery' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery ID</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Delivery Boy</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Picked Up</TableHead>
                  <TableHead>Delivered At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryData.length === 0 ? <EmptyRow cols={8} /> : deliveryData.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{shortId(d.id)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(d.orderId)}</TableCell>
                    <TableCell className="text-sm">{d.deliveryBoyId || d.deliveryBoyName || '-'}</TableCell>
                    <TableCell className="text-xs text-text-muted">{fmtDt(d.assignedAt)}</TableCell>
                    <TableCell className="text-xs text-text-muted">{fmtDt(d.pickedUpAt)}</TableCell>
                    <TableCell className="text-xs text-text-muted">{fmtDt(d.deliveredAt)}</TableCell>
                    <TableCell className="text-xs font-mono">{duration(d.assignedAt, d.deliveredAt)}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(d.status)}>{d.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}

        {/* ===== CANCELLATION REPORT ===== */}
        {activeTab === 'cancellation' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Cancelled By</TableHead>
                  <TableHead>Cancelled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelData.length === 0 ? <EmptyRow cols={6} /> : cancelData.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs text-text-muted">{fmtDt(o.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                    <TableCell><Badge variant="default">{o.type?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-sm">{o.cancelReason || '-'}</TableCell>
                    <TableCell className="text-xs text-text-muted">{o.cancelledBy || '-'}</TableCell>
                    <TableCell className="text-xs text-text-muted">{fmtDt(o.cancelledAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}

        {/* ===== DISCOUNT REPORT ===== */}
        {activeTab === 'discount' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountData.length === 0 ? <EmptyRow cols={7} /> : discountData.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs text-text-muted">{fmtDt(b.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(b.id)}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(b.orderId)}</TableCell>
                    <TableCell>{fmt(b.subtotal)}</TableCell>
                    <TableCell className="font-bold text-red-500">{fmt(b.discountAmount)}</TableCell>
                    <TableCell>{b.discountPercentage ? `${b.discountPercentage}%` : '-'}</TableCell>
                    <TableCell className="text-sm">{b.discountReason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Summary */}
            <div className="p-6 border-t border-border/50 bg-gray-50/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-text-muted">Discounted Bills</p><p className="text-lg font-bold">{discountData.length}</p></div>
                <div><p className="text-xs text-text-muted">Total Discount</p><p className="text-lg font-bold text-red-500">{fmt(discountData.reduce((s, b) => s + (b.discountAmount || 0), 0))}</p></div>
                <div><p className="text-xs text-text-muted">Avg Discount</p><p className="text-lg font-bold">{fmt(discountData.length > 0 ? discountData.reduce((s, b) => s + (b.discountAmount || 0), 0) / discountData.length : 0)}</p></div>
              </div>
            </div>
          </CardContent>
        )}

        {/* ===== STAFF ACTIVITY REPORT ===== */}
        {activeTab === 'activity' && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityData.length === 0 ? <EmptyRow cols={6} /> : [...activityData].reverse().map((log, i) => (
                  <TableRow key={log.id || i}>
                    <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(log.timestamp)}</TableCell>
                    <TableCell className="text-sm font-medium">{log.userId || '-'}</TableCell>
                    <TableCell><Badge variant="default">{log.userRole || '-'}</Badge></TableCell>
                    <TableCell className="text-sm">{log.action || '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-text-muted">
                      {log.entityType ? `${log.entityType} #${shortId(log.entityId)}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">{log.description || log.details || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
