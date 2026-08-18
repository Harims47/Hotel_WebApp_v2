import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Receipt, ArrowRight, XCircle, Search } from 'lucide-react';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function CashierBills() {
  const navigate = useNavigate();
  const bills = useSelector(state => state.billing.data);
  const tables = useSelector(state => state.tables.data);
  const orders = useSelector(state => state.orders.data);
  const users = useSelector(state => state.users.data);

  const [activeTab, setActiveTab] = useState('REQUESTED'); // 'REQUESTED', 'PAID', 'ALL'
  const [searchQuery, setSearchQuery] = useState('');

  const requestedCount = bills.filter(b => b.status === 'REQUESTED' || b.status === 'PRINTED').length;
  const paidCount = bills.filter(b => b.status === 'PAID').length;
  const allCount = bills.length;

  const filteredBills = bills.filter(b => {
    let tabMatch = true;
    if (activeTab === 'REQUESTED') tabMatch = b.status === 'REQUESTED' || b.status === 'PRINTED';
    if (activeTab === 'PAID') tabMatch = b.status === 'PAID';

    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      searchMatch = b.billNumber?.toLowerCase().includes(q) || b.orderId?.toLowerCase().includes(q);
    }

    return tabMatch && searchMatch;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-canvas max-w-7xl mx-auto w-full">
      <div className="px-4 md:px-6 pt-4 pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3" />
          <input
            type="text"
            placeholder="Search by Bill No or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
        </div>
        <div className="hidden md:inline-flex items-center rounded-xl bg-canvas p-1.5 border border-border/60">
          <button 
            onClick={() => setActiveTab('REQUESTED')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'REQUESTED' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            Requests <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'REQUESTED' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{requestedCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab('PAID')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'PAID' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            Paid <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'PAID' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{paidCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap",
              activeTab === 'ALL' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60"
            )}
          >
            All Bills <span className={cn("inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-black", activeTab === 'ALL' ? "bg-white/20 text-white" : "bg-white text-text-main shadow-sm")}>{allCount}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-8 mt-4">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl shadow-sm">
            <Receipt className="w-12 h-12 text-text-faint mb-4" />
            <p className="font-bold text-lg text-text-main">No bills found</p>
            <p className="text-sm text-text-muted mt-1">There are no bills matching this filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {filteredBills.map(bill => {
              const table = tables.find(t => t.id === bill.tableId);
              const order = orders.find(o => o.id === bill.orderId);
              const waiter = users.find(u => u.id === order?.waiterId);

              return (
                <div
                  key={bill.id}
                  className={cn(
                    "flex flex-col bg-white rounded-[16px] border border-border/80 shadow-sm overflow-hidden transition-all hover:border-border-strong hover:shadow-md cursor-pointer",
                    bill.status === 'REQUESTED' ? "ring-1 ring-primary/20" : ""
                  )}
                  onClick={() => navigate(`/cashier/bills/${bill.id}`)}
                >
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-border/60 bg-white flex justify-between items-center">
                    <span className="font-black text-text-main text-base tracking-tight">{bill.billNumber}</span>
                    <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(bill.createdAt)}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <p className="text-[15px] font-bold text-text-main">
                            {table?.tableNumber ? `Table ${table.tableNumber}` : bill.orderType === 'TAKEAWAY' ? 'Takeaway' : 'N/A'}
                          </p>
                          <p className="text-sm font-medium text-text-muted mt-0.5">
                            {bill.orderType === 'DINE_IN' ? 'Dine-In' : bill.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                          </p>
                          {waiter && (
                            <p className="text-xs font-semibold text-text-sub mt-2 bg-surface inline-flex px-2 py-1 rounded-md border border-border/60">
                              Waiter: {waiter.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Amount</p>
                          <p className="text-lg font-black text-primary leading-none">
                            ₹{bill.grandTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-text-sub bg-surface/40 px-3 py-2.5 rounded-lg border border-border/60 w-fit">
                        <Receipt className="w-4 h-4 text-text-muted" />
                        Order: {order?.orderNumber || 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/60">
                      <StatusPill status={bill.status} />

                      <div className="flex items-center text-[13px] font-bold text-primary group">
                        View Details
                        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
