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
import { updateWasteStatus } from '../../features/inventory/wasteSlice';
import { confirmWaste } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Edit, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };
const REASON_LABELS = { EXPIRED: 'Expired', SPOILED: 'Spoiled', DAMAGED: 'Damaged', QUALITY_ISSUE: 'Quality Issue', OTHER: 'Other' };

export function WasteDetails() {
  const { wasteId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const wastes = useSelector(state => state.invWaste.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const users = useSelector(state => state.users.data) || [];
  const isGM = currentUser?.role === 'GM';
  const [confirmModal, setConfirmModal] = useState(null);

  const waste = wastes.find(w => w.id === wasteId);
  if (!waste) return <div className="p-8 text-center space-y-4"><p className="text-text-muted">Waste record not found.</p><Button onClick={() => navigate('/inventory/waste')}>Back</Button></div>;

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const getUser = id => users.find(u => u.id === id)?.name || 'System';

  const handleCancel = () => {
    dispatch(updateWasteStatus({ id: waste.id, status: 'CANCELLED' }));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'WASTE_CANCELLED', entityType: 'WASTE', entityId: waste.id, description: `Cancelled Waste ${waste.wasteNumber}`, createdAt: new Date().toISOString() }));
    toast.success('Waste record cancelled');
    setConfirmModal(null);
  };

  const handleConfirm = async () => {
    try {
      await dispatch(confirmWaste({ waste, currentUser })).unwrap();
      toast.success(`Waste ${waste.wasteNumber} confirmed`);
      setConfirmModal(null);
    } catch (err) {
      toast.error(err?.message || err || 'Unable to confirm waste');
      setConfirmModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Waste: ${waste.wasteNumber}`} breadcrumbs="Inventory / Waste / Details"
        actions={<div className="flex gap-2">
          {!isGM && waste.status === 'DRAFT' && (<>
            <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setConfirmModal('CANCEL')}><XCircle className="w-4 h-4 mr-2" />Cancel</Button>
            <Button variant="secondary" onClick={() => navigate(`/inventory/waste/new?editId=${waste.id}`)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
            <Button onClick={() => setConfirmModal('CONFIRM')}><CheckCircle className="w-4 h-4 mr-2" />Confirm</Button>
          </>)}
          <Button variant="secondary" onClick={() => navigate('/inventory/waste')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Waste Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Rate</Table.Th>
                    <Table.Th>Amount</Table.Th>
                  </tr></thead>
                  <tbody>
                    {waste.items.map(item => (
                      <tr key={item.id}>
                        <Table.Td><div className="font-bold">{item.itemName}</div><div className="text-xs text-text-muted">{item.itemCode}</div></Table.Td>
                        <Table.Td>{item.quantity} {item.uomName}</Table.Td>
                        <Table.Td>{formatCurrency(item.unitRate)}</Table.Td>
                        <Table.Td className="font-medium">{formatCurrency(item.amount)}</Table.Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Waste Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Status</span><Badge variant={STATUS_VARIANT[waste.status]}>{waste.status}</Badge></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Date</span><span className="font-medium">{new Date(waste.wasteDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Location</span><span className="font-medium">{getLocation(waste.locationId)}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Reason</span><Badge variant="warning">{REASON_LABELS[waste.reason] || waste.reason}</Badge></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Created By</span><span className="font-medium">{getUser(waste.createdBy)}</span></div>
              {waste.confirmedBy && <div className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Confirmed By</span><span className="font-medium">{getUser(waste.confirmedBy)}</span></div>}
              <div className="pt-2 flex justify-between items-center"><span className="font-bold">Total Value</span><span className="text-xl font-bold text-primary">{formatCurrency(waste.total)}</span></div>
            </CardContent>
          </Card>
          {waste.notes && <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{waste.notes}</p></CardContent></Card>}
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal === 'CONFIRM' ? 'Confirm Waste Record?' : 'Cancel Waste Record?'}
        description={
          confirmModal === 'CONFIRM'
            ? 'Are you sure you want to confirm this waste record? Once confirmed, stock will be permanently reduced and this transaction cannot be edited.'
            : 'Are you sure you want to cancel this draft waste record? It will be permanently marked as cancelled.'
        }
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
          {confirmModal === 'CONFIRM' ? (
            <Button onClick={handleConfirm}>Confirm Waste</Button>
          ) : (
            <Button className="bg-status-danger hover:bg-status-danger/90" onClick={handleCancel}>Confirm Cancel</Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
