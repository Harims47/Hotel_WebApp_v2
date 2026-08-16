import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, ShoppingCart, Truck, XCircle, Clock, Package } from 'lucide-react';

export function InventoryAlerts() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const items = useSelector(state => state.invItems.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const pos = useSelector(state => state.purchaseOrders.data) || [];
  const grns = useSelector(state => state.grn.data) || [];
  const ledger = useSelector(state => state.stockLedger.data) || [];

  const isGM = currentUser?.role === 'GM';

  const getUomCode = (uomId) => uoms.find(u => u.id === uomId)?.code || '';

  // Compute total stock per active item
  const stockSummary = items.filter(i => i.status === 'ACTIVE').map(item => {
    const itemStock = stock.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.quantity, 0);
    return { ...item, totalStock: itemStock, uomCode: getUomCode(item.baseUomId) };
  });

  // 1. CRITICAL STOCK (<= 50% of reorder level)
  const criticalStockAlerts = stockSummary.filter(item => item.totalStock <= ((item.reorderLevel || 0) * 0.5));
  
  // 2. LOW STOCK (<= reorder level but > 50%)
  const lowStockAlerts = stockSummary.filter(item => 
    item.totalStock <= (item.reorderLevel || 0) && 
    item.totalStock > ((item.reorderLevel || 0) * 0.5)
  );

  // 3. PENDING POs (DRAFT, SENT, PARTIALLY_RECEIVED)
  const pendingPOAlerts = pos.filter(po => ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status));

  // 4. PENDING GRNs (Received < Ordered for SENT/PARTIALLY_RECEIVED POs)
  const pendingGRNAlerts = pendingPOAlerts.filter(po => po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED');

  // 5. REJECTED GOODS
  const recentGrns = grns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50); // Look at last 50 GRNs
  const rejectedGoodsAlerts = recentGrns.filter(grn => grn.items?.some(i => i.rejectedQuantity > 0));

  // 6. NO MOVEMENT (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const noMovementAlerts = items.filter(item => item.status === 'ACTIVE').filter(item => {
    // Check if there's any ledger entry in the last 30 days
    const hasRecentActivity = ledger.some(l => 
      l.itemId === item.id && new Date(l.transactionDate) >= thirtyDaysAgo
    );
    // Only alert if they actually have stock and it hasn't moved
    const hasStock = stock.some(s => s.itemId === item.id && s.quantity > 0);
    return !hasRecentActivity && hasStock;
  });

  const renderAlertCard = (icon, title, description, badge, actionLabel, onAction, colorClass) => (
    <Card className="hover:shadow-md transition-shadow border-border/50">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${colorClass}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-text-main">{title}</h4>
              {badge && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-600">{badge}</span>}
            </div>
            <p className="text-sm text-text-muted">{description}</p>
          </div>
        </div>
        {!isGM && actionLabel && (
          <Button variant="outline" size="sm" onClick={onAction} className="shrink-0 w-full sm:w-auto">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory Alerts" 
        breadcrumbs="Inventory / Alerts"
      />

      <div className="grid grid-cols-1 gap-4">
        {/* Critical Stock */}
        {criticalStockAlerts.map(item => renderAlertCard(
          <AlertTriangle className="w-5 h-5" />,
          `Critical Stock: ${item.name}`,
          `Current stock is ${item.totalStock} ${item.uomCode}. Reorder level is ${item.reorderLevel}. Action required immediately.`,
          item.code,
          'Create PO',
          () => navigate(`/inventory/purchase-orders/new?itemId=${item.id}`),
          'bg-red-100 text-red-600'
        ))}

        {/* Low Stock */}
        {lowStockAlerts.map(item => renderAlertCard(
          <AlertTriangle className="w-5 h-5" />,
          `Low Stock: ${item.name}`,
          `Current stock is ${item.totalStock} ${item.uomCode}. Reorder level is ${item.reorderLevel}.`,
          item.code,
          'Create PO',
          () => navigate(`/inventory/purchase-orders/new?itemId=${item.id}`),
          'bg-amber-100 text-amber-600'
        ))}

        {/* Pending POs */}
        {pendingPOAlerts.map(po => renderAlertCard(
          <ShoppingCart className="w-5 h-5" />,
          `Pending PO: ${po.poNumber}`,
          `Status: ${po.status.replace('_', ' ')}. Placed on ${new Date(po.createdAt).toLocaleDateString()}.`,
          null,
          'View PO',
          () => navigate(`/inventory/purchase-orders/${po.id}`),
          'bg-blue-100 text-blue-600'
        ))}

        {/* Pending GRNs */}
        {pendingGRNAlerts.map(po => renderAlertCard(
          <Truck className="w-5 h-5" />,
          `Pending GRN for PO: ${po.poNumber}`,
          `Order is ${po.status === 'PARTIALLY_RECEIVED' ? 'partially fulfilled' : 'not yet received'}.`,
          null,
          'Create GRN',
          () => navigate(`/inventory/grn/new?poId=${po.id}`),
          'bg-indigo-100 text-indigo-600'
        ))}

        {/* Rejected Goods */}
        {rejectedGoodsAlerts.map(grn => {
          const rejectedItems = grn.items.filter(i => i.rejectedQuantity > 0);
          return renderAlertCard(
            <XCircle className="w-5 h-5" />,
            `Rejected Goods in GRN: ${grn.grnNumber}`,
            `${rejectedItems.length} item(s) were rejected during receiving. Requires vendor follow-up.`,
            null,
            'View GRN',
            () => navigate(`/inventory/grn/${grn.id}`),
            'bg-gray-100 text-gray-600'
          );
        })}

        {/* No Movement */}
        {noMovementAlerts.map(item => renderAlertCard(
          <Clock className="w-5 h-5" />,
          `No Movement: ${item.name}`,
          `This item has stock but has not had any transactions in the last 30 days.`,
          item.code,
          'View Ledger',
          () => navigate('/inventory/stock-ledger'),
          'bg-purple-100 text-purple-600'
        ))}

        {/* Empty State */}
        {criticalStockAlerts.length === 0 && 
         lowStockAlerts.length === 0 && 
         pendingPOAlerts.length === 0 && 
         pendingGRNAlerts.length === 0 && 
         rejectedGoodsAlerts.length === 0 && 
         noMovementAlerts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-border/50 shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-main mb-1">No Alerts</h3>
            <p className="text-text-muted">Your inventory operations are running smoothly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
