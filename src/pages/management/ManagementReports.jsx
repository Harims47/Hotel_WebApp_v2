import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  FileText, ShoppingBag, CreditCard, ChefHat, Truck,
  XCircle, Percent, Activity, Download
} from 'lucide-react';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { Button } from '../../components/ui/Button';
import * as XLSX from 'xlsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
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
  const today = now.toISOString().split('T')[0];
  if (preset === 'ALL') return { from: '1900-01-01', to: '2999-12-31' };
  if (preset === 'TODAY') return { from: today, to: today };
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

function EmptyRow({ cols, message = "No data available for this period" }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-text-muted py-12">
        {message}
      </TableCell>
    </TableRow>
  );
}

// ------------------------------------------------------------------
// TABS CONFIG
// ------------------------------------------------------------------
const TABS = [
  { id: 'sales', label: 'Sales', icon: FileText },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'kot', label: 'KOT', icon: ChefHat },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'cancellation', label: 'Cancellations', icon: XCircle },
  { id: 'discount', label: 'Discounts', icon: Percent },
  { id: 'activity', label: 'Staff Activity', icon: Activity },
];

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308'];

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

  const bills = useSelector(s => s.billing.data) || [];
  const orders = useSelector(s => s.orders.data) || [];
  const payments = useSelector(s => s.payments.data) || [];
  const kots = useSelector(s => s.kot.data) || [];
  const deliveries = useSelector(s => s.delivery.data) || [];
  const logs = useSelector(s => s.audit.logs) || [];
  const users = useSelector(s => s.users.data) || [];

  const getUserName = (id) => users.find(u => u.id === id)?.name || id;

  const { from, to } = getDateBounds(dateRange.preset, dateRange.from, dateRange.to);

  const fBills = useMemo(() => bills.filter(b => inRange(b.createdAt, from, to)), [bills, from, to]);
  const fOrders = useMemo(() => orders.filter(o => inRange(o.createdAt, from, to)), [orders, from, to]);
  const fPayments = useMemo(() => payments.filter(p => inRange(p.createdAt, from, to)), [payments, from, to]);
  const fKots = useMemo(() => kots.filter(k => inRange(k.createdAt, from, to)), [kots, from, to]);
  const fDeliveries = useMemo(() => deliveries.filter(d => inRange(d.createdAt, from, to)), [deliveries, from, to]);
  const fLogs = useMemo(() => logs.filter(l => inRange(l.timestamp, from, to)), [logs, from, to]);

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
    gross: salesData.reduce((s, b) => s + getSafeNum(b.subtotal), 0),
    discounts: salesData.reduce((s, b) => s + getSafeNum(b.discountAmount), 0),
    tax: salesData.reduce((s, b) => s + getSafeNum(b.taxAmount), 0),
    net: salesData.reduce((s, b) => s + getSafeNum(b.grandTotal), 0),
  }), [salesData]);

  const salesTrend = useMemo(() => {
    const dates = {};
    salesData.forEach(b => {
      const dateStr = b.createdAt?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, sales: 0 };
      dates[dateStr].sales += getSafeNum(b.grandTotal);
    });
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [salesData]);

  // ---- ORDER REPORT ----
  const ordersData = useMemo(() => {
    return fOrders.filter(o => {
      if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
      if (filterType !== 'ALL' && o.type !== filterType) return false;
      if (q && !o.id?.toLowerCase().includes(q) && !o.tableId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fOrders, filterStatus, filterType, q]);

  const ordersTrend = useMemo(() => {
    const dates = {};
    ordersData.forEach(o => {
      const dateStr = o.createdAt?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, orders: 0 };
      dates[dateStr].orders += 1;
    });
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [ordersData]);

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
    const getMethod = (m) => paid.filter(p => p.method === m).reduce((s, p) => s + getSafeNum(p.amount), 0);
    return {
      cash: getMethod('CASH'), upi: getMethod('UPI'), card: getMethod('CARD'),
      total: paid.reduce((s, p) => s + getSafeNum(p.amount), 0),
    };
  }, [paymentsData]);

  const paymentChartData = useMemo(() => [
    { name: 'Cash', value: paymentSummary.cash },
    { name: 'UPI', value: paymentSummary.upi },
    { name: 'Card', value: paymentSummary.card }
  ].filter(d => d.value > 0), [paymentSummary]);

  // ---- KOT REPORT ----
  const kotData = useMemo(() => {
    return fKots.filter(k => {
      if (filterStatus !== 'ALL' && k.status !== filterStatus) return false;
      if (q && !k.id?.toLowerCase().includes(q) && !k.orderId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fKots, filterStatus, q]);

  const kotChartData = useMemo(() => {
    const statusCounts = {};
    kotData.forEach(k => {
      statusCounts[k.status] = (statusCounts[k.status] || 0) + 1;
    });
    return Object.keys(statusCounts).map(status => ({ name: status, value: statusCounts[status] }));
  }, [kotData]);

  // ---- DELIVERY REPORT ----
  const deliveryData = useMemo(() => {
    return fDeliveries.filter(d => {
      if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
      if (q && !d.id?.toLowerCase().includes(q) && !d.orderId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fDeliveries, filterStatus, q]);

  const deliveryChartData = useMemo(() => {
    const statusCounts = {};
    deliveryData.forEach(d => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });
    return Object.keys(statusCounts).map(status => ({ name: status, value: statusCounts[status] }));
  }, [deliveryData]);

  // ---- CANCELLATION REPORT ----
  const cancelData = useMemo(() => {
    const cancelledOrders = fOrders.filter(o => o.status === 'CANCELLED');
    return cancelledOrders.filter(o => {
      if (filterType !== 'ALL' && o.type !== filterType) return false;
      if (q && !o.id?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fOrders, filterType, q]);

  const cancelTrend = useMemo(() => {
    const dates = {};
    cancelData.forEach(o => {
      const dateStr = o.createdAt?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, cancellations: 0 };
      dates[dateStr].cancellations += 1;
    });
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [cancelData]);

  // ---- DISCOUNT REPORT ----
  const discountData = useMemo(() => {
    return fBills.filter(b => {
      const hasDiscount = getSafeNum(b.discountAmount) > 0;
      if (!hasDiscount) return false;
      if (q && !b.id?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fBills, q]);

  const discountTrend = useMemo(() => {
    const dates = {};
    discountData.forEach(b => {
      const dateStr = b.createdAt?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, discounts: 0 };
      dates[dateStr].discounts += getSafeNum(b.discountAmount);
    });
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [discountData]);

  // ---- STAFF ACTIVITY REPORT ----
  const activityData = useMemo(() => {
    return fLogs.filter(l => {
      if (filterUser !== 'ALL' && l.userId !== filterUser) return false;
      if (q && !l.action?.toLowerCase().includes(q) && !l.userId?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fLogs, filterUser, q]);

  const activityTrend = useMemo(() => {
    const dates = {};
    activityData.forEach(l => {
      const dateStr = l.timestamp?.split('T')[0];
      if (!dateStr) return;
      if (!dates[dateStr]) dates[dateStr] = { date: dateStr, activities: 0 };
      dates[dateStr].activities += 1;
    });
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [activityData]);

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

  // ------------------------------------------------------------------
  // EXPORT EXCEL
  // ------------------------------------------------------------------
  const handleExportExcel = () => {
    let rawData = [];
    let summaryData = [];
    let fileName = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}_Report_${today}.xlsx`;

    if (activeTab === 'sales') {
      rawData = salesData.map(b => ({
        Date: fmtDt(b.createdAt),
        'Bill No': b.id,
        'Order No': b.orderId,
        'Gross Amount': getSafeNum(b.subtotal),
        'Discount Amount': getSafeNum(b.discountAmount),
        'Tax Amount': getSafeNum(b.taxAmount),
        'Net Amount': getSafeNum(b.grandTotal),
        Status: b.status
      }));
      summaryData = [
        { Metric: 'Total Bills', Value: salesSummary.totalBills },
        { Metric: 'Gross Sales', Value: salesSummary.gross },
        { Metric: 'Total Discounts', Value: salesSummary.discounts },
        { Metric: 'Total Tax', Value: salesSummary.tax },
        { Metric: 'Net Sales', Value: salesSummary.net }
      ];
    } else if (activeTab === 'orders') {
      rawData = ordersData.map(o => {
        const bill = bills.find(b => b.orderId === o.id);
        return {
          Date: fmtDt(o.createdAt),
          'Order No': o.id,
          Type: o.type,
          'Table/Customer': o.tableId || o.customerName || '-',
          Status: o.status,
          'Amount': bill ? getSafeNum(bill.grandTotal) : 0,
          'Created By': o.createdBy || '-'
        };
      });
      summaryData = [
        { Metric: 'Total Orders', Value: ordersData.length },
        { Metric: 'Completed', Value: ordersData.filter(o => o.status === 'COMPLETED').length },
        { Metric: 'Cancelled', Value: ordersData.filter(o => o.status === 'CANCELLED').length }
      ];
    } else if (activeTab === 'payments') {
      rawData = paymentsData.map(p => ({
        Date: fmtDt(p.createdAt),
        'Payment ID': p.id,
        'Bill No': p.billId,
        Method: p.method,
        Amount: getSafeNum(p.amount),
        Status: p.status,
        'Received By': p.receivedBy || '-'
      }));
      summaryData = [
        { Metric: 'Total Paid Transactions', Value: paymentsData.filter(p => p.status === 'PAID').length },
        { Metric: 'Cash Collected', Value: paymentSummary.cash },
        { Metric: 'UPI Collected', Value: paymentSummary.upi },
        { Metric: 'Card Collected', Value: paymentSummary.card },
        { Metric: 'Total Collected', Value: paymentSummary.total }
      ];
    } else if (activeTab === 'kot') {
      rawData = kotData.map(k => ({
        'KOT No': k.id,
        'Order No': k.orderId,
        'Created At': fmtDt(k.createdAt),
        Status: k.status,
        'Item Count': k.items?.length || 0
      }));
      summaryData = [
        { Metric: 'Total KOTs', Value: kotData.length },
        { Metric: 'Completed', Value: kotData.filter(k => k.status === 'COMPLETED').length },
        { Metric: 'Cancelled', Value: kotData.filter(k => k.status === 'CANCELLED').length }
      ];
    } else if (activeTab === 'delivery') {
      rawData = deliveryData.map(d => ({
        'Delivery ID': d.id,
        'Order No': d.orderId,
        'Delivery Boy': d.deliveryBoyId || d.deliveryBoyName || '-',
        'Assigned At': fmtDt(d.assignedAt),
        'Picked Up': fmtDt(d.pickedUpAt),
        'Delivered At': fmtDt(d.deliveredAt),
        'Duration': duration(d.assignedAt, d.deliveredAt),
        Status: d.status
      }));
      summaryData = [
        { Metric: 'Total Deliveries', Value: deliveryData.length },
        { Metric: 'Delivered', Value: deliveryData.filter(d => d.status === 'DELIVERED').length },
        { Metric: 'Pending', Value: deliveryData.filter(d => d.status === 'PENDING').length }
      ];
    } else if (activeTab === 'cancellation') {
      rawData = cancelData.map(o => ({
        Date: fmtDt(o.createdAt),
        'Order No': o.id,
        Type: o.type,
        Reason: o.cancelReason || '-',
        'Cancelled By': o.cancelledBy || '-',
        'Cancelled At': fmtDt(o.cancelledAt)
      }));
      summaryData = [
        { Metric: 'Total Cancellations', Value: cancelData.length }
      ];
    } else if (activeTab === 'discount') {
      rawData = discountData.map(b => ({
        Date: fmtDt(b.createdAt),
        'Bill No': b.id,
        'Order No': b.orderId,
        'Gross Amount': getSafeNum(b.subtotal),
        'Discount Amount': getSafeNum(b.discountAmount),
        'Discount %': b.discountPercentage || '-',
        Reason: b.discountReason || '-'
      }));
      summaryData = [
        { Metric: 'Discounted Bills', Value: discountData.length },
        { Metric: 'Total Discount Amount', Value: discountData.reduce((s, b) => s + getSafeNum(b.discountAmount), 0) }
      ];
    } else if (activeTab === 'activity') {
      rawData = activityData.map(l => ({
        'Date / Time': fmtDt(l.timestamp),
        'User ID': l.userId || '-',
        'User Name': getUserName(l.userId),
        Role: l.userRole || '-',
        Action: l.action || '-',
        'Entity Type': l.entityType || '-',
        'Entity ID': l.entityId || '-',
        Description: l.description || l.details || '-'
      }));
      summaryData = [
        { Metric: 'Total Activities', Value: activityData.length }
      ];
    }

    const wb = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const dataSheet = XLSX.utils.json_to_sheet(rawData);

    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(wb, dataSheet, 'Report Data');
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div className="pb-4">
        <PageHeader title="Management Reports" description="Operational reports derived from live data." className="mb-0" />
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-text-muted border border-border hover:text-text-main hover:bg-canvas/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex gap-3 shrink-0">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={handleExportExcel} variant="primary" className="flex items-center gap-2 h-10">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
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
          <CardContent className="p-0 flex flex-col">
            {/* Top Summary & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Sales Summary</h3>
                <div className="grid grid-cols-2 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Bills</p><p className="text-lg font-bold">{formatNumber(salesSummary.totalBills)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Gross</p><p className="text-lg font-bold">{formatCurrency(salesSummary.gross)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Discount</p><p className="text-lg font-bold text-red-500">{formatCurrency(salesSummary.discounts)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Tax</p><p className="text-lg font-bold">{formatCurrency(salesSummary.tax)}</p></div>
                  <div className="col-span-2 bg-green-50 p-3 rounded-lg border border-green-100 flex items-center justify-between">
                    <p className="text-sm text-green-800 font-semibold">Net Sales</p>
                    <p className="text-2xl font-black text-green-700">{formatCurrency(salesSummary.net)}</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Sales Trend</h3>
                {salesTrend.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrend}>
                        <defs>
                          <linearGradient id="colorNetSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} width={60} />
                        <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Sales']} contentStyle={{ borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNetSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Order No</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.length === 0 ? <EmptyRow cols={8} message="No sales available for this period." /> : salesData.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(b.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(b.id)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(b.orderId)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(b.subtotal)}</TableCell>
                      <TableCell className="text-right text-red-500 font-medium">{formatCurrency(b.discountAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(b.taxAmount)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(b.grandTotal)}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(b.status)} className="whitespace-nowrap">{b.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== ORDER REPORT ===== */}
        {activeTab === 'orders' && (
          <CardContent className="p-0 flex flex-col">
            {/* Top Summary & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Orders Summary</h3>
                <div className="grid grid-cols-2 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm col-span-2 flex justify-between items-center">
                    <p className="text-sm text-text-muted font-semibold">Total Orders</p>
                    <p className="text-2xl font-black text-primary">{formatNumber(ordersData.length)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Completed</p><p className="text-lg font-bold text-green-600">{formatNumber(ordersData.filter(o => o.status === 'COMPLETED').length)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Cancelled</p><p className="text-lg font-bold text-red-500">{formatNumber(ordersData.filter(o => o.status === 'CANCELLED').length)}</p></div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Orders Trend</h3>
                {ordersTrend.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ordersTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={40} />
                        <RechartsTooltip formatter={(value) => [formatNumber(value), 'Orders']} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Table / Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.length === 0 ? <EmptyRow cols={7} message="No orders available for this period." /> : ordersData.map(o => {
                    const bill = bills.find(b => b.orderId === o.id);
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(o.createdAt)}</TableCell>
                        <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                        <TableCell><Badge variant="default">{o.type?.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell className="text-sm">{o.tableId || o.customerName || '-'}</TableCell>
                        <TableCell><Badge variant={statusBadgeVariant(o.status)} className="whitespace-nowrap">{o.status}</Badge></TableCell>
                        <TableCell className="text-right">{bill ? formatCurrency(bill.grandTotal) : '-'}</TableCell>
                        <TableCell className="text-xs text-text-muted">{getUserName(o.createdBy) || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== PAYMENT REPORT ===== */}
        {activeTab === 'payments' && (
          <CardContent className="p-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Payments Summary (Paid)</h3>
                <div className="grid grid-cols-2 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Cash</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(paymentSummary.cash)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">UPI</p><p className="text-lg font-bold text-blue-600">{formatCurrency(paymentSummary.upi)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Card</p><p className="text-lg font-bold text-indigo-600">{formatCurrency(paymentSummary.card)}</p></div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col justify-center"><p className="text-xs text-green-800">Total Collected</p><p className="text-lg font-bold text-green-700">{formatCurrency(paymentSummary.total)}</p></div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Payment Methods</h3>
                {paymentChartData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                          {paymentChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Amount']} contentStyle={{ borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData.length === 0 ? <EmptyRow cols={7} message="No payment records available." /> : paymentsData.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(p.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(p.id)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(p.billId)}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-gray-50">{p.method}</Badge></TableCell>
                      <TableCell className="font-bold text-right">{formatCurrency(p.amount)}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(p.status)} className="whitespace-nowrap">{p.status}</Badge></TableCell>
                      <TableCell className="text-xs text-text-muted">{getUserName(p.receivedBy) || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== KOT REPORT ===== */}
        {activeTab === 'kot' && (
          <CardContent className="p-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">KOT Summary</h3>
                <div className="grid grid-cols-2 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm col-span-2 flex justify-between items-center">
                    <p className="text-sm text-text-muted font-semibold">Total KOTs</p>
                    <p className="text-2xl font-black text-primary">{formatNumber(kotData.length)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Completed</p><p className="text-lg font-bold text-green-600">{formatNumber(kotData.filter(k => k.status === 'COMPLETED').length)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Cancelled</p><p className="text-lg font-bold text-red-500">{formatNumber(kotData.filter(k => k.status === 'CANCELLED').length)}</p></div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">KOT Status Distribution</h3>
                {kotChartData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kotChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} width={80} />
                        <RechartsTooltip formatter={(value) => [formatNumber(value), 'KOTs']} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                          {kotChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KOT No</TableHead>
                    <TableHead>Order No</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kotData.length === 0 ? <EmptyRow cols={5} message="No KOT activity for this period." /> : kotData.map(k => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-xs">{shortId(k.id)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(k.orderId)}</TableCell>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(k.createdAt)}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(k.status)} className="whitespace-nowrap">{k.status}</Badge></TableCell>
                      <TableCell className="text-sm text-right font-medium">{k.items?.length ?? 0} items</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== DELIVERY REPORT ===== */}
        {activeTab === 'delivery' && (
          <CardContent className="p-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Delivery Summary</h3>
                <div className="grid grid-cols-2 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm col-span-2 flex justify-between items-center">
                    <p className="text-sm text-text-muted font-semibold">Total Deliveries</p>
                    <p className="text-2xl font-black text-primary">{formatNumber(deliveryData.length)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Delivered</p><p className="text-lg font-bold text-green-600">{formatNumber(deliveryData.filter(d => d.status === 'DELIVERED').length)}</p></div>
                  <div className="bg-white p-3 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Pending</p><p className="text-lg font-bold text-orange-500">{formatNumber(deliveryData.filter(d => d.status === 'PENDING').length)}</p></div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Delivery Status Distribution</h3>
                {deliveryChartData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deliveryChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                          {deliveryChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [formatNumber(value), 'Deliveries']} contentStyle={{ borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
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
                  {deliveryData.length === 0 ? <EmptyRow cols={8} message="No deliveries available." /> : deliveryData.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{shortId(d.id)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(d.orderId)}</TableCell>
                      <TableCell className="text-sm font-medium">{d.deliveryBoyId || d.deliveryBoyName || '-'}</TableCell>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(d.assignedAt)}</TableCell>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(d.pickedUpAt)}</TableCell>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(d.deliveredAt)}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">{duration(d.assignedAt, d.deliveredAt)}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(d.status)} className="whitespace-nowrap">{d.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== CANCELLATION REPORT ===== */}
        {activeTab === 'cancellation' && (
          <CardContent className="p-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Cancellations Summary</h3>
                <div className="grid grid-cols-1 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex justify-between items-center">
                    <p className="text-sm text-red-800 font-semibold">Total Cancellations</p>
                    <p className="text-2xl font-black text-red-600">{formatNumber(cancelData.length)}</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Cancellation Trend</h3>
                {cancelTrend.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cancelTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={40} />
                        <RechartsTooltip formatter={(value) => [formatNumber(value), 'Cancellations']} contentStyle={{ borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
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
                  {cancelData.length === 0 ? <EmptyRow cols={6} message="No cancellations available for this period." /> : cancelData.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(o.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-gray-50">{o.type?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{o.cancelReason || '-'}</TableCell>
                      <TableCell className="text-xs text-text-muted">{getUserName(o.cancelledBy) || '-'}</TableCell>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(o.cancelledAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== DISCOUNT REPORT ===== */}
        {activeTab === 'discount' && (
          <CardContent className="p-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Discounts Summary</h3>
                <div className="grid grid-cols-1 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-4 rounded-lg border border-border/50 shadow-sm flex flex-col justify-center"><p className="text-xs text-text-muted">Discounted Bills</p><p className="text-lg font-bold text-text-main">{formatNumber(discountData.length)}</p></div>
                  <div className="bg-white p-4 rounded-lg border border-border/50 shadow-sm flex justify-between items-center">
                    <p className="text-sm text-text-muted font-semibold">Total Discount</p>
                    <p className="text-2xl font-black text-red-500">{formatCurrency(discountData.reduce((s, b) => s + getSafeNum(b.discountAmount), 0))}</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Discount Trend</h3>
                {discountTrend.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={discountTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} width={60} />
                        <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Discounts']} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="discounts" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Order No</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Discount %</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountData.length === 0 ? <EmptyRow cols={7} message="No discounts available for this period." /> : discountData.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(b.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(b.id)}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(b.orderId)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(b.subtotal)}</TableCell>
                      <TableCell className="font-bold text-red-500 text-right">{formatCurrency(b.discountAmount)}</TableCell>
                      <TableCell className="text-right">{b.discountPercentage ? `${getSafeNum(b.discountPercentage)}%` : '-'}</TableCell>
                      <TableCell className="text-sm">{b.discountReason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {/* ===== STAFF ACTIVITY REPORT ===== */}
        {activeTab === 'activity' && (
          <CardContent className="p-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-border/50 bg-gray-50/30">
              <div className="lg:col-span-1 flex flex-col h-64">
                <h3 className="font-bold text-base text-text-main mb-4 shrink-0">Activity Summary</h3>
                <div className="grid grid-cols-1 gap-4 flex-1 auto-rows-fr">
                  <div className="bg-white p-4 rounded-lg border border-border/50 shadow-sm flex justify-between items-center">
                    <p className="text-sm text-text-muted font-semibold">Total Activities</p>
                    <p className="text-2xl font-black text-primary">{formatNumber(activityData.length)}</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 h-64 bg-white rounded-lg border border-border/50 shadow-sm p-4 flex flex-col">
                <h3 className="font-bold text-sm text-text-main mb-2 shrink-0">Activity Trend</h3>
                {activityTrend.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-text-muted">No data available for this period</div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={40} />
                        <RechartsTooltip formatter={(value) => [formatNumber(value), 'Activities']} cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="activities" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
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
                  {activityData.length === 0 ? <EmptyRow cols={6} message="No staff activity for this period." /> : [...activityData].reverse().map((log, i) => (
                    <TableRow key={log.id || i}>
                      <TableCell className="text-xs text-text-muted whitespace-nowrap">{fmtDt(log.timestamp)}</TableCell>
                      <TableCell className="text-sm font-medium">{getUserName(log.userId) || '-'}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-gray-50 font-normal uppercase text-[10px] tracking-wider">{log.userRole?.replace(/_/g, ' ') || '-'}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{log.action || '-'}</TableCell>
                      <TableCell className="font-mono text-xs text-text-muted whitespace-nowrap">
                        {log.entityType ? `${log.entityType} #${shortId(log.entityId)}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-text-muted">{log.description || log.details || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
