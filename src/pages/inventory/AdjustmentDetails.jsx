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
import { updateAdjustmentStatus } from '../../features/inventory/adjustmentSlice';
import { confirmAdjustment } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Edit, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };
const REASON_LABELS = { PHYSICAL_COUNT: 'Physical Count', DATA_ENTRY_ERROR: 'Data Entry Error', DAMAGE_NOT_RECORDED: 'Damage Not Recorded', OPENING_CORRECTION: 'Opening Correction', OTHER: 'Other' };

export function AdjustmentDetails() {
  const { adjustmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const adjustments = useSelector(state => state.invAdjustments.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const users = useSelector(state => state.users.data) || [];
  const isGM = currentUser?.role === 'GM';
  const [confirmModal, setConfirmModal] = useState(null);

  const adjustment = adjustments.find(a => a.id === adjustmentId);
  if (!adjustment) return <div className="p-8 text-center space-y-4"><p className="text-text-muted">Adjustment record not found.</p><Button onClick={() => navigate('/inventory/adjustments')}>Back</Button></div>;

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const getUser = id => users.find(u => u.id === id)?.name || 'System';

  const handleCancel = () => {
    dispatch(updateAdjustmentStatus({ id: adjustment.id, status: 'CANCELLED' }));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'ADJUSTMENT_CANCELLED', entityType: 'ADJUSTMENT', entityId: adjustment.id, description: `Cancelled Adjustment ${adjustment.adjustmentNumber}`, createdAt: new Date().toISOString() }));
    toast.success('Adjustment cancelled');
    setConfirmModal(null);
  };

  const handleConfirm = () => {
    try {
      dispatch(confirmAdjustment(adjustment, currentUser));
      toast.success(`Adjustment ${adjustment.adjustmentNumber} confirmed`);
      setConfirmModal(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Adjustment: ${adjustment.adjustmentNumber}`} breadcrumbs="Inventory / Adjustments / Details"
        actions={<div className="flex gap-2">
          {!isGM && adjustment.status === 'DRAFT' && (<>
            <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setConfirmModal('CANCEL')}><XCircle className="w-4 h-4 mr-2" />Cancel</Button>
            <Button variant="secondary" onClick={() => navigate(`/inventory/adjustments/new?editId=${adjustment.id}`)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
            <Button onClick={() => setConfirmModal('CONFIRM')}><CheckCircle className="w-4 h-4 mr-2" />Confirm</Button>
          </>)}
          <Button variant="secondary" onClick={() => navigate('/inventory/adjustments')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Adjustment Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr><Table.Th>Item</Table.Th><Table.Th>Sys Qty</Table.Th><Table.Th>Phys Qty</Table.Th><Table.Th>Diff</Table.Th><Table.Th>Rate</Table.Th><Table.Th>Amount (Abs)</Table.Th></tr></thead>
                  <tbody>
                    {adjustment.items.map(item => {
                      const diff = item.differenceQuantity;
                      return (
                      <tr key={item.id}>
                        <Table.Td><div className="font-bold">{item.itemName}</div><div className="text-xs text-text-muted">{item.itemCode}</div></Table.Td>
                        <Table.Td>{item.systemQuantity} {item.uomName}</Table.Td>
                        <Table.Td>{item.physicalQuantity} {item.uomName}</Table.Td>
                        <Table.Td><span className={`font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-text-muted'}`}>{diff > 0 ? `+${diff}` : diff}</span></Table.Td>
                        <Table.Td>{formatCurrency(item.unitRate)}</Table.Td>
                        <Table.Td className="font-medium">{formatCurrency(item.amount)}</Table.Td>
                      </tr>
                    )})}
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Adjustment Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Status</span><Badge variant={STATUS_VARIANT[adjustment.status]}>{adjustment.status}</Badge></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Date</span><span className="font-medium">{new Date(adjustment.adjustmentDate || adjustment.date || adjustment.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Location</span><span className="font-medium">{getLocation(adjustment.locationId)}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Reason</span><span className="font-medium">{REASON_LABELS[adjustment.reason] || adjustment.reason}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Created By</span><span className="font-medium">{getUser(adjustment.createdBy)}</span></div>
              {adjustment.confirmedBy && <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Confirmed By</span><span className="font-medium">{getUser(adjustment.confirmedBy)}</span></div>}
              <div className="pt-2 flex justify-between items-center"><span className="font-bold">Total Variance (Abs)</span><span className="text-xl font-bold text-primary">{formatCurrency(adjustment.total)}</span></div>
            </CardContent>
          </Card>
          {adjustment.notes && <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{adjustment.notes}</p></CardContent></Card>}
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal === 'CONFIRM' ? 'Confirm Stock Adjustment?' : 'Cancel Stock Adjustment?'}
        description={
          confirmModal === 'CONFIRM'
            ? 'Are you sure you want to confirm this adjustment? System stock will be updated to match the physical quantities, ledger entries will be created, and this transaction cannot be edited afterward.'
            : 'Are you sure you want to cancel this draft adjustment? It will be permanently marked as cancelled.'
        }
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
          {confirmModal === 'CONFIRM' ? (
            <Button onClick={handleConfirm}>Confirm Adjustment</Button>
          ) : (
            <Button className="bg-status-danger hover:bg-status-danger/90" onClick={handleCancel}>Confirm Cancel</Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
