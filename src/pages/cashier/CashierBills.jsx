import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Receipt, ArrowRight, XCircle, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function CashierBills() {
  const navigate = useNavigate();
  const bills = useSelector(state => state.billing.data);
  const tables = useSelector(state => state.tables.data);
  const orders = useSelector(state => state.orders.data);

  const [activeTab, setActiveTab] = useState('REQUESTED'); // 'REQUESTED', 'PAID', 'ALL'
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="px-4 md:px-6 pt-4 pb-2">
        <PageHeader 
          title="Bills" 
          description="Manage bill requests, payments and billing status."
          actions={
            <Tabs>
              <TabsList>
                <TabsTrigger isActive={activeTab === 'REQUESTED'} onClick={() => setActiveTab('REQUESTED')}>
                  Requests
                </TabsTrigger>
                <TabsTrigger isActive={activeTab === 'PAID'} onClick={() => setActiveTab('PAID')}>
                  Paid
                </TabsTrigger>
                <TabsTrigger isActive={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>
                  All Bills
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
        <div className="mt-4 flex items-center relative max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3" />
          <input 
            type="text" 
            placeholder="Search by Bill No or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
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
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {filteredBills.map(bill => {
              const table = tables.find(t => t.id === bill.tableId);
              const order = orders.find(o => o.id === bill.orderId);
              
              return (
                <div 
                  key={bill.id} 
                  className={cn(
                    "flex flex-col bg-white rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:border-border-strong hover:shadow-md cursor-pointer",
                    bill.status === 'REQUESTED' ? "ring-1 ring-primary/20" : ""
                  )}
                  onClick={() => navigate(`/cashier/bills/${bill.id}`)}
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b border-border bg-surface/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-main text-sm">{bill.billNumber}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(bill.createdAt)}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-0.5">Table / Source</p>
                          <p className="text-sm font-bold text-text-main">
                            {table?.tableNumber ? `Table ${table.tableNumber}` : bill.orderType || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-0.5">Amount</p>
                          <p className="text-lg font-black text-primary leading-none">
                            ₹{bill.grandTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-text-sub bg-surface/50 p-2 rounded-lg border border-border">
                        <Receipt className="w-3.5 h-3.5 text-text-muted" />
                        Order: {order?.orderNumber || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
                      <StatusPill status={bill.status} />
                      
                      <div className="flex items-center text-xs font-bold text-primary group">
                        View Details
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
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
