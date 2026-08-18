import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { PackageSearch, MoreVertical, Package, Tags, ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';

export function CurrentStock() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';
  const items = useSelector(state => state.invItems.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const activeItems = items.filter(i => i.status === 'ACTIVE');

  // Group stock by item and location
  const stockData = [];
  
  activeItems.forEach(item => {
    const itemStockRecords = stock.filter(s => s.itemId === item.id);
    const uom = uoms.find(u => u.id === item.baseUomId);
    const uomLabel = uom?.code || '';

    // Create a summarized row for overall item stock
    const totalStock = itemStockRecords.reduce((sum, r) => sum + r.quantity, 0);
    const isLowStock = totalStock <= (item.reorderLevel || 0);
    
    // Add location-specific rows
    itemStockRecords.forEach(record => {
      const location = locations.find(l => l.id === record.locationId);
      stockData.push({
        id: record.id,
        item,
        location,
        quantity: record.quantity,
        uomLabel,
        unitRate: item.currentRate || 0,
        estimatedValue: record.quantity * (item.currentRate || 0),
        isOverallLowStock: isLowStock,
        totalStock,
        reorderLevel: item.reorderLevel
      });
    });

    // If item has no stock records, show it as 0 stock in 'Unassigned' location
    if (itemStockRecords.length === 0) {
      stockData.push({
        id: `empty-${item.id}`,
        item,
        location: { name: 'Unassigned' },
        quantity: 0,
        uomLabel,
        unitRate: item.currentRate || 0,
        estimatedValue: 0,
        isOverallLowStock: true,
        totalStock: 0,
        reorderLevel: item.reorderLevel
      });
    }
  });

  // Sort by item name
  stockData.sort((a, b) => a.item.name.localeCompare(b.item.name));

  const filteredStockData = stockData.filter(row => 
    !search || 
    row.item.name.toLowerCase().includes(search.toLowerCase()) ||
    row.item.code.toLowerCase().includes(search.toLowerCase()) ||
    row.location?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStockData.length / itemsPerPage);
  const paginatedStockData = filteredStockData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Current Stock" 
        breadcrumbs="Inventory / Stock"
      />

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-80">
            <SearchInput 
              placeholder="Search by item name, code, or location..." 
              value={search} 
              onChange={handleSearchChange} 
              onClear={() => { setSearch(''); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <Table>
            <thead>
              <tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Current Stock</Table.Th>
                <Table.Th>Reorder Level</Table.Th>
                <Table.Th>Unit Rate</Table.Th>
                <Table.Th>Est. Value</Table.Th>
                <Table.Th>Overall Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {paginatedStockData.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? "7" : "8"}>
                    <EmptyState 
                      icon={PackageSearch} 
                      title={search ? "No matches found" : "No Stock Found"} 
                      description={search ? "Try adjusting your search." : "No active items found in the system."} 
                    />
                  </td>
                </tr>
              ) : (
                paginatedStockData.map(row => (
                  <tr key={row.id}>
                    <Table.Td>
                      <div>
                        <div className="font-bold text-text-main">{row.item.name}</div>
                        <div className="text-xs text-text-muted">{row.item.code}</div>
                      </div>
                    </Table.Td>
                    <Table.Td>{row.location?.name}</Table.Td>
                    <Table.Td>
                      <span className="font-medium text-text-main">
                        {row.quantity} {row.uomLabel}
                      </span>
                    </Table.Td>
                    <Table.Td>{row.reorderLevel} {row.uomLabel}</Table.Td>
                    <Table.Td>{formatCurrency(row.unitRate)}</Table.Td>
                    <Table.Td className="font-medium text-text-main">{formatCurrency(row.estimatedValue)}</Table.Td>
                    <Table.Td>
                      {row.isOverallLowStock ? (
                        <Badge variant="danger">LOW STOCK ({row.totalStock})</Badge>
                      ) : (
                        <Badge variant="success">NORMAL ({row.totalStock})</Badge>
                      )}
                    </Table.Td>
                    {!isGM && (
                      <Table.Td align="right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Issue Stock" onClick={() => navigate(`/inventory/issues/new?itemId=${row.item.id}&locationId=${row.location?.id}`)}><Package className="w-4 h-4 text-text-muted" /></Button>
                          <Button size="sm" variant="ghost" title="Record Waste" onClick={() => navigate(`/inventory/waste/new?itemId=${row.item.id}&locationId=${row.location?.id}`)}><Tags className="w-4 h-4 text-text-muted" /></Button>
                          <Button size="sm" variant="ghost" title="Transfer Stock" onClick={() => navigate(`/inventory/transfers/new?itemId=${row.item.id}&locationId=${row.location?.id}`)}><ArrowRightLeft className="w-4 h-4 text-text-muted" /></Button>
                          <Button size="sm" variant="ghost" title="Adjust Stock" onClick={() => navigate(`/inventory/adjustments/new?itemId=${row.item.id}&locationId=${row.location?.id}`)}><SlidersHorizontal className="w-4 h-4 text-text-muted" /></Button>
                        </div>
                      </Table.Td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </Card>
    </div>
  );
}
