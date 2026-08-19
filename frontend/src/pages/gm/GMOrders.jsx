import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/currency';

const STATUS_COLORS = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  BILL_REQUESTED: 'bg-purple-100 text-purple-800',
  READY: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function GMOrders() {
  const orders = useSelector(state => state.orders?.data || []);
  const users = useSelector(state => state.users?.data || []);
  const tables = useSelector(state => state.tables?.data || []);
  const customers = useSelector(state => state.customers?.data || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const getTableName = (id) => tables.find(t => t.id === id)?.tableNumber || id;
  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || id;
  const getUserName = (id) => users.find(u => u.id === id)?.name || id;
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
  const getSafeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const tName = getTableName(o.tableId)?.toString().toLowerCase() || '';
        const cName = getCustomerName(o.customerId)?.toLowerCase() || '';
        return o.id?.toLowerCase().includes(q) || o.orderNumber?.toLowerCase().includes(q) || tName.includes(q) || cName.includes(q);
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter, tables, customers]);

  return (
    <div className="space-y-6 max-w-screen-2xl  pb-10">
      <PageHeader
        title="Orders Overview"
        breadcrumbs="RESTAURANT OPS / ORDERS"
      />

      <Card className="border-border/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <SearchInput
            placeholder="Search Order ID, Table, Customer..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1 min-w-[200px]"
          />
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="BILL_REQUESTED">BILL REQUESTED</option>
              <option value="READY">READY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="whitespace-nowrap">Order ID</TableHead>
                <TableHead className="whitespace-nowrap">Customer / Table</TableHead>
                <TableHead className="whitespace-nowrap">Assigned Staff</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-text-muted">
                    No orders available for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map(order => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded" title={order.id}>
                        {order.orderNumber || shortId(order.id)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {order.type === 'DINE_IN'
                        ? <span className="font-semibold text-primary">Table {getTableName(order.tableId)}</span>
                        : (order.customerId ? getCustomerName(order.customerId) : <span className="text-gray-400 italic">Walk-in</span>)
                      }
                    </TableCell>
                    <TableCell className="text-sm text-text-muted whitespace-nowrap">
                      {getUserName(order.waiterId || order.cashierId) || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'} variant="outline">
                        {order.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm whitespace-nowrap">
                      {formatCurrency(getSafeNum(order.totalAmount || order.grandTotal))}
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
