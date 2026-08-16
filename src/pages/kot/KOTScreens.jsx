import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { startKOTPreparation, markItemReady } from '../../features/workflows/kitchenWorkflow';
import { CheckCircle, Play, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

export function KOTScreen({ statusFilter, title }) {
  const dispatch = useDispatch();
  const kots = useSelector(state => state.kot.data);
  const tables = useSelector(state => state.tables.data);
  const menuItems = useSelector(state => state.menu.items);
  const orders = useSelector(state => state.orders.data);
  const { currentUser } = useSelector(state => state.auth);

  const [filterType, setFilterType] = React.useState('ALL');

  const activeKots = kots.filter(k => {
    if (k.status !== statusFilter) return false;
    if (filterType === 'DINE_IN' && k.orderType === 'TAKEAWAY') return false;
    if (filterType === 'TAKEAWAY' && k.orderType !== 'TAKEAWAY') return false;
    return true;
  });

  return (
    <div className="space-y-6 h-full flex flex-col max-w-[1600px] mx-auto">
      <PageHeader 
        title={title} 
        description={`Manage ${title.toLowerCase()} from all sources in real-time.`}
      >
        <Tabs>
          <TabsList>
            <TabsTrigger isActive={filterType === 'ALL'} onClick={() => setFilterType('ALL')}>All</TabsTrigger>
            <TabsTrigger isActive={filterType === 'DINE_IN'} onClick={() => setFilterType('DINE_IN')}>Dine-In</TabsTrigger>
            <TabsTrigger isActive={filterType === 'TAKEAWAY'} onClick={() => setFilterType('TAKEAWAY')}>Takeaway</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>
      
      {activeKots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-border/50 shadow-inner">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-text-main">No {title.toLowerCase()} found</p>
          <p className="text-sm mt-1">Kitchen is all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start overflow-y-auto pb-10 custom-scrollbar pr-2">
          {activeKots.map(kot => {
            const table = tables.find(t => t.id === kot.tableId);
            const order = orders.find(o => o.id === kot.orderId);
            
            // Calculate wait time
            const createdAt = new Date(kot.createdAt);
            const waitTimeMin = Math.floor((new Date() - createdAt) / 60000);
            
            return (
              <Card key={kot.id} className="flex flex-col h-full hover:shadow-lg transition-shadow border-0 ring-1 ring-border shadow-sm overflow-hidden">
                <div className={cn(
                  "h-1.5 w-full",
                  kot.status === 'NEW' ? "bg-status-warning" : kot.status === 'READY' ? "bg-status-success" : kot.status === 'COMPLETED' ? "bg-gray-400" : "bg-primary"
                )} />
                <CardHeader className="bg-gray-50/80 pb-4 border-b border-border/60">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-black tracking-tight text-text-main">{kot.kotNumber}</CardTitle>
                    <Badge variant={kot.status === 'NEW' ? 'warning' : kot.status === 'READY' ? 'success' : kot.status === 'COMPLETED' ? 'default' : 'primary'} className="font-bold shadow-sm">
                      {kot.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    {kot.orderType === 'TAKEAWAY' ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-text-main bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase">Takeaway</span>
                          <span className="font-bold text-text-main bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase">{kot.source}</span>
                        </div>
                        <span className="font-semibold text-text-main">{kot.customerName || 'Customer'}</span>
                        {kot.customerPhone && <span className="text-text-muted text-xs">{kot.customerPhone}</span>}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase mb-1 inline-block w-fit">Dine-In</span>
                        <span className="font-semibold text-text-main text-base">Table {table?.tableNumber}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col items-end justify-between h-full">
                      <span className="text-xs text-text-muted font-medium bg-white px-2 py-1 rounded border border-border/50 shadow-sm">#{order?.orderNumber}</span>
                      {kot.status !== 'COMPLETED' && (
                        <div className="flex items-center text-xs text-status-danger font-bold mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {waitTimeMin}m
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  <div className="space-y-0 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                    {kot.items.map((ki, index) => {
                      const orderItem = order?.items.find(oi => oi.id === ki.orderItemId);
                      const menuItem = menuItems.find(m => m.id === orderItem?.menuItemId);
                      
                      return (
                        <div key={ki.id} className={cn("flex justify-between items-center p-4 border-b border-border/50", index % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                          <div className="flex-1 pr-4">
                            <p className={cn("font-bold text-text-main leading-tight", ki.status === 'CANCELLED' && "line-through text-text-muted")}>
                              <span className="text-primary mr-2 bg-primary/10 px-2 py-0.5 rounded">{ki.quantity}×</span>
                              {menuItem?.name || 'Unknown Item'}
                            </p>
                            {orderItem?.notes && (
                              <p className="text-xs font-semibold text-status-warning bg-yellow-50 px-2 py-1 rounded border border-yellow-100 mt-2 inline-block">Note: {orderItem.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            {kot.status === 'PREPARING' && ki.status === 'PREPARING' && (
                              <Button 
                                size="sm" 
                                variant="success" 
                                className="px-3 shadow-sm font-bold"
                                onClick={() => dispatch(markItemReady(kot.id, ki.id, currentUser.id))}
                              >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Ready
                              </Button>
                            )}
                            
                            {ki.status === 'READY' && <Badge variant="success" className="px-2 py-1 text-[10px]">READY</Badge>}
                            {ki.status === 'PICKED_UP' && <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-2 py-1 text-[10px]">PICKED UP</Badge>}
                            {ki.status === 'SERVED' && <Badge variant="default" className="bg-gray-100 text-gray-700 px-2 py-1 text-[10px]">SERVED</Badge>}
                            {ki.status === 'CANCELLED' && <Badge variant="danger" className="bg-red-100 text-red-700 px-2 py-1 text-[10px]">CANCELLED</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {kot.status === 'NEW' && (
                    <div className="p-4 bg-gray-50 border-t border-border/60">
                      <Button 
                        className="w-full h-12 text-base font-bold shadow-md shadow-primary/20"
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
      )}
    </div>
  );
}

export const KOTNewOrders = () => <KOTScreen statusFilter="NEW" title="New Orders" />;
export const KOTPreparing = () => <KOTScreen statusFilter="PREPARING" title="Preparing" />;
export const KOTReady = () => <KOTScreen statusFilter="READY" title="Ready" />;
export const KOTCompleted = () => <KOTScreen statusFilter="COMPLETED" title="Completed" />;
