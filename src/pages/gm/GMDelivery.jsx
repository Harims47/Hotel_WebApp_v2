import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Truck, CheckCircle, Clock, AlertTriangle, User,
  Calendar, MapPin, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatCurrency } from '../../utils/currency';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const getSafeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

// Calculate expected delivery time (assuming 45 mins from order creation)
const getExpectedTime = (createdAt) => {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() + 45);
  return d;
};

// Check if delayed
const getDelayStatus = (delivery) => {
  const expected = getExpectedTime(delivery.createdAt);
  if (!expected) return { isDelayed: false, delayMin: 0 };

  const end = delivery.status === 'DELIVERED'
    ? new Date(delivery.deliveredAt || delivery.updatedAt)
    : new Date();

  if (end > expected) {
    const diff = Math.floor((end - expected) / 60000);
    return { isDelayed: diff > 0, delayMin: diff };
  }
  return { isDelayed: false, delayMin: 0 };
};


// ------------------------------------------------------------------
// Status Pipeline Configuration
// ------------------------------------------------------------------
const STATUSES = ['READY', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// ------------------------------------------------------------------
// Delivery Modal Component
// ------------------------------------------------------------------
function DeliveryDetailModal({ delivery, users, customers, orders, onClose }) {
  if (!delivery) return null;

  const expected = getExpectedTime(delivery.createdAt);
  const { isDelayed, delayMin } = getDelayStatus(delivery);
  const custName = customers.find(c => c.id === delivery.customerId)?.name || delivery.customerId || 'Unknown';
  const boyName = users.find(u => u.id === (delivery.assignedDeliveryUserId || delivery.deliveryBoyId))?.name || 'Unassigned';

  const events = [
    { label: 'Order Created', time: delivery.createdAt, status: 'READY' },
    { label: 'Assigned', time: delivery.assignedAt, status: 'ASSIGNED' },
    { label: 'Picked Up', time: delivery.pickedUpAt, status: 'PICKED_UP' },
    { label: 'Out for Delivery', time: delivery.outForDeliveryAt, status: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', time: delivery.deliveredAt, status: 'DELIVERED' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Delivery Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-border/50">
            <div><span className="text-gray-500 block text-xs">Delivery ID</span><span className="font-mono font-bold text-text-main">{delivery.id}</span></div>
            <div><span className="text-gray-500 block text-xs">Order ID</span><span className="font-mono text-text-main">{orders?.find(o => o.id === delivery.orderId)?.orderNumber || delivery.orderId}</span></div>
            <div><span className="text-gray-500 block text-xs">Customer</span><span className="font-medium text-text-main">{custName}</span></div>
            <div><span className="text-gray-500 block text-xs">Assigned Boy</span><span className="font-medium text-text-main">{boyName}</span></div>
            <div><span className="text-gray-500 block text-xs">Expected Time</span><span>{expected ? expected.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</span></div>
            <div><span className="text-gray-500 block text-xs">Order Amount</span><span className="font-bold text-green-600">{formatCurrency(getSafeNum(delivery.grandTotal || delivery.amount))}</span></div>

            {isDelayed && (
              <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center text-red-700 mt-2">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <strong>DELAYED:</strong> <span className="ml-2 font-medium">By {delayMin} minutes</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-text-main border-b pb-2 mb-4">Shipment Timeline (Actual Times)</h3>
            <div className="relative border-l-2 border-gray-200 ml-4 space-y-6">
              {events.map((evt, idx) => {
                const isPast = STATUSES.indexOf(evt.status) <= STATUSES.indexOf(delivery.status) && delivery.status !== 'CANCELLED';
                const hasTime = !!evt.time;
                return (
                  <div key={idx} className="relative pl-6">
                    <span className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-2 ${isPast && hasTime ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                      } flex items-center justify-center`}>
                      {isPast && hasTime && <CheckCircle className="w-3 h-3 text-white" />}
                    </span>
                    <h4 className={`font-semibold text-sm ${isPast ? 'text-text-main' : 'text-gray-400'}`}>{evt.label}</h4>
                    <span className="text-xs text-gray-500 font-mono">
                      {hasTime ? new Date(evt.time).toLocaleString('en-IN') : (isPast ? 'Processing...' : 'Pending')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export function GMDelivery() {
  const deliveries = useSelector(state => state.delivery?.data || []);
  const users = useSelector(state => state.users?.data || []);
  const customers = useSelector(state => state.customers?.data || []);
  const orders = useSelector(state => state.orders?.data || []);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Auto-refresh triggers
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000); // 1 min update for delays
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Map deliveries with order amount if missing
  const mappedDeliveries = useMemo(() => deliveries.map(d => {
    const o = orders.find(ord => ord.id === d.orderId);
    return { ...d, grandTotal: d.grandTotal || o?.grandTotal || 0 };
  }), [deliveries, orders]);

  // Filtering
  const filtered = useMemo(() => mappedDeliveries.filter(d => {
    if (filterStatus === 'DELAYED') {
      return getDelayStatus(d).isDelayed && d.status !== 'DELIVERED' && d.status !== 'CANCELLED';
    }
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const custName = customers.find(c => c.id === d.customerId)?.name || '';
      return d.id.toLowerCase().includes(q) || d.orderId?.toLowerCase().includes(q) || custName.toLowerCase().includes(q);
    }
    return true;
  }), [mappedDeliveries, search, filterStatus, customers]);

  // Status breakdown
  const statusCounts = {};
  STATUSES.forEach(s => statusCounts[s] = 0);
  mappedDeliveries.forEach(d => {
    if (statusCounts[d.status] !== undefined) statusCounts[d.status]++;
  });

  const delayedCount = mappedDeliveries.filter(d => getDelayStatus(d).isDelayed && d.status !== 'DELIVERED').length;

  // Avg delivery time (delivered today)
  const deliveredToday = mappedDeliveries.filter(d => d.status === 'DELIVERED' && d.createdAt?.startsWith(todayStr) && d.deliveredAt);
  const avgTime = deliveredToday.length > 0
    ? Math.floor(deliveredToday.reduce((sum, d) => sum + (new Date(d.deliveredAt) - new Date(d.createdAt)), 0) / deliveredToday.length / 60000)
    : 0;

  return (
    <div className="space-y-6 max-w-screen-2xl  pb-10">
      <PageHeader
        title="Delivery & Shipment Monitoring"
        breadcrumbs="MANAGEMENT / DELIVERY"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="p-4 bg-white rounded-xl border border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-2xl font-bold text-text-main">{mappedDeliveries.length}</span><span className="text-xs text-text-muted uppercase font-medium mt-1">Total Deliveries</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-2xl font-bold text-blue-600">{statusCounts['READY'] + statusCounts['ASSIGNED'] + statusCounts['PICKED_UP'] + statusCounts['OUT_FOR_DELIVERY']}</span><span className="text-xs text-text-muted uppercase font-medium mt-1">Pending</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-2xl font-bold text-orange-600">{statusCounts['OUT_FOR_DELIVERY']}</span><span className="text-xs text-text-muted uppercase font-medium mt-1">Out for Delivery</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-2xl font-bold text-green-600">{statusCounts['DELIVERED']}</span><span className="text-xs text-text-muted uppercase font-medium mt-1">Delivered</span>
        </div>
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col justify-center items-center text-center">
          <span className="text-2xl font-bold text-red-600">{delayedCount}</span><span className="text-xs text-red-800 uppercase font-medium mt-1">Delayed</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-2xl font-bold text-purple-600">{avgTime}m</span><span className="text-xs text-text-muted uppercase font-medium mt-1">Avg Time (Today)</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-border/50 shadow-sm">
        <SearchInput placeholder="Search Order/Delivery ID..." value={search} onChange={setSearch} className="w-full md:w-64" />
        <div className="w-full md:w-48">
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="DELAYED">Delayed Only</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
        </div>
      </div>

      {/* Table View */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Delivery ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Assigned Boy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-text-muted">
                    No deliveries available for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(d => {
                  const { isDelayed, delayMin } = getDelayStatus(d);
                  const boyName = users.find(u => u.id === (d.assignedDeliveryUserId || d.deliveryBoyId))?.name || 'Unassigned';
                  const custName = customers.find(c => c.id === d.customerId)?.name || d.customerId || 'Unknown';
                  const order = orders.find(o => o.id === d.orderId);

                  return (
                    <TableRow key={d.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedDelivery(d)}>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded" title={d.id}>
                            {d.deliveryNumber || `DLV-${d.id.split('-')[0]}`}
                          </span>
                          {isDelayed && d.status !== 'DELIVERED' && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">DELAYED {delayMin}m</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-text-muted bg-gray-100 px-2 py-1 rounded" title={d.orderId}>
                          {order?.orderNumber || `ORD-${d.orderId?.split('-')[0]}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-text-main">
                        {custName}
                      </TableCell>
                      <TableCell className="text-sm text-text-muted">
                        {boyName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={d.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {d.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-green-600">
                        {formatCurrency(getSafeNum(d.grandTotal))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      {selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          users={users}
          customers={customers}
          orders={orders}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </div>
  );
}
