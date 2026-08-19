import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { 
  approveReimbursement, 
  rejectReimbursement, 
  cancelReimbursement, 
  markReimbursementPaid 
} from '../../features/inventory/reimbursementWorkflow';
import { formatCurrency } from '../../utils/currency';
import { CheckCircle, XCircle, ArrowLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_VARIANTS = {
  PENDING: 'secondary',
  APPROVED: 'primary',
  PAID: 'success',
  REJECTED: 'danger',
  CANCELLED: 'secondary'
};

export function ReimbursementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const reimbursements = useSelector(state => state.reimbursements.data) || [];
  const users = useSelector(state => state.users.data) || [];

  const isGM = currentUser?.role === 'GM';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const reimbursement = reimbursements.find(r => r.id === id);
  if (!reimbursement) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-text-muted">Reimbursement not found.</p>
        <Button onClick={() => navigate('/inventory/reimbursements')}>Back</Button>
      </div>
    );
  }

  const [modalType, setModalType] = useState(null); // 'APPROVE', 'REJECT', 'CANCEL', 'PAY'
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'CASH',
    paymentReference: '',
    paidAt: new Date().toISOString().split('T')[0]
  });

  const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'System';

  const handleAction = () => {
    try {
      if (modalType === 'APPROVE') {
        dispatch(approveReimbursement(reimbursement, currentUser));
        toast.success('Reimbursement approved');
      } else if (modalType === 'REJECT') {
        dispatch(rejectReimbursement(reimbursement, currentUser));
        toast.success('Reimbursement rejected');
      } else if (modalType === 'CANCEL') {
        dispatch(cancelReimbursement(reimbursement, currentUser));
        toast.success('Reimbursement cancelled');
      } else if (modalType === 'PAY') {
        if (!paymentData.paidAt) {
          toast.error('Payment date is required');
          return;
        }
        if (paymentData.paymentMethod !== 'CASH' && !paymentData.paymentReference.trim()) {
          toast.error('Payment reference is required for non-cash methods');
          return;
        }
        dispatch(markReimbursementPaid(reimbursement, paymentData, currentUser));
        toast.success('Reimbursement marked as paid');
      }
      setModalType(null);
    } catch (err) {
      toast.error(err.message || 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Reimbursement: ${reimbursement.reimbursementNo}`} 
        breadcrumbs="Inventory / Reimbursements / Details"
        actions={
          <div className="flex gap-2">
            {!isGM && reimbursement.status === 'PENDING' && (
              <>
                <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setModalType('CANCEL')}>
                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
                {/* Only Super Admin handles financial approvals in V1 */}
                {isSuperAdmin && (
                  <>
                    <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setModalType('REJECT')}>
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button onClick={() => setModalType('APPROVE')}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </>
                )}
              </>
            )}
            
            {isSuperAdmin && reimbursement.status === 'APPROVED' && (
              <Button onClick={() => setModalType('PAY')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <DollarSign className="w-4 h-4 mr-2" /> Mark as Paid
              </Button>
            )}

            <Button variant="secondary" onClick={() => navigate('/inventory/reimbursements')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Reimbursement Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-text-muted block">Employee (Payee)</span>
                  <span className="font-medium text-text-main text-lg">{reimbursement.employeeName}</span>
                </div>
                <div>
                  <span className="text-sm text-text-muted block">Amount</span>
                  <span className="font-bold text-primary text-xl">{formatCurrency(reimbursement.amount)}</span>
                </div>
                <div>
                  <span className="text-sm text-text-muted block">Reimbursement Date</span>
                  <span className="font-medium text-text-main">{new Date(reimbursement.reimbursementDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-sm text-text-muted block">Reason</span>
                  <span className="font-medium text-text-main">{reimbursement.reason}</span>
                </div>
                {reimbursement.notes && (
                  <div className="md:col-span-2 border-t border-border/50 pt-4 mt-2">
                    <span className="text-sm text-text-muted block">Notes</span>
                    <p className="text-sm text-text-main mt-1 whitespace-pre-wrap">{reimbursement.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Purchase Source (Snapshot)</CardTitle></CardHeader>
            <CardContent>
              {reimbursement.supplierName || reimbursement.poNo || reimbursement.grnNo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reimbursement.supplierName && (
                    <div>
                      <span className="text-sm text-text-muted block">Supplier</span>
                      <span className="font-medium text-text-main">{reimbursement.supplierName}</span>
                    </div>
                  )}
                  {reimbursement.poNo && (
                    <div>
                      <span className="text-sm text-text-muted block">Purchase Order</span>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/inventory/purchase-orders/${reimbursement.poId}`)} className="mt-1">
                        {reimbursement.poNo} <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                  {reimbursement.grnNo && (
                    <div>
                      <span className="text-sm text-text-muted block">GRN</span>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/inventory/grn/${reimbursement.grnId}`)} className="mt-1">
                        {reimbursement.grnNo} <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic">Direct expense (No linked inventory source)</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Status & Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Status</span>
                <Badge variant={STATUS_VARIANTS[reimbursement.status]}>{reimbursement.status}</Badge>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Requested By</span>
                <span className="font-medium">{getUserName(reimbursement.createdBy)}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Requested At</span>
                <span className="font-medium">{new Date(reimbursement.requestedAt).toLocaleDateString()}</span>
              </div>
              
              {reimbursement.approvedAt && (
                <>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Approved By</span>
                    <span className="font-medium">{getUserName(reimbursement.approvedBy)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Approved At</span>
                    <span className="font-medium">{new Date(reimbursement.approvedAt).toLocaleDateString()}</span>
                  </div>
                </>
              )}

              {reimbursement.paidAt && (
                <>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Paid By</span>
                    <span className="font-medium">{getUserName(reimbursement.paidBy)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Paid At</span>
                    <span className="font-medium">{new Date(reimbursement.paidAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Method</span>
                    <span className="font-medium">{reimbursement.paymentMethod}</span>
                  </div>
                  {reimbursement.paymentReference && (
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-text-muted">Reference</span>
                      <span className="font-medium text-right max-w-[150px] truncate" title={reimbursement.paymentReference}>
                        {reimbursement.paymentReference}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={
          modalType === 'APPROVE' ? 'Approve Reimbursement' :
          modalType === 'REJECT' ? 'Reject Reimbursement' :
          modalType === 'CANCEL' ? 'Cancel Reimbursement' :
          'Mark as Paid'
        }
        description={
          modalType === 'APPROVE' ? 'Are you sure you want to approve this reimbursement for payment?' :
          modalType === 'REJECT' ? 'Are you sure you want to reject this reimbursement? This action cannot be undone.' :
          modalType === 'CANCEL' ? 'Are you sure you want to cancel this pending reimbursement?' :
          'Enter the payment details below to mark this reimbursement as paid.'
        }
      >
        {modalType === 'PAY' && (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Payment Method</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Payment Method"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            {paymentData.paymentMethod !== 'CASH' && (
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Payment Reference <span className="text-status-danger">*</span></label>
                <Input
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  placeholder="Transaction ID / UTR"
                  aria-label="Payment Reference"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Payment Date</label>
              <Input
                type="date"
                value={paymentData.paidAt}
                onChange={(e) => setPaymentData({ ...paymentData, paidAt: e.target.value })}
                aria-label="Payment Date"
              />
            </div>
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
          <Button 
            className={
              modalType === 'REJECT' || modalType === 'CANCEL' ? 'bg-status-danger hover:bg-status-danger/90' :
              modalType === 'PAY' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
            }
            onClick={handleAction}
          >
            {
              modalType === 'APPROVE' ? 'Confirm Approval' :
              modalType === 'REJECT' ? 'Confirm Reject' :
              modalType === 'CANCEL' ? 'Confirm Cancel' :
              'Confirm Payment'
            }
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
