import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { startKOTPreparation, markItemReady } from '../../features/workflows/kitchenWorkflow';
import { CheckCircle, Play, Clock, ChefHat, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export function KOTScreen({ statusFilter, title }) {
  const dispatch = useDispatch();
  const kots = useSelector(state => state.kot.data);
  const tables = useSelector(state => state.tables.data);
  const menuItems = useSelector(state => state.menu.items);
  const orders = useSelector(state => state.orders.data);
  const { currentUser } = useSelector(state => state.auth);

  const [filterType, setFilterType] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  const activeKots = kots.filter(k => {
    if (k.status !== statusFilter) return false;
    if (filterType === 'DINE_IN' && k.orderType === 'TAKEAWAY') return false;
    if (filterType === 'TAKEAWAY' && k.orderType !== 'TAKEAWAY') return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const order = orders.find(o => o.id === k.orderId);
      const orderNumberMatch = order?.orderNumber?.toLowerCase().includes(q);
      const kotNumberMatch = k.kotNumber?.toLowerCase().includes(q);
      const customerMatch = k.customerName?.toLowerCase().includes(q);
      
      if (!orderNumberMatch && !kotNumberMatch && !customerMatch) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-canvas w-full">
      {/* Compact Operational Header */}
      <div className="px-4 md:px-6 pt-4 pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 bg-canvas">
        <div className="flex items-center relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3" />
          <input 
            type="text" 
            placeholder="Search by KOT or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
        </div>
        <div className="hidden lg:inline-flex items-center rounded-xl bg-canvas p-1.5 border border-border/60">
          <button 
            onClick={() => setFilterType('ALL')}
            className={cn("px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap", filterType === 'ALL' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60")}
          >All</button>
          <button 
            onClick={() => setFilterType('DINE_IN')}
            className={cn("px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap", filterType === 'DINE_IN' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60")}
          >Dine-In</button>
          <button 
            onClick={() => setFilterType('TAKEAWAY')}
            className={cn("px-5 py-2 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap", filterType === 'TAKEAWAY' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main hover:bg-surface/60")}
          >Takeaway</button>
        </div>
      </div>
      
      {activeKots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted px-4 pb-12">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-border/60 shadow-sm">
            <ChefHat className="w-8 h-8 text-text-faint" />
          </div>
          <p className="text-xl font-bold text-text-main">No {title.toLowerCase()} found</p>
          <p className="text-sm mt-1 font-medium">Kitchen is all caught up!</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-12 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
            {activeKots.map(kot => {
              const table = tables.find(t => t.id === kot.tableId);
              const order = orders.find(o => o.id === kot.orderId);
              
              // Calculate wait time
              const createdAt = new Date(kot.createdAt);
              const waitTimeMin = Math.floor((new Date() - createdAt) / 60000);
              
              const isCompleted = kot.status === 'COMPLETED';
              const isNew = kot.status === 'NEW';
              const isPreparing = kot.status === 'PREPARING';
              const isReady = kot.status === 'READY';
              
              // Styling based on status
              const cardBorderClass = isNew ? "border-orange-500/30" : isPreparing ? "border-primary/30" : isReady ? "border-green-500/30" : "border-border/60";
              const headerBgClass = isCompleted ? "bg-surface/50" : "bg-white";
              const badgeVariant = isNew ? "warning" : isPreparing ? "primary" : isReady ? "success" : "default";

              return (
                <Card key={kot.id} className={cn("flex flex-col border shadow-sm overflow-hidden", cardBorderClass, isCompleted && "opacity-80")}>
                  {/* Color Accent Bar */}
                  <div className={cn(
                    "h-1.5 w-full",
                    isNew ? "bg-status-warning" : isReady ? "bg-status-success" : isCompleted ? "bg-text-faint" : "bg-primary"
                  )} />
                  
                  {/* Header Block */}
                  <CardHeader className={cn("pb-3 border-b border-border/40", headerBgClass)}>
                    <div className="flex justify-between items-start mb-3">
                      <CardTitle className={cn("text-xl font-black tracking-tight", isCompleted ? "text-text-muted" : "text-text-main")}>{kot.kotNumber}</CardTitle>
                      <Badge variant={badgeVariant} className="font-bold shadow-sm px-2.5 py-1 text-xs">
                        {kot.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                      <div className="flex flex-col gap-1 min-w-0">
                        {kot.orderType === 'TAKEAWAY' ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-text-main bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] tracking-widest uppercase">TAKEAWAY</span>
                              <span className="font-bold text-text-main bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-[10px] tracking-widest uppercase">{kot.source}</span>
                            </div>
                            <span className={cn("font-bold truncate", isCompleted ? "text-text-muted" : "text-text-main")}>{kot.customerName || 'Customer'}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-text-main bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] tracking-widest uppercase w-fit">DINE-IN</span>
                            <span className={cn("font-bold text-base", isCompleted ? "text-text-muted" : "text-text-main")}>Table {table?.tableNumber}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-bold text-text-muted font-mono bg-surface px-1.5 py-0.5 rounded border border-border/50">#{order?.orderNumber}</span>
                        {!isCompleted && (
                          <div className={cn("flex items-center text-sm font-black mt-1", waitTimeMin > 15 ? "text-status-danger" : "text-status-warning")}>
                            <Clock className="w-4 h-4 mr-1" />
                            {waitTimeMin}m
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Items List (Scrollable if large) */}
                  <CardContent className={cn("flex-1 flex flex-col p-0", isCompleted ? "bg-surface/30" : "bg-white")}>
                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                      {kot.items.map((ki, index) => {
                        const orderItem = order?.items.find(oi => oi.id === ki.orderItemId);
                        const menuItem = menuItems.find(m => m.id === orderItem?.menuItemId);
                        const isItemCancelled = ki.status === 'CANCELLED';
                        
                        return (
                          <div key={ki.id} className={cn("flex justify-between items-start p-3 border-b border-border/30", index % 2 === 0 ? "bg-transparent" : "bg-surface/40")}>
                            <div className="flex-1 pr-3 min-w-0">
                              <p className={cn("font-bold text-[14px] leading-snug break-words", isItemCancelled ? "line-through text-text-faint" : "text-text-main")}>
                                <span className={cn("mr-2 px-1.5 py-0.5 rounded text-[13px]", isItemCancelled ? "bg-gray-200 text-gray-500" : "bg-primary/10 text-primary")}>{ki.quantity}×</span>
                                {menuItem?.name || 'Unknown Item'}
                              </p>
                              {orderItem?.notes && (
                                <p className="text-xs font-semibold text-status-warning bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 mt-1.5 inline-block">Note: {orderItem.notes}</p>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0 pt-0.5">
                              {kot.status === 'PREPARING' && ki.status === 'PREPARING' && (
                                <Button 
                                  size="sm" 
                                  variant="success" 
                                  className="px-3 py-1.5 h-auto min-h-[36px] shadow-sm font-bold text-xs"
                                  onClick={() => dispatch(markItemReady(kot.id, ki.id, currentUser.id))}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> READY
                                </Button>
                              )}
                              
                              {ki.status === 'READY' && <Badge variant="success" className="px-1.5 py-0.5 text-[9px] font-black tracking-widest shadow-sm">READY</Badge>}
                              {ki.status === 'PICKED_UP' && <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[9px] font-black tracking-widest border border-blue-200">PICKED UP</Badge>}
                              {ki.status === 'SERVED' && <Badge variant="default" className="bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[9px] font-black tracking-widest border border-gray-200">SERVED</Badge>}
                              {ki.status === 'CANCELLED' && <Badge variant="danger" className="bg-red-50 text-red-600 px-1.5 py-0.5 text-[9px] font-black tracking-widest border border-red-200">CANCELLED</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Primary Action Footer */}
                    {isNew && (
                      <div className="p-3 bg-surface border-t border-border/60 shrink-0">
                        <Button 
                          className="w-full min-h-[44px] text-[15px] font-black tracking-wide shadow-md shadow-primary/20 bg-status-warning hover:bg-orange-600 border-none text-white"
                          onClick={() => dispatch(startKOTPreparation(kot.id, currentUser.id))}
                        >
                          <Play className="w-5 h-5 mr-2" fill="currentColor" /> START PREPARING
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const KOTNewOrders = () => <KOTScreen statusFilter="NEW" title="New Orders" />;
export const KOTPreparing = () => <KOTScreen statusFilter="PREPARING" title="Preparing" />;
export const KOTReady = () => <KOTScreen statusFilter="READY" title="Ready" />;
export const KOTCompleted = () => <KOTScreen statusFilter="COMPLETED" title="Completed" />;
