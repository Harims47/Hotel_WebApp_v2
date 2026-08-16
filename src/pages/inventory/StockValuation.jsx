import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/currency';

export function StockValuation() {
  const items = useSelector(state => state.invItems.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const categories = useSelector(state => state.invCategories.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const getUomCode = (uomId) => uoms.find(u => u.id === uomId)?.code || '';

  const [viewMode, setViewMode] = useState('item'); // 'item', 'location', 'category'

  // Pre-calculate item values
  const stockWithValues = stock.map(s => {
    const item = items.find(i => i.id === s.itemId) || {};
    const category = categories.find(c => c.id === item.categoryId) || {};
    const location = locations.find(l => l.id === s.locationId) || {};
    return {
      ...s,
      item,
      category,
      location,
      value: s.quantity * (item.currentRate || 0)
    };
  });

  const totalValue = stockWithValues.reduce((sum, s) => sum + s.value, 0);

  const getGroupedData = () => {
    if (viewMode === 'location') {
      const groups = {};
      locations.forEach(l => groups[l.name] = 0);
      stockWithValues.forEach(s => {
        if (s.location?.name) groups[s.location.name] += s.value;
      });
      return Object.entries(groups).map(([name, val]) => ({ label: name, value: val }));
    }
    
    if (viewMode === 'category') {
      const groups = {};
      categories.forEach(c => groups[c.name] = 0);
      stockWithValues.forEach(s => {
        if (s.category?.name) groups[s.category.name] += s.value;
      });
      return Object.entries(groups).map(([name, val]) => ({ label: name, value: val }));
    }

    // Default item view
    const groups = {};
    items.forEach(i => groups[i.id] = { item: i, qty: 0, val: 0 });
    stockWithValues.forEach(s => {
      if (groups[s.itemId]) {
        groups[s.itemId].qty += s.quantity;
        groups[s.itemId].val += s.value;
      }
    });
    return Object.values(groups).filter(g => g.qty > 0).map(g => ({
      itemCode: g.item.code,
      itemName: g.item.name,
      unitRate: g.item.currentRate || 0,
      uom: getUomCode(g.item.baseUomId),
      quantity: g.qty,
      value: g.val
    }));
  };

  const tableData = getGroupedData();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Valuation" 
        breadcrumbs="Inventory / Valuation"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-text-muted mb-2">Total Estimated Stock Value</p>
              <h2 className="text-4xl font-bold text-primary">{formatCurrency(totalValue)}</h2>
              <p className="text-xs text-text-muted mt-4">Calculated using current unit rates.</p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>View Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Group By"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                options={[
                  { value: 'item', label: 'Item Breakdown' },
                  { value: 'category', label: 'By Category' },
                  { value: 'location', label: 'By Location' }
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      {viewMode === 'item' ? (
                        <>
                          <Table.Th>Item</Table.Th>
                          <Table.Th>Total Quantity</Table.Th>
                          <Table.Th>Unit Rate</Table.Th>
                          <Table.Th className="text-right">Estimated Value</Table.Th>
                        </>
                      ) : (
                        <>
                          <Table.Th>{viewMode === 'location' ? 'Location' : 'Category'}</Table.Th>
                          <Table.Th className="text-right">Estimated Value</Table.Th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <Table.Td colSpan={4} className="text-center py-8 text-text-muted">
                          No stock data available.
                        </Table.Td>
                      </tr>
                    ) : (
                      tableData.map((row, idx) => (
                        <tr key={idx}>
                          {viewMode === 'item' ? (
                            <>
                              <Table.Td>
                                <div className="font-medium text-text-main">{row.itemName}</div>
                                <div className="text-xs text-text-muted">{row.itemCode}</div>
                              </Table.Td>
                              <Table.Td>{row.quantity} {row.uom}</Table.Td>
                              <Table.Td>{formatCurrency(row.unitRate)}</Table.Td>
                              <Table.Td className="text-right font-bold text-text-main">{formatCurrency(row.value)}</Table.Td>
                            </>
                          ) : (
                            <>
                              <Table.Td className="font-medium text-text-main">{row.label}</Table.Td>
                              <Table.Td className="text-right font-bold text-text-main">{formatCurrency(row.value)}</Table.Td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
