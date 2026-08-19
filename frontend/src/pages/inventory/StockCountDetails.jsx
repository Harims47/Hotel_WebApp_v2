import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { updateStockCountStatus } from '../../features/inventory/stockCountSlice';
import { confirmStockCount } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Edit, XCircle, CheckCircle, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

export function StockCountDetails() {
  const { countId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [confirmModal, setConfirmModal] = useState(null); // 'CANCEL' or 'CONFIRM'

  const { currentUser } = useSelector(state => state.auth);
  const stockCounts = useSelector(state => state.invStockCounts.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const adjustments = useSelector(state => state.invAdjustments.data) || [];
  const users = useSelector(state => state.users.data) || [];
  const isGM = currentUser?.role === 'GM';

  const stockCount = stockCounts.find(sc => sc.id === countId);
  if (!stockCount) return <div className="p-8 text-center space-y-4"><p className="text-text-muted">Stock Count not found.</p><Button onClick={() => navigate('/inventory/stock-counts')}>Back</Button></div>;

  const location = locations.find(l => l.id === stockCount.locationId);
  const getUser = id => users.find(u => u.id === id)?.name || 'System';

  // Find linked adjustment if confirmed
  const linkedAdjustment = adjustments.find(a => a.referenceType === 'STOCK_COUNT' && a.referenceId === stockCount.id);

  const handleCancel = () => {
    dispatch(updateStockCountStatus({ id: stockCount.id, status: 'CANCELLED' }));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'STOCK_COUNT_CANCELLED', entityType: 'STOCK_COUNT', entityId: stockCount.id, description: `Cancelled Stock Count ${stockCount.countNumber}`, createdAt: new Date().toISOString() }));
    toast.success('Stock Count cancelled');
    setConfirmModal(null);
  };

  const handleConfirm = async () => {
    try {
      await dispatch(confirmStockCount({ stockCount, currentUser })).unwrap();
      toast.success(`Stock Count ${stockCount.countNumber} confirmed`);
      setConfirmModal(null);
    } catch (err) {
      toast.error(err?.message || err || 'Unable to confirm stock count');
      setConfirmModal(null);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const totalVarianceValue = stockCount.items?.reduce((sum, i) => sum + (i.varianceValue || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader title={`Stock Count: ${stockCount.countNumber}`} breadcrumbs="Inventory / Stock Counts / Details"
        actions={<div className="flex gap-2">
          {!isGM && stockCount.status === 'DRAFT' && (<>
            <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setConfirmModal('CANCEL')}><XCircle className="w-4 h-4 mr-2" />Cancel</Button>
            <Button variant="secondary" onClick={() => navigate(`/inventory/stock-counts/new?editId=${stockCount.id}`)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
            <Button onClick={() => setConfirmModal('CONFIRM')}><CheckCircle className="w-4 h-4 mr-2" />Confirm</Button>
          </>)}
          <Button variant="secondary" onClick={() => navigate('/inventory/stock-counts')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Count Items</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item Snapshot</Table.Th>
                      <Table.Th>System Qty</Table.Th>
                      <Table.Th>Physical Qty</Table.Th>
                      <Table.Th>Variance</Table.Th>
                      <Table.Th>Var. Value</Table.Th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockCount.items?.map((item) => (
                      <tr key={item.id}>
                        <Table.Td>
                          <div className="font-bold text-text-main">{item.itemName}</div>
                          <div className="text-xs text-text-muted">{item.itemCode}</div>
                        </Table.Td>
                        <Table.Td>{item.systemQuantity} {item.uomName}</Table.Td>
                        <Table.Td className="font-bold text-text-main">{item.physicalQuantity} {item.uomName}</Table.Td>
                        <Table.Td>
                          <span className={item.varianceQuantity < 0 ? 'text-status-danger' : item.varianceQuantity > 0 ? 'text-green-600' : 'text-text-muted'}>
                            {item.varianceQuantity > 0 ? '+' : ''}{item.varianceQuantity}
                          </span>
                        </Table.Td>
                        <Table.Td>
                          <span className={item.varianceValue < 0 ? 'text-status-danger' : item.varianceValue > 0 ? 'text-green-600' : 'text-text-muted'}>
                            {formatCurrency(item.varianceValue)}
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
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Status</span>
                  <Badge variant={getStatusBadgeVariant(stockCount.status)}>{stockCount.status}</Badge>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Date</span>
                  <span className="font-medium text-text-main">{new Date(stockCount.countDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Location</span>
                  <span className="font-medium text-text-main text-right">{location?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">Created By</span>
                  <span className="font-medium text-text-main">{getUser(stockCount.createdBy)}</span>
                </div>
                {stockCount.confirmedAt && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Confirmed By</span>
                    <span className="font-medium text-text-main">{getUser(stockCount.confirmedBy)}</span>
                  </div>
                )}
                {linkedAdjustment && (
                  <div className="flex flex-col gap-2 border-b border-border pb-2">
                    <span className="text-text-muted">Linked Adjustment</span>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/inventory/adjustments/${linkedAdjustment.id}`)}>
                      {linkedAdjustment.adjustmentNumber}
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-base font-bold text-text-main">Variance Value</span>
                  <span className={`text-xl font-bold ${totalVarianceValue < 0 ? 'text-status-danger' : totalVarianceValue > 0 ? 'text-green-600' : 'text-text-main'}`}>
                    {formatCurrency(totalVarianceValue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          {stockCount.notes && <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{stockCount.notes}</p></CardContent></Card>}
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal === 'CONFIRM' ? 'Confirm Stock Count?' : 'Cancel Stock Count?'}
        description={
          confirmModal === 'CONFIRM'
            ? 'Are you sure you want to confirm this count? An adjustment record will be automatically generated for any variances. This action cannot be edited afterward.'
            : 'Are you sure you want to cancel this draft count? It will be permanently marked as cancelled.'
        }
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
          {confirmModal === 'CONFIRM' ? (
            <Button onClick={handleConfirm}>Confirm Count</Button>
          ) : (
            <Button className="bg-status-danger hover:bg-status-danger/90" onClick={handleCancel}>Confirm Cancel</Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
