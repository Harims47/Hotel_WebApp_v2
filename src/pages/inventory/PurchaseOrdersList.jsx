import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ShoppingCart, Plus, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function PurchaseOrdersList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const pos = useSelector(state => state.purchaseOrders.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  
  const isGM = currentUser?.role === 'GM';

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'primary';
      case 'PARTIALLY_RECEIVED': return 'warning';
      case 'RECEIVED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const sortedPOs = [...pos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Purchase Orders" 
        breadcrumbs="Inventory / Purchase Orders"
        actions={
          !isGM && (
            <Button onClick={() => navigate('/inventory/purchase-orders/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create PO
            </Button>
          )
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Table.Th>PO Number</Table.Th>
                <Table.Th>Supplier</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Items</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Actions</Table.Th>
              </tr>
            </thead>
            <tbody>
              {sortedPOs.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState 
                      icon={ShoppingCart} 
                      title="No Purchase Orders" 
                      description="You haven't created any purchase orders yet." 
                    />
                  </td>
                </tr>
              ) : (
                sortedPOs.map(po => {
                  const supplier = suppliers.find(s => s.id === po.supplierId);
                  
                  return (
                    <tr key={po.id}>
                      <Table.Td className="font-bold text-text-main">{po.poNumber}</Table.Td>
                      <Table.Td>{supplier?.name || 'Unknown'}</Table.Td>
                      <Table.Td>{new Date(po.orderDate).toLocaleDateString()}</Table.Td>
                      <Table.Td>{po.items.length} items</Table.Td>
                      <Table.Td className="font-medium">{formatCurrency(po.total)}</Table.Td>
                      <Table.Td>
                        <Badge variant={getStatusBadgeVariant(po.status)}>
                          {po.status.replace('_', ' ')}
                        </Badge>
                      </Table.Td>
                      <Table.Td align="right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/inventory/purchase-orders/${po.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Table.Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
