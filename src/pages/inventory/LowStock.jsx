import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { AlertTriangle, Plus } from 'lucide-react';

export function LowStock() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const items = useSelector(state => state.invItems.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const categories = useSelector(state => state.invCategories.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];

  const isGM = currentUser?.role === 'GM';

  // Calculate low stock items
  const lowStockData = items
    .filter(item => item.status === 'ACTIVE')
    .map(item => {
      // Find total stock across all locations for this item
      const itemStockRecords = stock.filter(s => s.itemId === item.id);
      const totalStock = itemStockRecords.reduce((sum, record) => sum + record.quantity, 0);

      if (totalStock <= item.reorderLevel) {
        const category = categories.find(c => c.id === item.categoryId);
        const uom = uoms.find(u => u.id === item.baseUomId);
        const prefSupplier = suppliers.find(s => s.id === item.preferredSupplierId);
        
        return {
          ...item,
          currentStock: totalStock,
          categoryName: category?.name || 'Unknown',
          uomName: uom?.code || '',
          supplierName: prefSupplier?.name || 'None',
        };
      }
      return null;
    })
    .filter(item => item !== null);

  const handleCreatePO = (item) => {
    navigate('/inventory/purchase-orders/new', { state: { prefilledItem: item.id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Low Stock Alerts" 
        breadcrumbs="Inventory / Low Stock"
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Current Stock</Table.Th>
                <Table.Th>Reorder Level</Table.Th>
                <Table.Th>Preferred Supplier</Table.Th>
                <Table.Th>Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {lowStockData.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? 6 : 7}>
                    <EmptyState 
                      icon={AlertTriangle} 
                      title="Stock levels are good" 
                      description="There are currently no items below their reorder level." 
                    />
                  </td>
                </tr>
              ) : (
                lowStockData.map(item => (
                  <tr key={item.id}>
                    <Table.Td>
                      <div>
                        <div className="font-bold text-text-main">{item.name}</div>
                        <div className="text-xs text-text-muted">{item.code}</div>
                      </div>
                    </Table.Td>
                    <Table.Td>{item.categoryName}</Table.Td>
                    <Table.Td>
                      <div className="font-bold text-status-danger">
                        {item.currentStock} {item.uomName}
                      </div>
                    </Table.Td>
                    <Table.Td>{item.reorderLevel} {item.uomName}</Table.Td>
                    <Table.Td>{item.supplierName}</Table.Td>
                    <Table.Td>
                      <Badge variant="danger">LOW STOCK</Badge>
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
      </Card>
    </div>
  );
}
