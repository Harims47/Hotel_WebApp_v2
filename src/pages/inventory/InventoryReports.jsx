import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/currency';

function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex overflow-x-auto border-b border-border mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-main hover:border-border'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InventoryReports() {
  const [activeTab, setActiveTab] = useState('currentStock');
  
  // Data Selectors
  const items = useSelector(state => state.invItems.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const categories = useSelector(state => state.invCategories.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  
  const stock = useSelector(state => state.invStock.data) || [];
  const ledger = useSelector(state => state.stockLedger.data) || [];
  const pos = useSelector(state => state.purchaseOrders.data) || [];
  const issues = useSelector(state => state.invIssues.data) || [];
  const waste = useSelector(state => state.invWaste.data) || [];
  const transfers = useSelector(state => state.invTransfers.data) || [];
  const adjustments = useSelector(state => state.invAdjustments.data) || [];
  const stockCounts = useSelector(state => state.invStockCounts.data) || [];
  const reimbursements = useSelector(state => state.reimbursements.data) || [];
  const users = useSelector(state => state.users.data) || [];

  const getUserName = id => users.find(u => u.id === id)?.name || 'System';
  const getLocationName = id => locations.find(l => l.id === id)?.name || 'Unknown';
  const getCategoryName = id => categories.find(c => c.id === id)?.name || 'Unknown';
  const getUomCode = (uomId) => uoms.find(u => u.id === uomId)?.code || '';

  // State for Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const tabs = [
    { id: 'currentStock', label: 'Current Stock' },
    { id: 'stockMovement', label: 'Stock Movement' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'issues', label: 'Issues' },
    { id: 'waste', label: 'Waste' },
    { id: 'transfers', label: 'Transfers' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'stockCounts', label: 'Stock Counts' },
    { id: 'supplierSummary', label: 'Supplier Summary' },
    { id: 'reimbursements', label: 'Reimbursements' }
  ];

  // Helper to filter by date
  const isWithinDateRange = (dateString) => {
    if (!dateString) return true;
    const d = new Date(dateString).toISOString().split('T')[0];
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  // --- RENDER FUNCTIONS FOR EACH REPORT ---

  const renderCurrentStock = () => {
    let filteredStock = stock.map(s => {
      const item = items.find(i => i.id === s.itemId) || {};
      return {
        ...s,
        itemName: item.name || '',
        categoryName: getCategoryName(item.categoryId),
        locationName: getLocationName(s.locationId),
        uom: getUomCode(item.baseUomId),
        reorderLevel: item.reorderLevel || 0,
        status: s.quantity <= (item.reorderLevel || 0) ? 'LOW' : 'NORMAL',
        unitRate: item.currentRate || 0,
        estimatedValue: s.quantity * (item.currentRate || 0)
      };
    });

    if (locationFilter !== 'ALL') filteredStock = filteredStock.filter(s => s.locationId === locationFilter);
    // (We'd need to extract categoryId in mapping if we want to filter by category cleanly)

    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Current Stock</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Unit Rate</Table.Th>
              <Table.Th>Est. Value</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map((s, idx) => (
              <tr key={idx}>
                <Table.Td>{s.itemName}</Table.Td>
                <Table.Td>{s.categoryName}</Table.Td>
                <Table.Td>{s.locationName}</Table.Td>
                <Table.Td className="font-bold">{s.quantity} {s.uom}</Table.Td>
                <Table.Td><Badge variant={s.status === 'LOW' ? 'danger' : 'success'}>{s.status}</Badge></Table.Td>
                <Table.Td>{formatCurrency(s.unitRate)}</Table.Td>
                <Table.Td>{formatCurrency(s.estimatedValue)}</Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderStockMovement = () => {
    let filteredLedger = ledger.filter(l => isWithinDateRange(l.transactionDate));
    if (locationFilter !== 'ALL') filteredLedger = filteredLedger.filter(l => l.locationId === locationFilter);
    filteredLedger.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Item</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Reference</Table.Th>
              <Table.Th>Quantity</Table.Th>
              <Table.Th>Balance After</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredLedger.map((l, idx) => (
              <tr key={idx}>
                <Table.Td>{new Date(l.transactionDate).toLocaleString()}</Table.Td>
                <Table.Td>{l.itemName}</Table.Td>
                <Table.Td>{getLocationName(l.locationId)}</Table.Td>
                <Table.Td><Badge variant="secondary">{l.transactionType}</Badge></Table.Td>
                <Table.Td>{l.referenceNumber}</Table.Td>
                <Table.Td>
                  <span className={l.quantity > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {l.quantity > 0 ? '+' : ''}{l.quantity}
                  </span>
                </Table.Td>
                <Table.Td>{l.balanceAfter}</Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderPurchases = () => {
    let filteredPOs = pos.filter(po => isWithinDateRange(po.poDate));
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>PO Number</Table.Th>
              <Table.Th>Supplier</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Ordered Val</Table.Th>
              <Table.Th>Received Qty Summary</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredPOs.map((po, idx) => {
              const supplier = suppliers.find(s => s.id === po.supplierId);
              const orderedTotal = po.items?.reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
              const receivedCount = po.items?.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0) || 0;
              const orderedCount = po.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
              return (
                <tr key={idx}>
                  <Table.Td>{new Date(po.poDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{po.poNumber}</Table.Td>
                  <Table.Td>{supplier?.name}</Table.Td>
                  <Table.Td><Badge variant="secondary">{po.status}</Badge></Table.Td>
                  <Table.Td>{formatCurrency(orderedTotal)}</Table.Td>
                  <Table.Td>{receivedCount} / {orderedCount}</Table.Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderIssues = () => {
    let filteredIssues = issues.filter(i => isWithinDateRange(i.date));
    if (locationFilter !== 'ALL') filteredIssues = filteredIssues.filter(i => i.fromLocationId === locationFilter);
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Issue No.</Table.Th>
              <Table.Th>From Location</Table.Th>
              <Table.Th>To Dept</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Total Value</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue, idx) => (
              <tr key={idx}>
                <Table.Td>{new Date(issue.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{issue.issueNumber}</Table.Td>
                <Table.Td>{getLocationName(issue.fromLocationId)}</Table.Td>
                <Table.Td>{issue.toLocationId ? getLocationName(issue.toLocationId) : issue.departmentName}</Table.Td>
                <Table.Td>{issue.items?.length || 0}</Table.Td>
                <Table.Td><Badge variant={issue.status === 'CONFIRMED' ? 'success' : 'secondary'}>{issue.status}</Badge></Table.Td>
                <Table.Td>{formatCurrency(issue.totalValue)}</Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderWaste = () => {
    let filteredWaste = waste.filter(w => isWithinDateRange(w.date));
    if (locationFilter !== 'ALL') filteredWaste = filteredWaste.filter(w => w.locationId === locationFilter);
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Waste No.</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Value</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredWaste.map((w, idx) => (
              <tr key={idx}>
                <Table.Td>{new Date(w.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{w.wasteNumber}</Table.Td>
                <Table.Td>{getLocationName(w.locationId)}</Table.Td>
                <Table.Td>{w.reason}</Table.Td>
                <Table.Td>{w.items?.length || 0}</Table.Td>
                <Table.Td><Badge variant={w.status === 'CONFIRMED' ? 'success' : 'secondary'}>{w.status}</Badge></Table.Td>
                <Table.Td className="text-status-danger">{formatCurrency(w.totalValue)}</Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderTransfers = () => {
    let filteredTransfers = transfers.filter(t => isWithinDateRange(t.date));
    if (locationFilter !== 'ALL') filteredTransfers = filteredTransfers.filter(t => t.fromLocationId === locationFilter || t.toLocationId === locationFilter);
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Transfer No.</Table.Th>
              <Table.Th>From</Table.Th>
              <Table.Th>To</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.map((t, idx) => (
              <tr key={idx}>
                <Table.Td>{new Date(t.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{t.transferNumber}</Table.Td>
                <Table.Td>{getLocationName(t.fromLocationId)}</Table.Td>
                <Table.Td>{getLocationName(t.toLocationId)}</Table.Td>
                <Table.Td>{t.items?.length || 0}</Table.Td>
                <Table.Td><Badge variant={t.status === 'CONFIRMED' ? 'success' : 'secondary'}>{t.status}</Badge></Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderAdjustments = () => {
    let filteredAdj = adjustments.filter(a => isWithinDateRange(a.date));
    if (locationFilter !== 'ALL') filteredAdj = filteredAdj.filter(a => a.locationId === locationFilter);
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Adj No.</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Diff Value</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredAdj.map((a, idx) => (
              <tr key={idx}>
                <Table.Td>{new Date(a.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{a.adjustmentNumber}</Table.Td>
                <Table.Td>{getLocationName(a.locationId)}</Table.Td>
                <Table.Td>{a.reason}</Table.Td>
                <Table.Td>{a.items?.length || 0}</Table.Td>
                <Table.Td><Badge variant={a.status === 'CONFIRMED' ? 'success' : 'secondary'}>{a.status}</Badge></Table.Td>
                <Table.Td className={a.totalDifferenceValue < 0 ? 'text-status-danger' : 'text-green-600'}>
                  {formatCurrency(a.totalDifferenceValue)}
                </Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderStockCounts = () => {
    let filteredCounts = stockCounts.filter(sc => isWithinDateRange(sc.countDate));
    if (locationFilter !== 'ALL') filteredCounts = filteredCounts.filter(sc => sc.locationId === locationFilter);
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Count No.</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Items Counted</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Variance Value</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredCounts.map((sc, idx) => {
              const varVal = sc.items?.reduce((sum, i) => sum + (i.varianceValue || 0), 0) || 0;
              return (
                <tr key={idx}>
                  <Table.Td>{new Date(sc.countDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{sc.countNumber}</Table.Td>
                  <Table.Td>{getLocationName(sc.locationId)}</Table.Td>
                  <Table.Td>{sc.items?.length || 0}</Table.Td>
                  <Table.Td><Badge variant={sc.status === 'CONFIRMED' ? 'success' : 'secondary'}>{sc.status}</Badge></Table.Td>
                  <Table.Td className={varVal < 0 ? 'text-status-danger' : varVal > 0 ? 'text-green-600' : ''}>
                    {formatCurrency(varVal)}
                  </Table.Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderSupplierSummary = () => {
    const summary = suppliers.map(supplier => {
      const suppPOs = pos.filter(po => po.supplierId === supplier.id && isWithinDateRange(po.poDate));
      const orderedValue = suppPOs.reduce((sum, po) => sum + po.items.reduce((s, i) => s + (i.totalAmount || 0), 0), 0);
      const receivedValue = suppPOs.reduce((sum, po) => sum + po.items.reduce((s, i) => s + ((i.receivedQuantity || 0) * (i.unitRate || 0)), 0), 0);
      return {
        ...supplier,
        poCount: suppPOs.length,
        orderedValue,
        receivedValue,
        pendingValue: orderedValue - receivedValue
      };
    }).filter(s => s.poCount > 0);

    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Supplier</Table.Th>
              <Table.Th>POs Placed</Table.Th>
              <Table.Th>Ordered Value</Table.Th>
              <Table.Th>Received Value</Table.Th>
              <Table.Th>Pending Value</Table.Th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s, idx) => (
              <tr key={idx}>
                <Table.Td className="font-bold">{s.name}</Table.Td>
                <Table.Td>{s.poCount}</Table.Td>
                <Table.Td>{formatCurrency(s.orderedValue)}</Table.Td>
                <Table.Td className="text-green-600">{formatCurrency(s.receivedValue)}</Table.Td>
                <Table.Td className="text-amber-600">{formatCurrency(s.pendingValue)}</Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderReimbursements = () => {
    let filteredReimb = reimbursements.filter(r => isWithinDateRange(r.reimbursementDate));
    return (
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Table.Th>Reimbursement No.</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Source</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Payment Ref</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredReimb.map((r, idx) => (
              <tr key={idx}>
                <Table.Td>{r.reimbursementNo}</Table.Td>
                <Table.Td>{new Date(r.reimbursementDate).toLocaleDateString()}</Table.Td>
                <Table.Td>{r.employeeName}</Table.Td>
                <Table.Td>
                  {r.supplierName ? (
                    <div className="text-sm text-text-muted">
                      {r.supplierName} {r.poNo && ` / ${r.poNo}`}
                    </div>
                  ) : 'Direct Expense'}
                </Table.Td>
                <Table.Td className="font-bold">{formatCurrency(r.amount)}</Table.Td>
                <Table.Td>
                  <Badge variant={r.status === 'PAID' ? 'success' : r.status === 'APPROVED' ? 'primary' : 'secondary'}>
                    {r.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{r.paymentReference || '-'}</Table.Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory Reports" 
        breadcrumbs="Inventory / Reports"
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50/50 p-4 rounded-xl border border-border">
            <Input label="Input" hideLabel type="date"
              label="Date From"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
            <Input label="Input" hideLabel type="date"
              label="Date To"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
            <Select
              label="Location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              options={[{ value: 'ALL', label: 'All Locations' }, ...locations.map(l => ({ value: l.id, label: l.name }))]}
            />
            <Select
              label="Category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={[{ value: 'ALL', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
            />
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="min-h-[400px]">
            {activeTab === 'currentStock' && renderCurrentStock()}
            {activeTab === 'stockMovement' && renderStockMovement()}
            {activeTab === 'purchases' && renderPurchases()}
            {activeTab === 'issues' && renderIssues()}
            {activeTab === 'waste' && renderWaste()}
            {activeTab === 'transfers' && renderTransfers()}
            {activeTab === 'adjustments' && renderAdjustments()}
            {activeTab === 'stockCounts' && renderStockCounts()}
            {activeTab === 'supplierSummary' && renderSupplierSummary()}
            {activeTab === 'reimbursements' && renderReimbursements()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
