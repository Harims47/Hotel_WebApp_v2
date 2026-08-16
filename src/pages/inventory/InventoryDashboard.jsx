import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';
import { 
  Package, Tags, Building2, AlertTriangle, ShoppingCart, FileText, 
  ArrowRightLeft, SlidersHorizontal, ClipboardList, TrendingUp, TrendingDown,
  Bell, CheckCircle, Clock
} from 'lucide-react';

function MetricCard({ title, value, icon: Icon, colorClass, subtitle }) {
  return (
    <Card className="flex flex-col h-full border-border/50">
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-text-main">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-text-muted mt-4 pt-4 border-t border-border/50">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function InventoryDashboard() {
  const navigate = useNavigate();
  const items = useSelector(state => state.invItems.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const pos = useSelector(state => state.purchaseOrders.data) || [];
  const grns = useSelector(state => state.grn.data) || [];
  const issues = useSelector(state => state.invIssues.data) || [];
  const waste = useSelector(state => state.invWaste.data) || [];
  const transfers = useSelector(state => state.invTransfers.data) || [];
  const adjustments = useSelector(state => state.invAdjustments.data) || [];
  const stockCounts = useSelector(state => state.invStockCounts.data) || [];
  const ledger = useSelector(state => state.stockLedger.data) || [];
  const audits = useSelector(state => state.audit.data) || [];

  // --- KPI ROW ---
  const totalStockValue = stock.reduce((sum, s) => {
    const item = items.find(i => i.id === s.itemId);
    return sum + (s.quantity * (item?.currentRate || 0));
  }, 0);

  const stockSummary = items.map(item => {
    const itemStock = stock.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.quantity, 0);
    return { ...item, totalStock: itemStock };
  });

  const lowStockItems = stockSummary.filter(item => item.status === 'ACTIVE' && item.totalStock > 0 && item.totalStock <= (item.reorderLevel || 0));
  const criticalStockItems = stockSummary.filter(item => item.status === 'ACTIVE' && item.totalStock <= ((item.reorderLevel || 0) * 0.5));

  // --- OPERATIONAL KPIs ---
  const pendingPOs = pos.filter(po => ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)).length;
  const pendingGRNs = pos.filter(po => ['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)).length; // Simplified rule
  const draftIssues = issues.filter(i => i.status === 'DRAFT').length;
  const draftWaste = waste.filter(w => w.status === 'DRAFT').length;
  const draftTransfers = transfers.filter(t => t.status === 'DRAFT').length;
  const draftAdjustments = adjustments.filter(a => a.status === 'DRAFT').length;
  const openStockCounts = stockCounts.filter(sc => sc.status === 'DRAFT').length;

  // --- MOVEMENT KPIs (Today) ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLedger = ledger.filter(l => l.transactionDate.startsWith(todayStr));
  
  const todayStockIn = todaysLedger.filter(l => l.transactionType === 'STOCK_IN').reduce((sum, l) => sum + l.quantity, 0);
  const todayStockOut = todaysLedger.filter(l => l.transactionType === 'STOCK_OUT').reduce((sum, l) => sum + Math.abs(l.quantity), 0);
  const todayWaste = todaysLedger.filter(l => l.transactionType === 'WASTE').reduce((sum, l) => sum + Math.abs(l.quantity), 0);
  const todayTransfers = todaysLedger.filter(l => ['TRANSFER_IN', 'TRANSFER_OUT'].includes(l.transactionType)).reduce((sum, l) => sum + Math.abs(l.quantity), 0) / 2; // Divide by 2 because each transfer creates 2 entries

  // --- ALERT AREA ---
  const rejectedGoods = grns.reduce((sum, grn) => {
    return sum + (grn.items?.filter(i => i.rejectedQuantity > 0).length || 0);
  }, 0);

  // --- RECENT ACTIVITY ---
  const inventoryActionTypes = [
    'GRN_CONFIRMED', 'STOCK_ISSUE_CONFIRMED', 'WASTE_CONFIRMED', 
    'TRANSFER_CONFIRMED', 'ADJUSTMENT_CONFIRMED', 'STOCK_COUNT_CONFIRMED'
  ];
  const recentActivities = [...audits]
    .filter(a => inventoryActionTypes.includes(a.action))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Inventory Control Dashboard" 
        breadcrumbs="Inventory / Dashboard"
      />

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Total Items" value={items.length} icon={Package} colorClass="bg-blue-50 text-blue-600" />
        <MetricCard title="Total Suppliers" value={suppliers.length} icon={Building2} colorClass="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Current Stock Value" value={formatCurrency(totalStockValue)} subtitle="Estimated" icon={FileText} colorClass="bg-indigo-50 text-indigo-600" />
        <MetricCard title="Low Stock Items" value={lowStockItems.length} subtitle={`${criticalStockItems.length} critical`} icon={AlertTriangle} colorClass="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* OPERATIONAL KPIs */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <Clock className="w-5 h-5 text-text-muted" /> Operations Awaiting Action
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-amber-50/50 border-amber-100 cursor-pointer hover:bg-amber-50" onClick={() => navigate('/inventory/purchase-orders')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <ShoppingCart className="w-6 h-6 text-amber-600 mb-2" />
                <span className="text-2xl font-bold text-amber-700">{pendingPOs}</span>
                <span className="text-xs font-medium text-amber-600 uppercase">Pending POs</span>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 border-blue-100 cursor-pointer hover:bg-blue-50" onClick={() => navigate('/inventory/grn')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <FileText className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-2xl font-bold text-blue-700">{pendingGRNs}</span>
                <span className="text-xs font-medium text-blue-600 uppercase">Pending GRNs</span>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50/50 border-yellow-100 cursor-pointer hover:bg-yellow-50" onClick={() => navigate('/inventory/issues')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Package className="w-6 h-6 text-yellow-600 mb-2" />
                <span className="text-2xl font-bold text-yellow-700">{draftIssues}</span>
                <span className="text-xs font-medium text-yellow-600 uppercase">Draft Issues</span>
              </CardContent>
            </Card>
            <Card className="bg-orange-50/50 border-orange-100 cursor-pointer hover:bg-orange-50" onClick={() => navigate('/inventory/waste')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Tags className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-2xl font-bold text-orange-700">{draftWaste}</span>
                <span className="text-xs font-medium text-orange-600 uppercase">Draft Waste</span>
              </CardContent>
            </Card>
            <Card className="bg-purple-50/50 border-purple-100 cursor-pointer hover:bg-purple-50" onClick={() => navigate('/inventory/transfers')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <ArrowRightLeft className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-2xl font-bold text-purple-700">{draftTransfers}</span>
                <span className="text-xs font-medium text-purple-600 uppercase">Draft Transfers</span>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/50 border-emerald-100 cursor-pointer hover:bg-emerald-50" onClick={() => navigate('/inventory/adjustments')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <SlidersHorizontal className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-2xl font-bold text-emerald-700">{draftAdjustments}</span>
                <span className="text-xs font-medium text-emerald-600 uppercase">Draft Adj.</span>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50/50 border-indigo-100 cursor-pointer hover:bg-indigo-50" onClick={() => navigate('/inventory/stock-counts')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <ClipboardList className="w-6 h-6 text-indigo-600 mb-2" />
                <span className="text-2xl font-bold text-indigo-700">{openStockCounts}</span>
                <span className="text-xs font-medium text-indigo-600 uppercase">Open Counts</span>
              </CardContent>
            </Card>
          </div>

          <h3 className="text-lg font-bold text-text-main flex items-center gap-2 mt-8">
            <TrendingUp className="w-5 h-5 text-text-muted" /> Today's Movement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Stock In" value={todayStockIn} icon={TrendingUp} colorClass="bg-green-50 text-green-600" />
            <MetricCard title="Stock Out" value={todayStockOut} icon={TrendingDown} colorClass="bg-blue-50 text-blue-600" />
            <MetricCard title="Waste" value={todayWaste} icon={Tags} colorClass="bg-orange-50 text-orange-600" />
            <MetricCard title="Transfers" value={todayTransfers} icon={ArrowRightLeft} colorClass="bg-purple-50 text-purple-600" />
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">
          <Card className="border-status-danger/20 shadow-sm shadow-status-danger/5">
            <CardHeader className="bg-status-danger/5 border-b border-status-danger/10 pb-3">
              <CardTitle className="flex items-center text-status-danger text-base">
                <Bell className="w-4 h-4 mr-2" /> Alerts Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/inventory/alerts')}>
                  <div>
                    <p className="font-medium text-text-main">Critical Stock</p>
                    <p className="text-xs text-text-muted">{criticalStockItems.length} items extremely low</p>
                  </div>
                  <span className="bg-status-danger text-white text-xs font-bold px-2 py-1 rounded-full">{criticalStockItems.length}</span>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/inventory/alerts')}>
                  <div>
                    <p className="font-medium text-text-main">Low Stock</p>
                    <p className="text-xs text-text-muted">{lowStockItems.length} items below reorder level</p>
                  </div>
                  <span className="bg-status-warning text-white text-xs font-bold px-2 py-1 rounded-full">{lowStockItems.length}</span>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/inventory/alerts')}>
                  <div>
                    <p className="font-medium text-text-main">Rejected Goods</p>
                    <p className="text-xs text-text-muted">In recent GRNs</p>
                  </div>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{rejectedGoods}</span>
                </div>
              </div>
              <div className="p-3 border-t border-border text-center">
                <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => navigate('/inventory/alerts')}>
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-text-muted" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentActivities.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-sm">No recent confirmed activity.</div>
                ) : (
                  recentActivities.map(act => (
                    <div key={act.id} className="p-4">
                      <p className="text-sm font-medium text-text-main">{act.description}</p>
                      <p className="text-xs text-text-muted mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
