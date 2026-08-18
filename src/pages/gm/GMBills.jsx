import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatCurrency } from '../../utils/currency';
import { Receipt } from 'lucide-react';

const getSafeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;
const shortId = (id) => id ? (id.length > 8 ? id.substring(0, 8) + '...' : id) : '-';

export function GMBills() {
  const bills = useSelector(state => state.billing?.data || []);
  const orders = useSelector(state => state.orders?.data || []);

  const billRequests = bills.filter(b => b.status === 'PENDING' || b.status === 'REQUESTED');
  const printedBills = bills.filter(b => b.status === 'PRINTED');
  const paidBills = bills.filter(b => b.status === 'PAID');
  const paymentPending = bills.filter(b => b.status !== 'PAID' && b.status !== 'CANCELLED');

  const getOrderType = (orderId) => orders.find(o => o.id === orderId)?.type?.replace('_', ' ') || '-';

  const renderBillTable = (billsList, title, iconColor) => (
    <Card className="mb-6 border-border/50 shadow-sm">
      <CardHeader className="bg-gray-50/50 border-b border-border/50 pb-3">
        <CardTitle className="text-base text-text-main flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className={`w-4 h-4 ${iconColor}`} />
            {title}
          </div>
          <Badge variant="outline" className="bg-white text-gray-600">{billsList.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill / Order</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bill Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                  No bills in this category.
                </TableCell>
              </TableRow>
            ) : (
              billsList.map(bill => {
                const order = orders.find(o => o.id === bill.orderId);
                return (
                  <TableRow key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded w-fit" title={bill.id}>{bill.billNumber || `BILL-${shortId(bill.id)}`}</span>
                        <span className="text-[10px] font-mono text-gray-400 px-1.5" title={bill.orderId}>{order?.orderNumber || `ORD-${shortId(bill.orderId)}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getOrderType(bill.orderId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 text-gray-600">
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bill.status === 'PAID' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">PAID</Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">PENDING</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-right text-text-main">
                      {formatCurrency(getSafeNum(bill.grandTotal))}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-screen-2xl  pb-10">
      <PageHeader
        title="Billing Visibility"
        breadcrumbs="RESTAURANT OPS / BILLS"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {renderBillTable(billRequests, "Bill Requests / Pending", "text-blue-500")}
          {renderBillTable(paymentPending, "Awaiting Payment", "text-orange-500")}
        </div>
        <div className="space-y-6">
          {renderBillTable(printedBills, "Printed Bills", "text-purple-500")}
          {renderBillTable(paidBills, "Paid Bills", "text-emerald-500")}
        </div>
      </div>
    </div>
  );
}
