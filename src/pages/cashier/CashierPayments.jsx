import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CreditCard, Receipt, Clock, User, CheckCircle2, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function CashierPayments() {
  const payments = useSelector(state => state.payments.data);
  const bills = useSelector(state => state.billing.data);
  const users = useSelector(state => state.users.data);

  const [searchQuery, setSearchQuery] = useState('');

  const sortedPayments = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const displayedPayments = sortedPayments.filter(payment => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const bill = bills.find(b => b.id === payment.billId);
    return (
      payment.paymentNumber?.toLowerCase().includes(q) ||
      bill?.billNumber?.toLowerCase().includes(q) ||
      payment.id?.toLowerCase().includes(q)
    );
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-canvas max-w-7xl mx-auto w-full">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <PageHeader 
          title="Payment History" 
          description="View all recorded payments and their details."
        />
        <div className="mt-4 flex items-center relative max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3" />
          <input 
            type="text" 
            placeholder="Search by Payment ID or Bill No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-8 mt-2">
        {displayedPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl shadow-sm">
            <CreditCard className="w-12 h-12 text-text-faint mb-4" />
            <p className="font-bold text-lg text-text-main">No payments recorded</p>
            <p className="text-sm text-text-muted mt-1">Payment history will appear here once transactions are processed.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface/50 text-text-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Payment ID</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Bill No</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Amount</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Method</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Received By</th>
                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedPayments.map(payment => {
                    const bill = bills.find(b => b.id === payment.billId);
                    const cashier = users.find(u => u.id === payment.receivedBy);
                    
                    return (
                      <tr key={payment.id} className="hover:bg-surface/30 transition-colors group">
                        <td className="px-5 py-3 font-semibold text-text-main">
                          {payment.paymentNumber}
                        </td>
                        <td className="px-5 py-3">
                          <Link 
                            to={`/cashier/bills/${bill?.id}`} 
                            className="text-primary font-bold hover:underline flex items-center gap-1.5 w-fit"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            {bill?.billNumber || 'Unknown'}
                          </Link>
                        </td>
                        <td className="px-5 py-3 font-black text-text-main text-base">
                          ₹{payment.amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-bold text-text-sub">
                            {payment.method}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {payment.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 bg-status-success/10 text-status-success border border-status-success/20 px-2.5 py-1 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PAID
                            </span>
                          ) : (
                            <StatusPill status={payment.status} />
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 text-text-sub font-medium">
                            <User className="w-3.5 h-3.5" />
                            {cashier?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-main">{formatDate(payment.createdAt)}</span>
                            <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTime(payment.createdAt)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
