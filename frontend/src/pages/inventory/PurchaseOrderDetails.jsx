import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { updatePOStatus } from '../../features/inventory/purchaseOrdersSlice';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Send, XCircle, FileText, Edit, CheckCircle } from 'lucide-react';

export function PurchaseOrderDetails() {
  const { poId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [confirmModal, setConfirmModal] = useState(null);
  const { currentUser } = useSelector(state => state.auth);
  const pos = useSelector(state => state.purchaseOrders.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const users = useSelector(state => state.users.data) || [];
  
  const po = pos.find(p => p.id === poId);
  const isGM = currentUser?.role === 'GM';

  if (!po) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-text-main mb-2">Purchase Order Not Found</h2>
        <Button onClick={() => navigate('/inventory/purchase-orders')}>Back to POs</Button>
      </div>
    );
  }

  const supplier = suppliers.find(s => s.id === po.supplierId);
  const creator = users.find(u => u.id === po.createdBy);

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

  const handleStatusChange = (newStatus) => {
    if (isGM) return;

    dispatch(updatePOStatus({ id: po.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: newStatus === 'SENT' ? 'PO_SENT' : 'PO_CANCELLED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.id,
      description: `PO ${po.poNumber} status changed to ${newStatus}`,
      createdAt: new Date().toISOString()
    }));
    toast.success(`Purchase Order ${newStatus.toLowerCase()}`);
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Purchase Order: ${po.poNumber}`} 
        breadcrumbs="Inventory / Purchase Orders / Details"
        actions={
          <div className="flex gap-2">
            {!isGM && po.status === 'DRAFT' && (
              <>
                <Button variant="outline" className="text-status-danger border-status-danger hover:bg-red-50" onClick={() => setConfirmModal('CANCEL')}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel PO
                </Button>
                <Button variant="secondary" onClick={() => navigate(`/inventory/purchase-orders/new?editId=${po.id}`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Draft
                </Button>
                <Button onClick={() => handleStatusChange('SENT')}>
                  <Send className="w-4 h-4 mr-2" />
                  Send PO
                </Button>
              </>
            )}
            {!isGM && (po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
              <Button onClick={() => navigate(`/inventory/grn/new?poId=${po.id}`)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create GRN
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/inventory/purchase-orders')}>
              <FileText className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item Snapshot</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Rate</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Received</Table.Th>
                      <Table.Th>Pending</Table.Th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((pi) => (
                      <tr key={pi.id}>
                        <Table.Td>
                          <div>
                            <div className="font-bold text-text-main">{pi.itemNameSnapshot}</div>
                            <div className="text-xs text-text-muted">{pi.itemCodeSnapshot}</div>
                          </div>
                        </Table.Td>
                        <Table.Td>{pi.quantity} {pi.uomNameSnapshot}</Table.Td>
                        <Table.Td>{formatCurrency(pi.unitRate)}</Table.Td>
                        <Table.Td className="font-medium">{formatCurrency(pi.amount)}</Table.Td>
                        <Table.Td>
                          <span className={pi.receivedQuantity > 0 ? 'text-green-600 font-medium' : 'text-text-muted'}>
                            {pi.receivedQuantity}
                          </span>
                        </Table.Td>
                        <Table.Td>
                          <span className={pi.pendingQuantity > 0 ? 'text-orange-500 font-medium' : 'text-text-muted'}>
                            {pi.pendingQuantity}
                          </span>
                        </Table.Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>PO Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Status</span>
                  <Badge variant={getStatusBadgeVariant(po.status)}>
                    {po.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Supplier</span>
                  <span className="font-medium text-text-main text-right">{supplier?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Order Date</span>
                  <span className="font-medium text-text-main">{new Date(po.orderDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Expected</span>
                  <span className="font-medium text-text-main">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Not specified'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Created By</span>
                  <span className="font-medium text-text-main">{creator?.name || 'System'}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-base font-bold text-text-main">Grand Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(po.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {po.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-text-main whitespace-pre-wrap">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Cancel Purchase Order?"
        description="Are you sure you want to cancel this Purchase Order? This action cannot be undone."
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Close</Button>
          <Button className="bg-status-danger hover:bg-status-danger/90" onClick={() => handleStatusChange('CANCELLED')}>Confirm Cancel</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
