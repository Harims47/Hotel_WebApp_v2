import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export function CashierPayments() {
  const payments = useSelector(state => state.payments.data);
  const bills = useSelector(state => state.billing.data);
  const users = useSelector(state => state.users.data);

  const sortedPayments = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Payment History</h1>
      
      {sortedPayments.length === 0 ? (
        <div className="text-text-muted">No payments recorded.</div>
      ) : (
        <Card className="border border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-text-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Payment ID</th>
                  <th className="px-6 py-4 font-semibold">Bill No</th>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Received By</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map(payment => {
                  const bill = bills.find(b => b.id === payment.billId);
                  const cashier = users.find(u => u.id === payment.receivedBy);
                  
                  return (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-text-main">{payment.paymentNumber}</td>
                      <td className="px-6 py-4 text-primary font-medium">{bill?.billNumber}</td>
                      <td className="px-6 py-4">{payment.orderId.substring(0, 12)}...</td>
                      <td className="px-6 py-4 font-bold text-text-main">₹{payment.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 font-semibold text-text-muted">{payment.method}</td>
                      <td className="px-6 py-4">
                        <Badge variant="success">{payment.status}</Badge>
                      </td>
                      <td className="px-6 py-4">{cashier?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
