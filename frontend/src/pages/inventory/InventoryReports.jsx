import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';
import {
  Download, BarChart2, RefreshCw, TrendingUp, TrendingDown,
  Package, Truck, ShoppingCart, AlertTriangle, RotateCcw,
  Users, Banknote, ArrowRightLeft, ClipboardList
} from 'lucide-react';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'];

// ─── Reusable Components ───────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, color = 'text-primary', bgColor = 'bg-orange-50' }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl ${bgColor}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">{children}</h3>;
}

function EmptyChart({ message = 'No data for selected filters' }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-text-muted gap-2">
      <BarChart2 className="w-10 h-10 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-text-main mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

// ─── Excel Export Helpers ──────────────────────────────────────────────────
function exportToExcel(sheets, filename) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data, headers }) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data.map(row => headers.map(h => row[h] ?? ''))]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

// ─── Main Component ────────────────────────────────────────────────────────
export function InventoryReports() {
  const [activeReport, setActiveReport] = useState('purchases');

  // ── Master data
  const items = useSelector(s => s.invItems.data) || [];
  const uoms = useSelector(s => s.invUom.data) || [];
  const locations = useSelector(s => s.invLocations.data) || [];
  const categories = useSelector(s => s.invCategories.data) || [];
  const suppliers = useSelector(s => s.invSuppliers.data) || [];
  const users = useSelector(s => s.users.data) || [];

  // ── Transaction data
  const stock = useSelector(s => s.invStock.data) || [];
  const ledger = useSelector(s => s.stockLedger.data) || [];
  const pos = useSelector(s => s.purchaseOrders.data) || [];
  const grns = useSelector(s => s.grn.data) || [];
  const issues = useSelector(s => s.invIssues.data) || [];
  const waste = useSelector(s => s.invWaste.data) || [];
  const transfers = useSelector(s => s.invTransfers.data) || [];
  const adjustments = useSelector(s => s.invAdjustments.data) || [];
  const stockCounts = useSelector(s => s.invStockCounts.data) || [];
  const reimbursements = useSelector(s => s.reimbursements.data) || [];

  // ── Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ── Lookup helpers
  const getName = (arr, id, field = 'name') => arr.find(x => x.id === id)?.[field] || 'Unknown';
  const getUomCode = uomId => uoms.find(u => u.id === uomId)?.code || '';
  const getItemCategoryId = itemId => items.find(i => i.id === itemId)?.categoryId;

  // ── Date filter
  const inDateRange = dateStr => {
    if (!dateStr) return true;
    const d = dateStr.split('T')[0];
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  // ── Group by month helper
  const groupByMonth = (arr, getDate, getValue) => {
    const map = {};
    arr.forEach(item => {
      const month = (getDate(item) || '').substring(0, 7);
      if (!month) return;
      map[month] = (map[month] || 0) + getValue(item);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value }));
  };

  const reports = [
    { id: 'purchases', label: '📦 Purchases', icon: ShoppingCart },
    { id: 'stockMovement', label: '📊 Stock Movement', icon: TrendingUp },
    { id: 'waste', label: '🗑️ Waste', icon: AlertTriangle },
    { id: 'consumption', label: '📤 Consumption', icon: Package },
    { id: 'transfers', label: '🔄 Transfers', icon: ArrowRightLeft },
    { id: 'adjustments', label: '⚖️ Adjustments', icon: ClipboardList },
    { id: 'lowStock', label: '🔴 Low Stock', icon: TrendingDown },
    { id: 'suppliers', label: '🏢 Suppliers', icon: Users },
    { id: 'reimbursements', label: '💰 Reimbursements', icon: Banknote },
  ];

  const resetFilters = () => {
    setDateFrom(''); setDateTo('');
    setLocationFilter('ALL'); setCategoryFilter('ALL');
    setSupplierFilter('ALL'); setStatusFilter('ALL');
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PURCHASE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderPurchases = () => {
    const filteredGRNs = grns.filter(g =>
      g.status === 'CONFIRMED' &&
      inDateRange(g.grnDate) &&
      (supplierFilter === 'ALL' || g.supplierId === supplierFilter) &&
      (locationFilter === 'ALL' || g.locationId === locationFilter)
    );

    const filteredPOs = pos.filter(p =>
      inDateRange(p.orderDate) &&
      (supplierFilter === 'ALL' || p.supplierId === supplierFilter) &&
      (statusFilter === 'ALL' || p.status === statusFilter)
    );

    const totalPurchaseValue = filteredGRNs.reduce((sum, g) =>
      sum + (g.items || []).reduce((s, i) => s + (i.acceptedQuantity || 0) * (i.unitRate || 0), 0), 0
    );

    const supplierMap = {};
    filteredGRNs.forEach(g => {
      const sn = getName(suppliers, g.supplierId);
      const val = (g.items || []).reduce((s, i) => s + (i.acceptedQuantity || 0) * (i.unitRate || 0), 0);
      supplierMap[sn] = (supplierMap[sn] || 0) + val;
    });
    const bySupplier = Object.entries(supplierMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const monthlyTrend = groupByMonth(filteredGRNs, g => g.grnDate,
      g => (g.items || []).reduce((s, i) => s + (i.acceptedQuantity || 0) * (i.unitRate || 0), 0)
    );

    const itemMap = {};
    filteredGRNs.forEach(g => {
      (g.items || []).forEach(i => {
        const n = i.itemName || getName(items, i.itemId);
        itemMap[n] = (itemMap[n] || 0) + (i.acceptedQuantity || 0) * (i.unitRate || 0);
      });
    });
    const topItems = Object.entries(itemMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    const exportPurchases = () => {
      const grnRows = filteredGRNs.flatMap(g =>
        (g.items || []).map(i => ({
          'GRN Number': g.grnNumber,
          'Date': g.grnDate?.split('T')[0] || '',
          'Supplier': getName(suppliers, g.supplierId),
          'Location': getName(locations, g.locationId),
          'Item': i.itemName,
          'Received': i.currentReceivedQuantity,
          'Accepted': i.acceptedQuantity,
          'Rejected': i.rejectedQuantity,
          'Unit Rate': i.unitRate,
          'Amount': (i.acceptedQuantity || 0) * (i.unitRate || 0),
        }))
      );

      const supplierRows = bySupplier.map(s => ({
        'Supplier': s.name,
        'Total Purchase Value': s.value.toFixed(2),
      }));

      const poRows = filteredPOs.map(p => ({
        'PO Number': p.poNumber,
        'Date': p.orderDate,
        'Expected Delivery': p.expectedDeliveryDate,
        'Supplier': getName(suppliers, p.supplierId),
        'Status': p.status,
        'Total': p.total || 0,
      }));

      exportToExcel([
        { name: 'GRN Details', data: grnRows, headers: Object.keys(grnRows[0] || { 'No Data': '' }) },
        { name: 'Supplier Summary', data: supplierRows, headers: Object.keys(supplierRows[0] || { 'No Data': '' }) },
        { name: 'Purchase Orders', data: poRows, headers: Object.keys(poRows[0] || { 'No Data': '' }) },
      ], 'Purchase_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Purchase Value" value={formatCurrency(totalPurchaseValue)} icon={ShoppingCart} color="text-primary" bgColor="bg-orange-50" />
          <KPICard title="Total GRNs" value={filteredGRNs.length} subtitle="Confirmed" icon={Truck} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Purchase Orders" value={filteredPOs.length} icon={Package} color="text-emerald-600" bgColor="bg-emerald-50" />
          <KPICard title="Suppliers Active" value={bySupplier.length} subtitle="In this period" icon={Users} color="text-purple-600" bgColor="bg-purple-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Monthly Purchase Spend</SectionTitle>
              {monthlyTrend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                    <Bar dataKey="value" fill={CHART_COLORS[0]} name="Purchase Value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Purchase by Supplier</SectionTitle>
              {bySupplier.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bySupplier} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {bySupplier.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <SectionTitle>Top Purchased Items by Value</SectionTitle>
            {topItems.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                  <Bar dataKey="value" fill={CHART_COLORS[1]} name="Value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>GRN Details</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportPurchases}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['GRN', 'Date', 'Supplier', 'Location', 'Value', 'Status'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredGRNs.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filteredGRNs.slice(0, 30).map(g => (
                    <tr key={g.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3 font-medium">{g.grnNumber}</td>
                      <td className="py-2 px-3">{g.grnDate?.split('T')[0]}</td>
                      <td className="py-2 px-3">{getName(suppliers, g.supplierId)}</td>
                      <td className="py-2 px-3">{getName(locations, g.locationId)}</td>
                      <td className="py-2 px-3 font-semibold">{formatCurrency((g.items || []).reduce((s, i) => s + (i.acceptedQuantity || 0) * (i.unitRate || 0), 0))}</td>
                      <td className="py-2 px-3"><Badge variant="success">CONFIRMED</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // STOCK MOVEMENT REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderStockMovement = () => {
    const filteredLedger = ledger.filter(l =>
      inDateRange(l.transactionDate) &&
      (locationFilter === 'ALL' || l.locationId === locationFilter) &&
      (categoryFilter === 'ALL' || getItemCategoryId(l.itemId) === categoryFilter)
    ).sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    const totalIn = filteredLedger.filter(l => l.quantity > 0).reduce((s, l) => s + l.quantity, 0);
    const totalOut = filteredLedger.filter(l => l.quantity < 0).reduce((s, l) => s + Math.abs(l.quantity), 0);
    const totalValue = filteredLedger.reduce((s, l) => s + (l.amount || 0), 0);

    const byType = filteredLedger.reduce((acc, l) => {
      acc[l.transactionType] = (acc[l.transactionType] || 0) + Math.abs(l.quantity);
      return acc;
    }, {});
    const byTypeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    const monthlyIn = groupByMonth(filteredLedger.filter(l => l.quantity > 0), l => l.transactionDate, l => l.quantity);
    const monthlyOut = groupByMonth(filteredLedger.filter(l => l.quantity < 0), l => l.transactionDate, l => Math.abs(l.quantity));
    const allMonths = [...new Set([...monthlyIn.map(x => x.month), ...monthlyOut.map(x => x.month)])].sort();
    const trendData = allMonths.map(m => ({
      month: m,
      In: monthlyIn.find(x => x.month === m)?.value || 0,
      Out: monthlyOut.find(x => x.month === m)?.value || 0,
    }));

    const exportMovement = () => {
      const rows = filteredLedger.map(l => ({
        Date: l.transactionDate?.split('T')[0],
        Reference: l.referenceNumber,
        Type: l.transactionType,
        Item: l.itemName,
        Location: getName(locations, l.locationId),
        'Stock In': l.quantity > 0 ? l.quantity : 0,
        'Stock Out': l.quantity < 0 ? Math.abs(l.quantity) : 0,
        Balance: l.balanceAfter,
        Rate: l.rate,
        Amount: l.amount,
      }));
      exportToExcel([{ name: 'Stock Ledger', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) }], 'Stock_Movement_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Stock In" value={totalIn.toFixed(2)} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" />
          <KPICard title="Total Stock Out" value={totalOut.toFixed(2)} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" />
          <KPICard title="Ledger Entries" value={filteredLedger.length} icon={ClipboardList} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Transaction Value" value={formatCurrency(totalValue)} icon={BarChart2} color="text-primary" bgColor="bg-orange-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Stock In vs Stock Out (Monthly)</SectionTitle>
              {trendData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="In" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Out" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Movement by Transaction Type</SectionTitle>
              {byTypeData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`}>
                      {byTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Ledger Detail</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportMovement}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Date', 'Reference', 'Type', 'Item', 'Location', 'In', 'Out', 'Balance', 'Amount'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredLedger.length === 0 ? (
                    <tr><td colSpan={9} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filteredLedger.slice(0, 50).map(l => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3">{l.transactionDate?.split('T')[0]}</td>
                      <td className="py-2 px-3 font-medium">{l.referenceNumber}</td>
                      <td className="py-2 px-3"><span className="text-xs font-semibold px-2 py-0.5 bg-canvas rounded-lg">{l.transactionType}</span></td>
                      <td className="py-2 px-3">{l.itemName}</td>
                      <td className="py-2 px-3">{getName(locations, l.locationId)}</td>
                      <td className="py-2 px-3 text-emerald-600 font-semibold">{l.quantity > 0 ? l.quantity.toFixed(2) : '-'}</td>
                      <td className="py-2 px-3 text-red-600 font-semibold">{l.quantity < 0 ? Math.abs(l.quantity).toFixed(2) : '-'}</td>
                      <td className="py-2 px-3 font-bold">{(l.balanceAfter || 0).toFixed(2)}</td>
                      <td className="py-2 px-3">{formatCurrency(l.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // WASTE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderWaste = () => {
    const filteredWaste = waste.filter(w =>
      w.status === 'CONFIRMED' &&
      inDateRange(w.wasteDate) &&
      (locationFilter === 'ALL' || w.locationId === locationFilter)
    );

    const totalQty = filteredWaste.reduce((s, w) => s + (w.items || []).reduce((ss, i) => ss + (i.quantity || 0), 0), 0);
    const totalValue = filteredWaste.reduce((s, w) => s + (w.total || 0), 0);

    const byReason = filteredWaste.reduce((acc, w) => {
      const r = w.reason || 'Unknown';
      acc[r] = (acc[r] || 0) + (w.total || 0);
      return acc;
    }, {});
    const byReasonData = Object.entries(byReason).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const byItem = {};
    filteredWaste.forEach(w => (w.items || []).forEach(i => {
      byItem[i.itemName] = (byItem[i.itemName] || 0) + (i.quantity || 0) * (i.unitRate || 0);
    }));
    const byItemData = Object.entries(byItem).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    const trend = groupByMonth(filteredWaste, w => w.wasteDate, w => w.total || 0);

    const exportWaste = () => {
      const detailRows = filteredWaste.flatMap(w => (w.items || []).map(i => ({
        'Waste Number': w.wasteNumber,
        'Date': w.wasteDate?.split('T')[0] || '',
        'Location': getName(locations, w.locationId),
        'Reason': w.reason,
        'Item': i.itemName,
        'Quantity': i.quantity,
        'Unit Rate': i.unitRate,
        'Amount': (i.quantity || 0) * (i.unitRate || 0),
      })));
      const summaryRows = byReasonData.map(r => ({ 'Reason': r.name, 'Total Value': r.value.toFixed(2) }));
      exportToExcel([
        { name: 'Waste Details', data: detailRows, headers: Object.keys(detailRows[0] || { 'No Data': '' }) },
        { name: 'Waste By Reason', data: summaryRows, headers: Object.keys(summaryRows[0] || { 'No Data': '' }) },
      ], 'Waste_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Records" value={filteredWaste.length} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" />
          <KPICard title="Total Qty Wasted" value={totalQty.toFixed(2)} icon={Package} color="text-orange-600" bgColor="bg-orange-50" />
          <KPICard title="Total Waste Value" value={formatCurrency(totalValue)} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" />
          <KPICard title="Waste Reasons" value={Object.keys(byReason).length} icon={RotateCcw} color="text-purple-600" bgColor="bg-purple-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Waste Value by Reason</SectionTitle>
              {byReasonData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byReasonData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Waste Trend (Monthly)</SectionTitle>
              {trend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                    <Line type="monotone" dataKey="value" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 4 }} name="Waste Value" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <SectionTitle>Top Wasted Items (by Value)</SectionTitle>
            {byItemData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byItemData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                  <Bar dataKey="value" fill={CHART_COLORS[4]} radius={[0, 4, 4, 0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Waste Records</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportWaste}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Waste No.', 'Date', 'Location', 'Reason', 'Items', 'Total Value'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredWaste.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filteredWaste.slice(0, 30).map(w => (
                    <tr key={w.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3 font-medium">{w.wasteNumber}</td>
                      <td className="py-2 px-3">{w.wasteDate?.split('T')[0]}</td>
                      <td className="py-2 px-3">{getName(locations, w.locationId)}</td>
                      <td className="py-2 px-3"><span className="text-xs font-semibold px-2 py-0.5 bg-red-50 text-red-600 rounded-lg">{w.reason}</span></td>
                      <td className="py-2 px-3">{(w.items || []).length}</td>
                      <td className="py-2 px-3 font-semibold text-red-600">{formatCurrency(w.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CONSUMPTION / ISSUE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderConsumption = () => {
    const filteredIssues = issues.filter(i =>
      i.status === 'CONFIRMED' &&
      inDateRange(i.issueDate) &&
      (locationFilter === 'ALL' || i.fromLocationId === locationFilter)
    );

    const totalValue = filteredIssues.reduce((s, i) => s + (i.total || 0), 0);
    const totalItems = filteredIssues.reduce((s, i) => s + (i.items || []).length, 0);

    const byDept = filteredIssues.reduce((acc, i) => {
      const d = i.department || 'General';
      acc[d] = (acc[d] || 0) + (i.total || 0);
      return acc;
    }, {});
    const byDeptData = Object.entries(byDept).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const byItem = {};
    filteredIssues.forEach(iss => (iss.items || []).forEach(i => {
      byItem[i.itemName] = (byItem[i.itemName] || 0) + (i.quantity || 0) * (i.unitRate || 0);
    }));
    const byItemData = Object.entries(byItem).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    const trend = groupByMonth(filteredIssues, i => i.issueDate, i => i.total || 0);

    const exportConsumption = () => {
      const rows = filteredIssues.flatMap(iss => (iss.items || []).map(i => ({
        'Issue Number': iss.issueNumber,
        'Date': iss.issueDate?.split('T')[0] || '',
        'From Location': getName(locations, iss.fromLocationId),
        'Department': iss.department || '',
        'Item': i.itemName,
        'Quantity': i.quantity,
        'Unit Rate': i.unitRate,
        'Amount': (i.quantity || 0) * (i.unitRate || 0),
      })));
      exportToExcel([
        { name: 'Issue Details', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) },
        { name: 'By Department', data: byDeptData.map(d => ({ 'Department': d.name, 'Value': d.value.toFixed(2) })), headers: ['Department', 'Value'] },
      ], 'Consumption_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Issues" value={filteredIssues.length} icon={Package} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Total Issue Value" value={formatCurrency(totalValue)} icon={TrendingDown} color="text-primary" bgColor="bg-orange-50" />
          <KPICard title="Items Issued" value={totalItems} icon={ClipboardList} color="text-emerald-600" bgColor="bg-emerald-50" />
          <KPICard title="Departments" value={Object.keys(byDept).length} icon={Users} color="text-purple-600" bgColor="bg-purple-50" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Consumption by Department</SectionTitle>
              {byDeptData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byDeptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                    <Bar dataKey="value" fill={CHART_COLORS[1]} name="Value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Consumption Trend (Monthly)</SectionTitle>
              {trend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                    <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 4 }} name="Issue Value" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-5">
            <SectionTitle>Top Consumed Items</SectionTitle>
            {byItemData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byItemData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                  <Bar dataKey="value" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Issue Records</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportConsumption}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Issue No.', 'Date', 'From Location', 'Department', 'Items', 'Total'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredIssues.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filteredIssues.slice(0, 30).map(i => (
                    <tr key={i.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3 font-medium">{i.issueNumber}</td>
                      <td className="py-2 px-3">{i.issueDate?.split('T')[0]}</td>
                      <td className="py-2 px-3">{getName(locations, i.fromLocationId)}</td>
                      <td className="py-2 px-3">{i.department || '-'}</td>
                      <td className="py-2 px-3">{(i.items || []).length}</td>
                      <td className="py-2 px-3 font-semibold">{formatCurrency(i.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSFER REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderTransfers = () => {
    const filteredTransfers = transfers.filter(t =>
      t.status === 'CONFIRMED' &&
      inDateRange(t.transferDate) &&
      (locationFilter === 'ALL' || t.fromLocationId === locationFilter || t.toLocationId === locationFilter)
    );

    const totalValue = filteredTransfers.reduce((s, t) => s + (t.total || 0), 0);
    const locActivity = {};
    filteredTransfers.forEach(t => {
      locActivity[getName(locations, t.fromLocationId)] = (locActivity[getName(locations, t.fromLocationId)] || 0) + 1;
      locActivity[getName(locations, t.toLocationId)] = (locActivity[getName(locations, t.toLocationId)] || 0) + 1;
    });
    const locData = Object.entries(locActivity).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    const exportTransfers = () => {
      const rows = filteredTransfers.flatMap(t => (t.items || []).map(i => ({
        'Transfer Number': t.transferNumber,
        'Date': t.transferDate?.split('T')[0] || '',
        'From': getName(locations, t.fromLocationId),
        'To': getName(locations, t.toLocationId),
        'Item': i.itemName,
        'Quantity': i.quantity,
        'Unit Rate': i.unitRate,
        'Amount': (i.quantity || 0) * (i.unitRate || 0),
      })));
      exportToExcel([{ name: 'Transfer Details', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) }], 'Transfer_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Transfers" value={filteredTransfers.length} icon={ArrowRightLeft} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Transfer Value" value={formatCurrency(totalValue)} icon={TrendingUp} color="text-primary" bgColor="bg-orange-50" />
          <KPICard title="Active Locations" value={Object.keys(locActivity).length} icon={Package} color="text-emerald-600" bgColor="bg-emerald-50" />
          <KPICard title="Items Transferred" value={filteredTransfers.reduce((s, t) => s + (t.items || []).length, 0)} icon={ClipboardList} color="text-purple-600" bgColor="bg-purple-50" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Location Activity</SectionTitle>
              {locData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={locData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[3]} name="Transfers" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Transfers Timeline</SectionTitle>
              {filteredTransfers.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={groupByMonth(filteredTransfers, t => t.transferDate, () => 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 4 }} name="Transfers" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Transfer Records</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportTransfers}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Transfer No.', 'Date', 'From', 'To', 'Items', 'Total'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredTransfers.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filteredTransfers.slice(0, 30).map(t => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3 font-medium">{t.transferNumber}</td>
                      <td className="py-2 px-3">{t.transferDate?.split('T')[0]}</td>
                      <td className="py-2 px-3">{getName(locations, t.fromLocationId)}</td>
                      <td className="py-2 px-3">{getName(locations, t.toLocationId)}</td>
                      <td className="py-2 px-3">{(t.items || []).length}</td>
                      <td className="py-2 px-3 font-semibold">{formatCurrency(t.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ADJUSTMENT / STOCK COUNT REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderAdjustments = () => {
    const filteredAdj = adjustments.filter(a =>
      a.status === 'CONFIRMED' &&
      inDateRange(a.adjustmentDate) &&
      (locationFilter === 'ALL' || a.locationId === locationFilter)
    );
    const filteredCounts = stockCounts.filter(sc =>
      sc.status === 'CONFIRMED' &&
      inDateRange(sc.countDate)
    );

    const totalPositive = filteredAdj.reduce((s, a) => s + (a.items || []).filter(i => (i.differenceQuantity || 0) > 0).reduce((ss, i) => ss + (i.differenceValue || 0), 0), 0);
    const totalNegative = filteredAdj.reduce((s, a) => s + (a.items || []).filter(i => (i.differenceQuantity || 0) < 0).reduce((ss, i) => ss + Math.abs(i.differenceValue || 0), 0), 0);

    const exportAdj = () => {
      const rows = filteredAdj.flatMap(a => (a.items || []).map(i => ({
        'Adjustment Number': a.adjustmentNumber,
        'Date': a.adjustmentDate?.split('T')[0] || '',
        'Location': getName(locations, a.locationId),
        'Item': i.itemName,
        'System Qty': i.systemQuantity,
        'Physical Qty': i.physicalQuantity,
        'Difference': i.differenceQuantity,
        'Unit Rate': i.unitRate,
        'Variance Value': i.differenceValue,
      })));
      exportToExcel([{ name: 'Adjustment Details', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) }], 'Adjustment_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Confirmed Adjustments" value={filteredAdj.length} icon={ClipboardList} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Stock Counts Confirmed" value={filteredCounts.length} icon={Package} color="text-primary" bgColor="bg-orange-50" />
          <KPICard title="Positive Variance" value={formatCurrency(totalPositive)} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" subtitle="Stock increases" />
          <KPICard title="Negative Variance" value={formatCurrency(totalNegative)} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" subtitle="Stock shrinkage" />
        </div>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Adjustment Records</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportAdj}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Adj No.', 'Date', 'Location', 'Items', 'Positive Variance', 'Negative Variance', 'Net Value'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredAdj.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filteredAdj.slice(0, 30).map(a => {
                    const pos = (a.items || []).filter(i => (i.differenceQuantity || 0) > 0).reduce((s, i) => s + (i.differenceValue || 0), 0);
                    const neg = (a.items || []).filter(i => (i.differenceQuantity || 0) < 0).reduce((s, i) => s + Math.abs(i.differenceValue || 0), 0);
                    return (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-canvas/50">
                        <td className="py-2 px-3 font-medium">{a.adjustmentNumber}</td>
                        <td className="py-2 px-3">{a.adjustmentDate?.split('T')[0]}</td>
                        <td className="py-2 px-3">{getName(locations, a.locationId)}</td>
                        <td className="py-2 px-3">{(a.items || []).length}</td>
                        <td className="py-2 px-3 text-emerald-600 font-semibold">{formatCurrency(pos)}</td>
                        <td className="py-2 px-3 text-red-600 font-semibold">{formatCurrency(neg)}</td>
                        <td className="py-2 px-3 font-bold">{formatCurrency(pos - neg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LOW STOCK REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderLowStock = () => {
    const stockSummary = items.filter(i => i.status === 'ACTIVE').map(item => {
      const totalStock = stock.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.quantity, 0);
      const reorderLevel = item.reorderLevel || 0;
      const category = categories.find(c => c.id === item.categoryId);
      const supplier = suppliers.find(s => s.id === item.preferredSupplierId);
      const uom = uoms.find(u => u.id === item.baseUomId);
      let status = 'NORMAL';
      if (totalStock <= 0) status = 'OUT_OF_STOCK';
      else if (totalStock <= reorderLevel * 0.5) status = 'CRITICAL';
      else if (totalStock <= reorderLevel) status = 'LOW';
      return { ...item, totalStock, reorderLevel, categoryName: category?.name, supplierName: supplier?.name, uomCode: uom?.code, status, stockValue: totalStock * (item.currentRate || 0) };
    });

    const outOfStock = stockSummary.filter(i => i.status === 'OUT_OF_STOCK');
    const critical = stockSummary.filter(i => i.status === 'CRITICAL');
    const lowStock = stockSummary.filter(i => i.status === 'LOW');
    const belowReorder = [...outOfStock, ...critical, ...lowStock];

    const byCat = belowReorder.reduce((acc, i) => { acc[i.categoryName || 'Unknown'] = (acc[i.categoryName || 'Unknown'] || 0) + 1; return acc; }, {});
    const byCatData = Object.entries(byCat).map(([name, count]) => ({ name, count }));

    const exportLowStock = () => {
      const rows = belowReorder.map(i => ({
        'Item': i.name,
        'Code': i.code,
        'Category': i.categoryName,
        'Current Stock': i.totalStock,
        'Reorder Level': i.reorderLevel,
        'UOM': i.uomCode,
        'Preferred Supplier': i.supplierName,
        'Unit Rate': i.currentRate || 0,
        'Stock Value': i.stockValue.toFixed(2),
        'Status': i.status,
      }));
      exportToExcel([{ name: 'Low Stock Items', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) }], 'Low_Stock_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Out of Stock" value={outOfStock.length} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" />
          <KPICard title="Critical" value={critical.length} subtitle="≤ 50% of reorder" icon={TrendingDown} color="text-orange-600" bgColor="bg-orange-50" />
          <KPICard title="Low Stock" value={lowStock.length} subtitle="Below reorder level" icon={Package} color="text-amber-600" bgColor="bg-amber-50" />
          <KPICard title="Items Below Reorder" value={belowReorder.length} icon={BarChart2} color="text-primary" bgColor="bg-orange-50" />
        </div>
        <Card>
          <CardContent className="p-5">
            <SectionTitle>Low Stock by Category</SectionTitle>
            {byCatData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byCatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS[4]} name="Items" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Items Below Reorder Level</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportLowStock}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Item', 'Category', 'Current Stock', 'Reorder Level', 'Supplier', 'Status'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {belowReorder.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">All stock levels are normal</td></tr>
                  ) : belowReorder.map(i => (
                    <tr key={i.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3"><div className="font-semibold">{i.name}</div><div className="text-xs text-text-muted">{i.code}</div></td>
                      <td className="py-2 px-3">{i.categoryName}</td>
                      <td className="py-2 px-3 font-bold text-red-600">{i.totalStock} {i.uomCode}</td>
                      <td className="py-2 px-3">{i.reorderLevel} {i.uomCode}</td>
                      <td className="py-2 px-3">{i.supplierName || '-'}</td>
                      <td className="py-2 px-3"><Badge variant={i.status === 'OUT_OF_STOCK' || i.status === 'CRITICAL' ? 'danger' : 'warning'}>{i.status.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SUPPLIER REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderSuppliers = () => {
    const supplierStats = suppliers.map(sup => {
      const supPOs = pos.filter(p => p.supplierId === sup.id && inDateRange(p.orderDate));
      const supGRNs = grns.filter(g => g.supplierId === sup.id && inDateRange(g.grnDate));
      const purchaseValue = supGRNs.filter(g => g.status === 'CONFIRMED').reduce((s, g) =>
        s + (g.items || []).reduce((ss, i) => ss + (i.acceptedQuantity || 0) * (i.unitRate || 0), 0), 0);
      const rejectedGoods = supGRNs.reduce((s, g) => s + (g.items || []).reduce((ss, i) => ss + (i.rejectedQuantity || 0), 0), 0);
      return { ...sup, poCount: supPOs.length, grnCount: supGRNs.length, purchaseValue, rejectedGoods };
    }).filter(s => s.poCount > 0 || s.grnCount > 0);

    const topSuppliers = [...supplierStats].sort((a, b) => b.purchaseValue - a.purchaseValue).slice(0, 8).map(s => ({ name: s.name, value: s.purchaseValue }));

    const exportSuppliers = () => {
      const rows = supplierStats.map(s => ({
        'Supplier': s.name,
        'Purchase Orders': s.poCount,
        'GRNs': s.grnCount,
        'Purchase Value': s.purchaseValue.toFixed(2),
        'Rejected Goods': s.rejectedGoods,
        'Status': s.status,
      }));
      exportToExcel([{ name: 'Supplier Summary', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) }], 'Supplier_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Suppliers with Activity" value={supplierStats.length} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Total Purchase Value" value={formatCurrency(supplierStats.reduce((s, x) => s + x.purchaseValue, 0))} icon={ShoppingCart} color="text-primary" bgColor="bg-orange-50" />
          <KPICard title="Total POs" value={supplierStats.reduce((s, x) => s + x.poCount, 0)} icon={Package} color="text-emerald-600" bgColor="bg-emerald-50" />
          <KPICard title="Total Rejected Items" value={supplierStats.reduce((s, x) => s + x.rejectedGoods, 0)} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" />
        </div>
        <Card>
          <CardContent className="p-5">
            <SectionTitle>Purchase Distribution by Supplier</SectionTitle>
            {topSuppliers.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topSuppliers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                  <Bar dataKey="value" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Supplier Performance</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportSuppliers}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Supplier', 'POs', 'GRNs', 'Purchase Value', 'Rejected Goods', 'Status'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {supplierStats.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : supplierStats.sort((a, b) => b.purchaseValue - a.purchaseValue).map(s => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3 font-semibold">{s.name}</td>
                      <td className="py-2 px-3">{s.poCount}</td>
                      <td className="py-2 px-3">{s.grnCount}</td>
                      <td className="py-2 px-3 font-bold text-primary">{formatCurrency(s.purchaseValue)}</td>
                      <td className="py-2 px-3">{s.rejectedGoods > 0 ? <span className="text-red-600 font-semibold">{s.rejectedGoods}</span> : '-'}</td>
                      <td className="py-2 px-3"><Badge variant={s.status === 'ACTIVE' ? 'success' : 'secondary'}>{s.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // REIMBURSEMENT REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const renderReimbursements = () => {
    const filtered = reimbursements.filter(r =>
      inDateRange(r.reimbursementDate) &&
      (statusFilter === 'ALL' || r.status === statusFilter)
    );

    const pending = filtered.filter(r => r.status === 'PENDING');
    const approved = filtered.filter(r => r.status === 'APPROVED');
    const paid = filtered.filter(r => r.status === 'PAID');
    const rejected = filtered.filter(r => r.status === 'REJECTED');

    const statusData = [
      { name: 'Pending', value: pending.reduce((s, r) => s + r.amount, 0) },
      { name: 'Approved', value: approved.reduce((s, r) => s + r.amount, 0) },
      { name: 'Paid', value: paid.reduce((s, r) => s + r.amount, 0) },
      { name: 'Rejected', value: rejected.reduce((s, r) => s + r.amount, 0) },
    ].filter(d => d.value > 0);

    const trend = groupByMonth(filtered, r => r.reimbursementDate, r => r.amount);

    const exportReimb = () => {
      const rows = filtered.map(r => ({
        'Reference': r.reimbursementNumber,
        'Date': r.reimbursementDate?.split('T')[0] || '',
        'Employee': r.employeeName || getName(users, r.userId),
        'Source': r.purchaseSource,
        'Reason': r.reason,
        'Amount': r.amount,
        'Status': r.status,
        'Notes': r.notes || '',
      }));
      exportToExcel([
        { name: 'Reimbursement Details', data: rows, headers: Object.keys(rows[0] || { 'No Data': '' }) },
        { name: 'Status Summary', data: statusData.map(s => ({ 'Status': s.name, 'Total Amount': s.value.toFixed(2) })), headers: ['Status', 'Total Amount'] },
      ], 'Reimbursement_Report.xlsx');
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Pending" value={formatCurrency(pending.reduce((s, r) => s + r.amount, 0))} subtitle={`${pending.length} requests`} icon={Banknote} color="text-amber-600" bgColor="bg-amber-50" />
          <KPICard title="Approved (Unpaid)" value={formatCurrency(approved.reduce((s, r) => s + r.amount, 0))} subtitle={`${approved.length} requests`} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" />
          <KPICard title="Paid" value={formatCurrency(paid.reduce((s, r) => s + r.amount, 0))} subtitle={`${paid.length} requests`} icon={Banknote} color="text-emerald-600" bgColor="bg-emerald-50" />
          <KPICard title="Rejected" value={formatCurrency(rejected.reduce((s, r) => s + r.amount, 0))} subtitle={`${rejected.length} requests`} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Reimbursement by Status</SectionTitle>
              {statusData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <SectionTitle>Monthly Reimbursement Trend</SectionTitle>
              {trend.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip formatter={v => formatCurrency(v)} />} />
                    <Line type="monotone" dataKey="value" stroke={CHART_COLORS[5]} strokeWidth={2} dot={{ r: 4 }} name="Amount" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Reimbursement Records</SectionTitle>
              <Button size="sm" variant="outline" onClick={exportReimb}><Download className="w-4 h-4 mr-2" />Export Excel</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">{['Reference', 'Date', 'Employee', 'Source', 'Amount', 'Status'].map(h => <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-text-muted">{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-text-muted text-sm">No data for selected filters</td></tr>
                  ) : filtered.slice(0, 30).map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-canvas/50">
                      <td className="py-2 px-3 font-medium">{r.reimbursementNumber}</td>
                      <td className="py-2 px-3">{r.reimbursementDate?.split('T')[0]}</td>
                      <td className="py-2 px-3">{r.employeeName || getName(users, r.userId)}</td>
                      <td className="py-2 px-3">{r.purchaseSource}</td>
                      <td className="py-2 px-3 font-semibold">{formatCurrency(r.amount)}</td>
                      <td className="py-2 px-3">
                        <Badge variant={r.status === 'PAID' ? 'success' : r.status === 'PENDING' ? 'warning' : r.status === 'APPROVED' ? 'primary' : 'danger'}>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderReport = () => {
    switch (activeReport) {
      case 'purchases': return renderPurchases();
      case 'stockMovement': return renderStockMovement();
      case 'waste': return renderWaste();
      case 'consumption': return renderConsumption();
      case 'transfers': return renderTransfers();
      case 'adjustments': return renderAdjustments();
      case 'lowStock': return renderLowStock();
      case 'suppliers': return renderSuppliers();
      case 'reimbursements': return renderReimbursements();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Reports" breadcrumbs="Inventory / Reports" />

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {reports.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`px-4 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
              activeReport === r.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-muted border border-border hover:text-text-main hover:bg-canvas/50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Date From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Date To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Location</label>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-full h-9 text-sm border border-border rounded-lg px-3 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="ALL">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full h-9 text-sm border border-border rounded-lg px-3 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Supplier</label>
              <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="w-full h-9 text-sm border border-border rounded-lg px-3 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="ALL">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 gap-2">
              <RefreshCw className="w-4 h-4" />Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {renderReport()}
    </div>
  );
}
