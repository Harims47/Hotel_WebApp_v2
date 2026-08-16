import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMBills() {
  const bills = useSelector(state => state.billing.data) || [];
  const orders = useSelector(state => state.orders.data) || [];
  
  const billRequests = bills.filter(b => b.status === 'REQUESTED');
  const printedBills = bills.filter(b => b.status === 'PRINTED');
  const paidBills = bills.filter(b => b.status === 'PAID');
  const paymentPending = bills.filter(b => b.status !== 'PAID');
  const shortId = (id) => id ? (id.length > 8 ? id.substring(0, 8) + '...' : id) : '-';

  const getOrderType = (orderId) => orders.find(o => o.id === orderId)?.type || '-';

  const renderBillTable = (billsList, title) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-text-main">{title} ({billsList.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-sm">Bill ID</th>
              <th className="p-4 font-semibold text-sm">Order ID</th>
              <th className="p-4 font-semibold text-sm">Type</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm">Payment</th>
              <th className="p-4 font-semibold text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {billsList.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No records found.</td></tr>
            ) : (
              billsList.map(bill => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-sm font-mono text-gray-600" title={bill.id}>{shortId(bill.id)}</td>
                  <td className="p-4 text-sm font-mono text-gray-600" title={bill.orderId}>{shortId(bill.orderId)}</td>
                  <td className="p-4 text-sm">{getOrderType(bill.orderId)}</td>
                  <td className="p-4 text-sm">{bill.status}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {bill.status === 'PAID' ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium">₹{bill.grandTotal || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Billing Visibility</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {renderBillTable(billRequests, "Bill Requests")}
          {renderBillTable(paymentPending, "Payment Pending")}
        </div>
        <div>
          {renderBillTable(printedBills, "Printed Bills")}
          {renderBillTable(paidBills, "Paid Bills")}
        </div>
      </div>
    </div>
  );
}
