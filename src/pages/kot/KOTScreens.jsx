import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { startKOTPreparation, markItemReady } from '../../features/workflows/kitchenWorkflow';
import { CheckCircle, Play } from 'lucide-react';

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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">{title}</h1>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filterType === 'ALL' ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'}`}
            onClick={() => setFilterType('ALL')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filterType === 'DINE_IN' ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'}`}
            onClick={() => setFilterType('DINE_IN')}
          >
            Dine-In
          </button>
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium ${filterType === 'TAKEAWAY' ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'}`}
            onClick={() => setFilterType('TAKEAWAY')}
          >
            Takeaway
          </button>
        </div>
      </div>
      
      {activeKots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          No orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start overflow-y-auto pb-10">
          {activeKots.map(kot => {
            const table = tables.find(t => t.id === kot.tableId);
            const order = orders.find(o => o.id === kot.orderId);
            
            return (
              <Card key={kot.id} className="border-t-4 border-t-primary flex flex-col h-full">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-primary">{kot.kotNumber}</CardTitle>
                      {kot.orderType === 'TAKEAWAY' ? (
                        <>
                          <div className="mt-2 mb-1 flex items-center space-x-2">
                            <Badge variant="warning">TAKEAWAY</Badge>
                            <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-none">{kot.source}</Badge>
                          </div>
                          <p className="text-sm font-semibold text-text-main mt-1">{kot.customerName || 'Customer'}</p>
                          {kot.customerPhone && <p className="text-xs text-text-muted mt-1">{kot.customerPhone}</p>}
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="mt-2 mb-1">DINE-IN</Badge>
                          <p className="text-sm font-semibold text-text-main mt-1">Table {table?.tableNumber}</p>
                        </>
                      )}
                      <p className="text-xs text-text-muted mt-2">Order #{order?.orderNumber}</p>
                    </div>
                    <Badge variant={kot.status === 'NEW' ? 'warning' : kot.status === 'READY' ? 'success' : 'primary'} className="mt-1">
                      {kot.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-4">
                  <div className="space-y-4 flex-1 mb-6">
                    {kot.items.map(ki => {
                      const orderItem = order?.items.find(oi => oi.id === ki.orderItemId);
                      const menuItem = menuItems.find(m => m.id === orderItem?.menuItemId);
                      
                      return (
                        <div key={ki.id} className="flex justify-between items-center border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-text-main">
                              <span className="text-primary mr-2">{ki.quantity}×</span>
                              {menuItem?.name || 'Unknown Item'}
                            </p>
                            {orderItem?.notes && (
                              <p className="text-xs text-status-warning italic mt-1">Note: {orderItem.notes}</p>
                            )}
                          </div>
                          
                          {kot.status === 'PREPARING' && ki.status === 'PREPARING' && (
                            <Button 
                              size="sm" 
                              variant="success" 
                              className="px-2"
                              onClick={() => dispatch(markItemReady(kot.id, ki.id, currentUser.id))}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Ready
                            </Button>
                          )}
                          
                          {(ki.status === 'READY' || ki.status === 'PICKED_UP' || ki.status === 'SERVED') && (
                            <Badge variant="success">READY</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {kot.status === 'NEW' && (
                    <div className="pt-4 border-t border-border">
                      <Button 
                        className="w-full h-12"
                        onClick={() => dispatch(startKOTPreparation(kot.id, currentUser.id))}
                      >
                        <Play className="w-5 h-5 mr-2" /> Start Preparing
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
