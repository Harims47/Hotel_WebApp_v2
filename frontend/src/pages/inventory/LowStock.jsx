import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { AlertTriangle, Plus, Search } from 'lucide-react';

function getStockStatus(qty, reorderLevel) {
  if (qty <= 0) return { label: 'OUT OF STOCK', variant: 'danger', severity: 3 };
  if (qty <= reorderLevel * 0.5) return { label: 'CRITICAL', variant: 'danger', severity: 2 };
  return { label: 'LOW STOCK', variant: 'warning', severity: 1 };
}

export function LowStock() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const items = useSelector(state => state.invItems.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const categories = useSelector(state => state.invCategories.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const isGM = currentUser?.role === 'GM';

  const lowStockData = items
    .filter(item => item.status === 'ACTIVE')
    .map(item => {
      const itemStockRecords = stock.filter(s => s.itemId === item.id);
      const totalStock = itemStockRecords.reduce((sum, record) => sum + record.quantity, 0);
      const reorderLevel = item.reorderLevel || 0;

      if (totalStock <= reorderLevel) {
        const category = categories.find(c => c.id === item.categoryId);
        const uom = uoms.find(u => u.id === item.baseUomId);
        const prefSupplier = suppliers.find(s => s.id === item.preferredSupplierId);
        const status = getStockStatus(totalStock, reorderLevel);
        const suggestedQty = Math.max(reorderLevel * 2 - totalStock, reorderLevel);

        return {
          ...item,
          currentStock: totalStock,
          categoryName: category?.name || 'Unknown',
          uomCode: uom?.code || '',
          supplierName: prefSupplier?.name || 'None',
          supplierId: prefSupplier?.id || '',
          status,
          suggestedQty,
        };
      }
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => b.status.severity - a.status.severity);

  const filtered = lowStockData.filter(item =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCreatePO = (item) => {
    navigate('/inventory/purchase-orders/new', {
      state: {
        prefilledItem: item.id,
        prefilledSupplierId: item.supplierId,
        prefilledQty: item.suggestedQty,
        prefilledRate: item.currentRate || 0,
        prefilledUomId: item.purchaseUomId || item.baseUomId,
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Low Stock Alerts"
        breadcrumbs="Inventory / Low Stock"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Out of Stock', count: lowStockData.filter(i => i.status.label === 'OUT OF STOCK').length, color: 'text-red-700 bg-red-50 border-red-100' },
          { label: 'Critical', count: lowStockData.filter(i => i.status.label === 'CRITICAL').length, color: 'text-orange-700 bg-orange-50 border-orange-100' },
          { label: 'Low Stock', count: lowStockData.filter(i => i.status.label === 'LOW STOCK').length, color: 'text-amber-700 bg-amber-50 border-amber-100' },
        ].map(s => (
          <Card key={s.label} className={`border ${s.color}`}>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold">{s.count}</div>
              <div className="text-xs font-semibold uppercase mt-1">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-80">
            <SearchInput
              placeholder="Search items or categories..."
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
                <Table.Th>Category</Table.Th>
                <Table.Th>Current Stock</Table.Th>
                <Table.Th>Reorder Level</Table.Th>
                <Table.Th>Suggested Order</Table.Th>
                <Table.Th>Preferred Supplier</Table.Th>
                <Table.Th>Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? 7 : 8}>
                    <EmptyState
                      icon={AlertTriangle}
                      title={search ? "No matches found" : "Stock levels are good"}
                      description={search ? "Try adjusting your search." : "There are currently no items below their reorder level."}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map(item => (
                  <tr key={item.id}>
                    <Table.Td>
                      <div>
                        <div className="font-bold text-text-main">{item.name}</div>
                        <div className="text-xs text-text-muted">{item.code}</div>
                      </div>
                    </Table.Td>
                    <Table.Td>{item.categoryName}</Table.Td>
                    <Table.Td>
                      <div className={`font-bold ${item.currentStock <= 0 ? 'text-red-600' : 'text-status-danger'}`}>
                        {item.currentStock} {item.uomCode}
                      </div>
                    </Table.Td>
                    <Table.Td>{item.reorderLevel} {item.uomCode}</Table.Td>
                    <Table.Td>
                      <span className="font-semibold text-primary">{item.suggestedQty} {item.uomCode}</span>
                    </Table.Td>
                    <Table.Td>{item.supplierName}</Table.Td>
                    <Table.Td>
                      <Badge variant={item.status.variant}>{item.status.label}</Badge>
                    </Table.Td>
                    {!isGM && (
                      <Table.Td align="right">
                        <Button size="sm" onClick={() => handleCreatePO(item)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Create PO
                        </Button>
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



