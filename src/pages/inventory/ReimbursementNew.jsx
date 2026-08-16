import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { createReimbursement } from '../../features/inventory/reimbursementWorkflow';
import { formatCurrency } from '../../utils/currency';

export function ReimbursementNew() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const users = useSelector(state => state.users.data) || [];
  const activeUsers = users.filter(u => u.status === 'ACTIVE');
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const pos = useSelector(state => state.purchaseOrders.data) || [];
  const grns = useSelector(state => state.grn.data) || [];

  const [formData, setFormData] = useState({
    reimbursementNo: `R-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    employeeId: '',
    purchaseSource: 'OTHER', // 'INVENTORY' or 'OTHER'
    supplierId: '',
    poId: '',
    grnId: '',
    amount: '',
    reimbursementDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Cascading data logic
  const validPOs = formData.supplierId ? pos.filter(po => po.supplierId === formData.supplierId && ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status)) : [];
  const validGRNs = formData.poId ? grns.filter(grn => grn.poId === formData.poId) : (formData.supplierId ? grns.filter(grn => grn.supplierId === formData.supplierId) : []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Reset downstream fields if upstream changes
    if (name === 'purchaseSource' && value === 'OTHER') {
      newFormData.supplierId = '';
      newFormData.poId = '';
      newFormData.grnId = '';
    }
    if (name === 'supplierId') {
      newFormData.poId = '';
      newFormData.grnId = '';
    }
    if (name === 'poId') {
      newFormData.grnId = '';
      
      // Auto-set amount if a GRN is selected later, or provide guidance
    }
    if (name === 'grnId' && value) {
      const selectedGRN = grns.find(g => g.id === value);
      if (selectedGRN) {
        newFormData.amount = selectedGRN.totalAmount; // Suggest GRN amount
      }
    }

    setFormData(newFormData);
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.reimbursementDate) newErrors.reimbursementDate = 'Reimbursement date is required';
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const employee = activeUsers.find(u => u.id === formData.employeeId);
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const po = pos.find(p => p.id === formData.poId);
    const grn = grns.find(g => g.id === formData.grnId);

    const submissionData = {
      reimbursementNo: formData.reimbursementNo,
      employeeId: formData.employeeId,
      employeeName: employee?.name || '',
      supplierId: formData.supplierId || null,
      supplierName: supplier?.name || null,
      poId: formData.poId || null,
      poNo: po?.poNumber || null,
      grnId: formData.grnId || null,
      grnNo: grn?.grnNumber || null,
      amount: Number(formData.amount),
      reimbursementDate: formData.reimbursementDate,
      reason: formData.reason,
      notes: formData.notes
    };

    dispatch(createReimbursement(submissionData, currentUser));
    navigate('/inventory/reimbursements');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Reimbursement" breadcrumbs="Inventory / Reimbursements / New" />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Reimbursement No <span className="text-status-danger">*</span></label>
                <Input name="reimbursementNo" value={formData.reimbursementNo} disabled aria-label="Reimbursement No" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Employee <span className="text-status-danger">*</span></label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.employeeId ? 'border-status-danger' : 'border-border'}`}
                  aria-label="Select Employee"
                >
                  <option value="">Select Employee...</option>
                  {activeUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
                {errors.employeeId && <p className="text-sm text-status-danger mt-1">{errors.employeeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Purchase Source <span className="text-status-danger">*</span></label>
                <select
                  name="purchaseSource"
                  value={formData.purchaseSource}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Purchase Source"
                >
                  <option value="INVENTORY">Inventory Purchase (Linked to PO/GRN)</option>
                  <option value="OTHER">Other Expense (Direct)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Reimbursement Date <span className="text-status-danger">*</span></label>
                <Input
                  type="date"
                  name="reimbursementDate"
                  value={formData.reimbursementDate}
                  onChange={handleChange}
                  error={errors.reimbursementDate}
                  aria-label="Reimbursement Date"
                />
              </div>

              {formData.purchaseSource === 'INVENTORY' && (
                <>
                  <div className="md:col-span-2 p-4 border border-border/50 rounded-lg bg-gray-50/50 space-y-4">
                    <h4 className="text-sm font-semibold text-text-main">Link Inventory Source</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Supplier</label>
                        <select
                          name="supplierId"
                          value={formData.supplierId}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                          aria-label="Select Supplier"
                        >
                          <option value="">Select Supplier...</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Purchase Order</label>
                        <select
                          name="poId"
                          value={formData.poId}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                          disabled={!formData.supplierId}
                          aria-label="Select PO"
                        >
                          <option value="">Select PO...</option>
                          {validPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} ({formatCurrency(po.totalAmount)})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-1">GRN</label>
                        <select
                          name="grnId"
                          value={formData.grnId}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                          disabled={!formData.supplierId}
                          aria-label="Select GRN"
                        >
                          <option value="">Select GRN...</option>
                          {validGRNs.map(grn => <option key={grn.id} value={grn.id}>{grn.grnNumber} ({formatCurrency(grn.totalAmount)})</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Amount (₹) <span className="text-status-danger">*</span></label>
                <Input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  error={errors.amount}
                  placeholder="e.g. 2500"
                  aria-label="Reimbursement Amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Reason <span className="text-status-danger">*</span></label>
                <Input
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  error={errors.reason}
                  placeholder="e.g. Emergency vegetable purchase"
                  aria-label="Reason for reimbursement"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-main mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Additional details..."
                  aria-label="Notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate('/inventory/reimbursements')}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
