import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, SearchX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export function WaiterOrders() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const orders = useSelector(state => state.orders.data);
  const tables = useSelector(state => state.tables.data);
  const menuItems = useSelector(state => state.menu.items);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const myOrders = useMemo(() => {
    return orders
      .filter(o => o.waiterId === currentUser?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, currentUser]);

  const filteredOrders = useMemo(() => {
    return myOrders.filter(order => {
      // Status Filter
      if (activeTab === 'ACTIVE' && (order.status === 'CLOSED' || order.status === 'CANCELLED')) return false;
      if (activeTab === 'READY') {
        const hasReadyItems = order.items.some(i => i.status === 'READY');
        if (!hasReadyItems || order.status === 'CLOSED' || order.status === 'CANCELLED') return false;
      }
      if (activeTab === 'COMPLETED' && order.status !== 'CLOSED') return false;
      if (activeTab === 'CANCELLED' && order.status !== 'CANCELLED') return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const table = tables.find(t => t.id === order.tableId);
        const tableMatch = `T${table?.tableNumber}`.toLowerCase().includes(q) || `table ${table?.tableNumber}`.toLowerCase().includes(q);
        const idMatch = order.orderNumber.toLowerCase().includes(q);
        return tableMatch || idMatch;
      }

      return true;
    });
  }, [myOrders, activeTab, searchQuery, tables]);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight mb-2">Orders</h1>
          <p className="text-text-muted font-medium text-sm">
            Track active orders, kitchen progress, and completed orders.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center bg-surface p-2 rounded-2xl border border-border shadow-sm">
          <div className="flex overflow-x-auto custom-scrollbar gap-1 p-1">
            {['ALL', 'ACTIVE', 'READY', 'COMPLETED', 'CANCELLED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  activeTab === tab
                    ? "bg-primary text-white shadow-primary-sm"
                    : "text-text-muted hover:bg-canvas hover:text-text-main"
                )}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 px-1 pb-1 md:px-0 md:pb-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-canvas border border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-10"
            />
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-border rounded-2xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <SearchX className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-text-main mb-1">No orders found</h2>
            <p className="text-text-muted text-sm max-w-sm">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const table = tables.find(t => t.id === order.tableId);
            const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

            // Get KOT workflow visualization
            const hasOrdered = order.items.some(i => i.status === 'ORDERED');
            const hasPreparing = order.items.some(i => i.status === 'PREPARING');
            const hasReady = order.items.some(i => i.status === 'READY');
            const allServed = order.items.every(i => i.status === 'SERVED' || i.status === 'CANCELLED');

            let workflowStatus = [];
            if (order.status === 'CANCELLED') workflowStatus.push('CANCELLED');
            else if (order.status === 'CLOSED') workflowStatus.push('COMPLETED');
            else if (allServed && order.items.length > 0) workflowStatus.push('SERVED');
            else {
              if (hasOrdered) workflowStatus.push('ORDERED');
              if (hasPreparing) workflowStatus.push('PREPARING');
              if (hasReady) workflowStatus.push('READY');
            }

            return (
              <div
                key={order.id}
                className={cn(
                  "bg-surface border rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-sm cursor-pointer",
                  order.status === 'CANCELLED' ? "border-status-danger/30 bg-status-danger-bg/5" :
                    order.status === 'CLOSED' ? "border-border/50 bg-gray-50/50" :
                      "border-border"
                )}
                onClick={() => navigate(`/waiter/tables/${order.tableId}`)}
              >
                {/* Meta info block */}
                <div className="w-full md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-border/50 pb-3 md:pb-0 md:pr-4 flex flex-row md:flex-col justify-between md:justify-start items-start">
                  <div>
                    <h3 className="font-black text-text-main text-base">{order.orderNumber}</h3>
                    <p className="text-sm font-bold text-primary mt-0.5">TABLE T{table?.tableNumber || '?'}</p>
                  </div>
                  <div className="text-right md:text-left mt-0 md:mt-2">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{order.orderType}</p>
                    <p className="text-[10px] text-text-faint font-semibold mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Items preview block */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-main mb-1.5">{totalItems} items</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, idx) => {
                      const mItem = menuItems.find(m => m.id === item.menuItemId);
                      return (
                        <p key={idx} className="text-xs text-text-muted truncate">
                          {mItem?.name || 'Unknown'} <span className="font-semibold text-text-main">×{item.quantity}</span>
                        </p>
                      );
                    })}
                    {order.items.length > 2 && (
                      <p className="text-[10px] font-bold text-primary">+{order.items.length - 2} more items...</p>
                    )}
                  </div>
                </div>

                {/* Status & Action block */}
                <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-border/50 pt-3 md:pt-0">
                  {order.status === 'CANCELLED' ? (
                    <StatusPill status="CANCELLED" />
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {workflowStatus.map((s, i) => (
                        <React.Fragment key={i}>
                          <span className={cn(
                            s === 'READY' ? 'text-status-success' :
                              s === 'PREPARING' ? 'text-status-preparing' :
                                s === 'COMPLETED' ? 'text-primary' :
                                  s === 'ORDERED' ? 'text-text-main' : ''
                          )}>
                            {s}
                          </span>
                          {i < workflowStatus.length - 1 && <span>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 text-xs font-bold rounded-lg shrink-0"
                  >
                    View Order <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
