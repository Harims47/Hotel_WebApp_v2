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
import { updateIssueStatus, confirmIssueState } from '../../features/inventory/issueSlice';
import { confirmStockIssue } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Edit, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };

export function IssueDetails() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const issues = useSelector(state => state.invIssues.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const users = useSelector(state => state.users.data) || [];
  const isGM = currentUser?.role === 'GM';
  const [confirmModal, setConfirmModal] = useState(null);

  const issue = issues.find(i => i.id === issueId);
  if (!issue) return (
    <div className="p-8 text-center space-y-4">
      <p className="text-text-muted">Issue not found.</p>
      <Button onClick={() => navigate('/inventory/issues')}>Back to Issues</Button>
    </div>
  );

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const getUser = id => users.find(u => u.id === id)?.name || 'System';

  const handleCancel = () => {
    dispatch(updateIssueStatus({ id: issue.id, status: 'CANCELLED' }));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'STOCK_ISSUE_CANCELLED', entityType: 'STOCK_ISSUE', entityId: issue.id, description: `Cancelled Issue ${issue.issueNumber}`, createdAt: new Date().toISOString() }));
    toast.success('Issue cancelled');
    setConfirmModal(null);
  };

  const handleConfirm = () => {
    try {
      dispatch(confirmStockIssue(issue, currentUser));
      toast.success(`Issue ${issue.issueNumber} confirmed`);
      setConfirmModal(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Issue: ${issue.issueNumber}`}
        breadcrumbs="Inventory / Issues / Details"
        actions={<div className="flex gap-2">
          {!isGM && issue.status === 'DRAFT' && (<>
            <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setConfirmModal('CANCEL')}>
              <XCircle className="w-4 h-4 mr-2" />Cancel
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/inventory/issues/new?editId=${issue.id}`)}>
              <Edit className="w-4 h-4 mr-2" />Edit
            </Button>
            <Button onClick={() => setConfirmModal('CONFIRM')}>
              <CheckCircle className="w-4 h-4 mr-2" />Confirm
            </Button>
          </>)}
          <Button variant="secondary" onClick={() => navigate('/inventory/issues')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
        </div>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Issue Items</CardTitle></CardHeader>
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
                    {issue.items.map(item => (
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
            <CardHeader><CardTitle>Issue Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Status</span>
                <Badge variant={STATUS_VARIANT[issue.status]}>{issue.status}</Badge>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Issue Date</span>
                <span className="font-medium">{new Date(issue.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">From</span>
                <span className="font-medium">{getLocation(issue.fromLocationId)}</span>
              </div>
              {(issue.toLocationId || issue.department) && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">To / Dept</span>
                  <span className="font-medium">{issue.department || getLocation(issue.toLocationId)}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Created By</span>
                <span className="font-medium">{getUser(issue.createdBy)}</span>
              </div>
              {issue.confirmedBy && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Confirmed By</span>
                  <span className="font-medium">{getUser(issue.confirmedBy)}</span>
                </div>
              )}
              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold">Total Value</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(issue.total)}</span>
              </div>
            </CardContent>
          </Card>
          {issue.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-text-main whitespace-pre-wrap">{issue.notes}</p></CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal === 'CONFIRM' ? 'Confirm Stock Issue?' : 'Cancel Stock Issue?'}
        description={
          confirmModal === 'CONFIRM'
            ? 'Are you sure you want to confirm this stock issue? Once confirmed, stock will be updated, stock ledger entries will be created, and this transaction cannot be edited afterward.'
            : 'Are you sure you want to cancel this draft issue? It will be permanently marked as cancelled.'
        }
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
          {confirmModal === 'CONFIRM' ? (
            <Button onClick={handleConfirm}>Confirm Issue</Button>
          ) : (
            <Button className="bg-status-danger hover:bg-status-danger/90" onClick={handleCancel}>Confirm Cancel</Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
