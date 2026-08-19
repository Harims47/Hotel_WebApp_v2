import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { createReimbursement } from '../../features/inventory/reimbursementWorkflow';
import { formatCurrency } from '../../utils/currency';
import { UploadCloud, FileText, X, ImageIcon, CheckCircle2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Upload constraints
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png', '.pdf'];
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supporting Document Upload Component (self-contained)
// ─────────────────────────────────────────────────────────────────────────────
function SupportingDocumentUpload({ file, preview, onSelect, onRemove, uploadError }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onSelect(dropped);
  }, [onSelect]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleInputChange = (e) => { const f = e.target.files?.[0]; if (f) onSelect(f); };

  const isPDF = file?.type === 'application/pdf';
  const isImage = file && !isPDF;

  return (
    <div>
      {/* Hidden file input — validates on selection */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTS.join(',')}
        className="hidden"
        onChange={handleInputChange}
        aria-label="Upload supporting document"
      />

      {!file ? (
        /* ── Drop zone ──────────────────────────────────────────────────── */
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload receipt or supporting document"
          onClick={openPicker}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openPicker()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-xl p-8 cursor-pointer
            transition-all duration-200 select-none
            ${isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/60 hover:bg-primary/[0.02]'
            }
          `}
        >
          <div className={`rounded-full p-3 transition-colors ${isDragOver ? 'bg-primary/10' : 'bg-surface'}`}>
            <UploadCloud className={`w-7 h-7 transition-colors ${isDragOver ? 'text-primary' : 'text-text-muted'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-main">Upload Receipt</p>
            <p className="text-xs text-text-muted mt-0.5">Drag &amp; drop or click to browse</p>
            <p className="text-xs text-text-muted mt-1 opacity-75">JPG, PNG or PDF · Max 5 MB</p>
          </div>
        </div>
      ) : (
        /* ── File preview ───────────────────────────────────────────────── */
        <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-surface">
          {/* Thumbnail / Icon */}
          {isImage && preview ? (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border shadow-sm">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg border border-border bg-red-50 flex flex-col items-center justify-center gap-0.5 shadow-sm">
              <FileText className="w-6 h-6 text-red-500" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">PDF</span>
            </div>
          )}

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-main truncate">{file.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{formatBytes(file.size)}</p>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-xs text-green-600 font-medium">Attached</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove attachment"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-status-danger rounded-lg hover:bg-red-50 border border-red-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />Remove
            </button>
            <button
              type="button"
              onClick={openPicker}
              className="text-xs text-primary hover:underline font-medium"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {/* Validation error */}
      {uploadError && (
        <p className="text-xs text-status-danger mt-1.5 flex items-center gap-1">
          <span>⚠</span> {uploadError}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
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
    purchaseSource: 'OTHER',
    supplierId: '',
    poId: '',
    grnId: '',
    amount: '',
    reimbursementDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Supporting document state — separate from formData so file changes never
  // trigger form field resets.
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedPreview, setAttachedPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // ── Cascading dropdowns ─────────────────────────────────────────────────
  const validPOs   = formData.supplierId
    ? pos.filter(po => po.supplierId === formData.supplierId && ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status))
    : [];
  const validGRNs  = formData.poId
    ? grns.filter(grn => grn.poId === formData.poId)
    : formData.supplierId
      ? grns.filter(grn => grn.supplierId === formData.supplierId)
      : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };

    if (name === 'purchaseSource' && value === 'OTHER') {
      next.supplierId = ''; next.poId = ''; next.grnId = '';
    }
    if (name === 'supplierId') { next.poId = ''; next.grnId = ''; }
    if (name === 'poId')       { next.grnId = ''; }
    if (name === 'grnId' && value) {
      const g = grns.find(g => g.id === value);
      if (g) next.amount = g.totalAmount;
    }

    setFormData(next);
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  // ── File selection handler ──────────────────────────────────────────────
  const handleFileSelect = (file) => {
    setUploadError('');

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload JPG, PNG, or PDF.');
      return;
    }
    // Validate extension (second defence)
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError('Unsupported file type. Please upload JPG, PNG, or PDF.');
      return;
    }
    // Validate size
    if (file.size > MAX_BYTES) {
      setUploadError('File size must be 5 MB or less.');
      return;
    }

    setAttachedFile(file);

    // Generate preview for images only
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachedPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachedPreview(null);
    }
  };

  const handleFileRemove = () => {
    setAttachedFile(null);
    setAttachedPreview(null);
    setUploadError('');
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.employeeId)                         errs.employeeId         = 'Employee is required';
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount         = 'Valid amount is required';
    if (!formData.reimbursementDate)                  errs.reimbursementDate  = 'Reimbursement date is required';
    if (!formData.reason.trim())                      errs.reason             = 'Reason is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const employee = activeUsers.find(u => u.id === formData.employeeId);
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const po       = pos.find(p => p.id === formData.poId);
    const grn      = grns.find(g => g.id === formData.grnId);

    const submissionData = {
      reimbursementNo:    formData.reimbursementNo,
      employeeId:         formData.employeeId,
      employeeName:       employee?.name || '',
      supplierId:         formData.supplierId || null,
      supplierName:       supplier?.name || null,
      poId:               formData.poId || null,
      poNo:               po?.poNumber || null,
      grnId:              formData.grnId || null,
      grnNo:              grn?.grnNumber || null,
      amount:             Number(formData.amount),
      reimbursementDate:  formData.reimbursementDate,
      reason:             formData.reason,
      notes:              formData.notes,
      // Attachment metadata — file itself is stored as base64 in attachmentData
      // when backend attachment support is integrated. The field is ready.
      attachmentName:     attachedFile?.name || null,
      attachmentSize:     attachedFile?.size || null,
      attachmentType:     attachedFile?.type || null,
      attachmentData:     attachedPreview || null, // base64 for image; null for PDF
    };

    dispatch(createReimbursement(submissionData, currentUser));
    navigate('/inventory/reimbursements');
  };

  // ─────────────────────────────────────────────────────────────────────────
  const selectClass = (hasError = false) =>
    `w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${hasError ? 'border-status-danger' : 'border-border'}`;

  return (
    <div className="space-y-6">
      <PageHeader title="New Reimbursement" breadcrumbs="Inventory / Reimbursements / New" />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Reimbursement No */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Reimbursement No <span className="text-status-danger">*</span>
                </label>
                <Input name="reimbursementNo" value={formData.reimbursementNo} disabled aria-label="Reimbursement No" />
              </div>

              {/* Employee */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Employee <span className="text-status-danger">*</span>
                </label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={selectClass(!!errors.employeeId)}
                  aria-label="Select Employee"
                >
                  <option value="">Select Employee...</option>
                  {activeUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
                {errors.employeeId && <p className="text-sm text-status-danger mt-1">{errors.employeeId}</p>}
              </div>

              {/* Purchase Source */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Purchase Source <span className="text-status-danger">*</span>
                </label>
                <select
                  name="purchaseSource"
                  value={formData.purchaseSource}
                  onChange={handleChange}
                  className={selectClass()}
                  aria-label="Purchase Source"
                >
                  <option value="INVENTORY">Inventory Purchase (Linked to PO/GRN)</option>
                  <option value="OTHER">Other Expense (Direct)</option>
                </select>
              </div>

              {/* Reimbursement Date */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Reimbursement Date <span className="text-status-danger">*</span>
                </label>
                <Input
                  type="date"
                  name="reimbursementDate"
                  value={formData.reimbursementDate}
                  onChange={handleChange}
                  error={errors.reimbursementDate}
                  aria-label="Reimbursement Date"
                />
              </div>

              {/* Inventory link section (conditional) */}
              {formData.purchaseSource === 'INVENTORY' && (
                <div className="md:col-span-2 p-4 border border-border/50 rounded-lg bg-gray-50/50 space-y-4">
                  <h4 className="text-sm font-semibold text-text-main">Link Inventory Source</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-1">Supplier</label>
                      <select name="supplierId" value={formData.supplierId} onChange={handleChange} className={selectClass()} aria-label="Select Supplier">
                        <option value="">Select Supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-1">Purchase Order</label>
                      <select name="poId" value={formData.poId} onChange={handleChange} className={selectClass()} disabled={!formData.supplierId} aria-label="Select PO">
                        <option value="">Select PO...</option>
                        {validPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} ({formatCurrency(po.totalAmount)})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-1">GRN</label>
                      <select name="grnId" value={formData.grnId} onChange={handleChange} className={selectClass()} disabled={!formData.supplierId} aria-label="Select GRN">
                        <option value="">Select GRN...</option>
                        {validGRNs.map(grn => <option key={grn.id} value={grn.id}>{grn.grnNumber} ({formatCurrency(grn.totalAmount)})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Amount (₹) <span className="text-status-danger">*</span>
                </label>
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

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Reason <span className="text-status-danger">*</span>
                </label>
                <Input
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  error={errors.reason}
                  placeholder="e.g. Emergency vegetable purchase"
                  aria-label="Reason for reimbursement"
                />
              </div>

              {/* ── Supporting Document ──────────────────────────────────────────── */}
              <div className="md:col-span-2">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-text-main">Supporting Document</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Upload the receipt, bill, or other proof for this reimbursement.
                  </p>
                </div>
                <SupportingDocumentUpload
                  file={attachedFile}
                  preview={attachedPreview}
                  onSelect={handleFileSelect}
                  onRemove={handleFileRemove}
                  uploadError={uploadError}
                />
              </div>

              {/* Notes */}
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

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate('/inventory/reimbursements')}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
