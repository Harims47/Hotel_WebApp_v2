import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMOrders() {
  const orders = useSelector(state => state.orders.data) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.tableId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.customerId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || o.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [orders, searchTerm, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Orders Overview</h1>
      
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search Order ID, Table, Customer..." 
            className="border p-2 rounded flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="border p-2 rounded w-full md:w-48"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="DINE_IN">DINE_IN</option>
            <option value="TAKEAWAY">TAKEAWAY</option>
          </select>
          <select 
            className="border p-2 rounded w-full md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="READY">READY</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-sm">Order ID</th>
                <th className="p-4 font-semibold text-sm">Type</th>
                <th className="p-4 font-semibold text-sm">Table/Customer</th>
                <th className="p-4 font-semibold text-sm">Staff</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm">{order.id}</td>
                    <td className="p-4 text-sm">{order.type}</td>
                    <td className="p-4 text-sm">{order.type === 'DINE_IN' ? `Table ${order.tableId}` : (order.customerId || 'Walk-in')}</td>
                    <td className="p-4 text-sm">{order.waiterId || order.cashierId || '-'}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">₹{order.totalAmount || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
