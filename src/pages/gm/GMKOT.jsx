import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Clock } from 'lucide-react';

export function GMKOT() {
  const kotItems = useSelector(state => state.kot?.data || []);
  const tables = useSelector(state => state.tables?.data || []);
  const orders = useSelector(state => state.orders?.data || []);
  const menuItems = useSelector(state => state.menu?.items || []);

  const newKots = kotItems.filter(k => k.status === 'NEW');
  const preparingKots = kotItems.filter(k => k.status === 'PREPARING');
  const readyKots = kotItems.filter(k => k.status === 'READY');

  const getTableName = (id) => tables.find(t => t.id === id)?.tableNumber || id;
  const shortId = (id) => id ? (id.length > 8 ? id.substring(0, 8) + '...' : id) : '-';
  const getSafeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

  const renderKOTCard = (kot, borderColor) => {
    const order = orders.find(o => o.id === kot.orderId);
    return (
      <Card key={kot.id} className={`mb-4 hover:shadow-md transition-all border-l-4 ${borderColor}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-2">
            <div>
              <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mr-2" title={kot.id}>{kot.kotNumber || `KOT-${shortId(kot.id)}`}</span>
              <span className="text-gray-500 font-mono text-[10px]" title={kot.orderId}>{order?.orderNumber || `ORD-${shortId(kot.orderId)}`}</span>
            </div>
            {kot.createdAt && (
              <span className="text-[10px] text-gray-400 flex items-center font-mono">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-3">
            <Badge variant="outline" className="bg-gray-50">{kot.type?.replace('_', ' ')}</Badge>
            <span className="font-medium">{kot.type === 'DINE_IN' ? `Table ${getTableName(kot.tableId)}` : 'Takeaway'}</span>
          </div>
          <div className="space-y-1.5 mt-2 bg-gray-50/50 p-2 rounded-lg border border-border/30">
            {(kot.items || []).map((item, idx) => {
              const order = orders.find(o => o.id === kot.orderId);
              const orderItem = order?.items?.find(oi => oi.id === item.orderItemId);
              const mItem = menuItems.find(m => m.id === orderItem?.menuItemId);
              const name = mItem ? mItem.name : (item.name || 'Unknown Item');
              return (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <span className="font-medium text-gray-700">
                    <span className="text-primary mr-2 font-bold">{getSafeNum(item.quantity)}x</span>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-screen-2xl  pb-10">
      <PageHeader
        title="KOT Monitoring"
        breadcrumbs="RESTAURANT OPS / KOT"
      />

      <div className="flex flex-col lg:flex-row gap-4 pb-4 items-stretch min-h-[500px]">

        {/* NEW */}
        <div className="flex-1 w-full lg:w-1/3 bg-gray-50/50 rounded-xl border border-gray-200 p-4 flex flex-col max-h-[800px]">
          <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
            <h3 className="font-bold text-sm text-gray-700 flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 bg-red-500"></span>
              NEW
            </h3>
            <Badge variant="outline" className="bg-white text-gray-600">{newKots.length}</Badge>
          </div>
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            {newKots.map(k => renderKOTCard(k, 'border-l-red-500'))}
            {newKots.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-8 border-2 border-dashed border-gray-200 rounded-lg">No new KOTs</div>
            )}
          </div>
        </div>

        {/* PREPARING */}
        <div className="flex-1 w-full lg:w-1/3 bg-gray-50/50 rounded-xl border border-gray-200 p-4 flex flex-col max-h-[800px]">
          <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
            <h3 className="font-bold text-sm text-gray-700 flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 bg-orange-500"></span>
              PREPARING
            </h3>
            <Badge variant="outline" className="bg-white text-gray-600">{preparingKots.length}</Badge>
          </div>
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            {preparingKots.map(k => renderKOTCard(k, 'border-l-orange-500'))}
            {preparingKots.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-8 border-2 border-dashed border-gray-200 rounded-lg">No KOTs in preparation</div>
            )}
          </div>
        </div>

        {/* READY */}
        <div className="flex-1 w-full lg:w-1/3 bg-gray-50/50 rounded-xl border border-gray-200 p-4 flex flex-col max-h-[800px]">
          <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
            <h3 className="font-bold text-sm text-gray-700 flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
              READY
            </h3>
            <Badge variant="outline" className="bg-white text-gray-600">{readyKots.length}</Badge>
          </div>
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            {readyKots.map(k => renderKOTCard(k, 'border-l-green-500'))}
            {readyKots.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-8 border-2 border-dashed border-gray-200 rounded-lg">No KOTs waiting for pickup</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
