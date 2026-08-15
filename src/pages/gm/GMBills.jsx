import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMBills() {
  const bills = useSelector(state => state.billing.data) || [];
  
  const billRequests = bills.filter(b => b.status === 'REQUESTED');
  const printedBills = bills.filter(b => b.status === 'PRINTED');
  const paidBills = bills.filter(b => b.paymentStatus === 'PAID');
  const paymentPending = bills.filter(b => b.paymentStatus === 'PENDING');

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
                  <td className="p-4 text-sm">{bill.id}</td>
                  <td className="p-4 text-sm">{bill.orderId}</td>
                  <td className="p-4 text-sm">{bill.orderType}</td>
                  <td className="p-4 text-sm">{bill.status}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${bill.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium">₹{bill.totalAmount}</td>
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
