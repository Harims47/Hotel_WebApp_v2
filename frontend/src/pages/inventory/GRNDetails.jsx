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
import { updateGRNStatus } from '../../features/inventory/grnSlice';
import { confirmGRN } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

export function GRNDetails() {
  const { grnId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [confirmModal, setConfirmModal] = useState(null);
  
  const { currentUser } = useSelector(state => state.auth);
  const grns = useSelector(state => state.grn.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const purchaseOrders = useSelector(state => state.purchaseOrders.data) || [];
  const users = useSelector(state => state.users.data) || [];
  
  const grn = grns.find(g => g.id === grnId);
  const isGM = currentUser?.role === 'GM';

  if (!grn) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-text-main mb-2">GRN Not Found</h2>
        <Button onClick={() => navigate('/inventory/grn')}>Back to GRNs</Button>
      </div>
    );
  }

  const location = locations.find(l => l.id === grn.locationId);
  const po = purchaseOrders.find(p => p.id === grn.poId);
  const creator = users.find(u => u.id === grn.createdBy);
  const confirmer = users.find(u => u.id === grn.confirmedBy);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const total = grn.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleCancel = () => {
    if (isGM) return;

    dispatch(updateGRNStatus({ id: grn.id, status: 'CANCELLED' }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'GRN_CANCELLED',
      entityType: 'GRN',
      entityId: grn.id,
      description: `Cancelled Draft GRN ${grn.grnNumber}`,
      createdAt: new Date().toISOString()
    }));
    toast.success('GRN Cancelled');
    setConfirmModal(null);
  };

  const handleConfirm = async () => {
    if (isGM) return;
    try {
      await dispatch(confirmGRN({ grn, currentUser })).unwrap();
      toast.success(`GRN ${grn.grnNumber} confirmed`);
      navigate('/inventory/grn');
    } catch (err) {
      toast.error(err?.message || err || 'Unable to confirm GRN');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`GRN: ${grn.grnNumber}`} 
        breadcrumbs="Inventory / GRN / Details"
        actions={
          <div className="flex gap-2">
            {!isGM && grn.status === 'DRAFT' && (
              <>
                <Button variant="outline" className="text-status-danger border-status-danger hover:bg-red-50" onClick={() => setConfirmModal('CANCEL')}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Draft
                </Button>
                <Button onClick={handleConfirm}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm GRN
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => navigate('/inventory/grn')}>
              <FileText className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Received Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item Snapshot</Table.Th>
                      <Table.Th>Received</Table.Th>
                      <Table.Th>Accepted</Table.Th>
                      <Table.Th>Rejected</Table.Th>
                      <Table.Th>Rate</Table.Th>
                      <Table.Th>Amount</Table.Th>
                    </tr>
                  </thead>
                  <tbody>
                    {grn.items.map((gi) => (
                      <tr key={gi.id}>
                        <Table.Td>
                          <div>
                            <div className="font-bold text-text-main">{gi.itemName}</div>
                            <div className="text-xs text-text-muted">{gi.itemCode}</div>
                            {gi.rejectionReason && (
                              <div className="text-xs text-status-danger mt-1">Reason: {gi.rejectionReason}</div>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>{gi.currentReceivedQuantity} {gi.uomName}</Table.Td>
                        <Table.Td className="text-green-600 font-medium">{gi.acceptedQuantity}</Table.Td>
                        <Table.Td className="text-status-danger font-medium">{gi.rejectedQuantity}</Table.Td>
                        <Table.Td>{formatCurrency(gi.unitRate)}</Table.Td>
                        <Table.Td className="font-medium">{formatCurrency(gi.amount)}</Table.Td>
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
            <CardHeader><CardTitle>GRN Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Status</span>
                  <Badge variant={getStatusBadgeVariant(grn.status)}>
                    {grn.status}
                  </Badge>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Supplier</span>
                  <span className="font-medium text-text-main text-right">{grn.supplierSnapshot}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Reference</span>
                  <span className="font-medium text-text-main">{po ? po.poNumber : 'Direct Purchase'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">GRN Date</span>
                  <span className="font-medium text-text-main">{new Date(grn.grnDate).toLocaleDateString()}</span>
                </div>
                {grn.supplierInvoiceNumber && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Invoice No.</span>
                    <span className="font-medium text-text-main">{grn.supplierInvoiceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Location</span>
                  <span className="font-medium text-text-main">{location?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Created By</span>
                  <span className="font-medium text-text-main">{creator?.name || 'System'}</span>
                </div>
                {grn.confirmedAt && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Confirmed By</span>
                    <span className="font-medium text-text-main">{confirmer?.name || 'System'}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-base font-bold text-text-main">Grand Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {grn.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-text-main whitespace-pre-wrap">{grn.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Cancel Draft GRN?"
        description="Are you sure you want to cancel this Draft GRN? This action cannot be undone."
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Close</Button>
          <Button className="bg-status-danger hover:bg-status-danger/90" onClick={handleCancel}>Confirm Cancel</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
