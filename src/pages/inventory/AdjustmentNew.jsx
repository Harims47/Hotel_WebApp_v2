import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { createAdjustment, updateAdjustment } from '../../features/inventory/adjustmentSlice';
import { confirmAdjustment } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react';

const REASON_OPTIONS = [
  { value: '', label: 'Select reason...' },
  { value: 'PHYSICAL_COUNT', label: 'Physical Count' },
  { value: 'DATA_ENTRY_ERROR', label: 'Data Entry Error' },
  { value: 'DAMAGE_NOT_RECORDED', label: 'Damage Not Recorded' },
  { value: 'OPENING_CORRECTION', label: 'Opening Correction' },
  { value: 'OTHER', label: 'Other' }
];

export function AdjustmentNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const prefillItemId = searchParams.get('itemId');
  const prefillLocationId = searchParams.get('locationId');
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';
  useEffect(() => { if (isGM) { toast.error('No permission'); navigate('/inventory/adjustments'); } }, [isGM, navigate]);

  const items = useSelector(state => state.invItems.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const adjustments = useSelector(state => state.invAdjustments.data) || [];

  const existingAdjustment = editId ? adjustments.find(a => a.id === editId && a.status === 'DRAFT') : null;
  useEffect(() => { if (editId && !existingAdjustment) { toast.error('Not editable'); navigate('/inventory/adjustments'); } }, [editId, existingAdjustment, navigate]);

  const activeItems = items.filter(i => i.status === 'ACTIVE');
  const activeLocations = locations.filter(l => l.status === 'ACTIVE');

  const [header, setHeader] = useState({
    locationId: existingAdjustment?.locationId || prefillLocationId || '',
    reason: existingAdjustment?.reason || '',
    adjustmentDate: existingAdjustment?.adjustmentDate || new Date().toISOString().split('T')[0],
    notes: existingAdjustment?.notes || ''
  });

  const getSystemStock = (itemId, locationId) => {
    if (!itemId || !locationId) return 0;
    return stock.filter(s => s.itemId === itemId && s.locationId === locationId).reduce((s, r) => s + r.quantity, 0);
  };

  const [adjItems, setAdjItems] = useState(() => {
    if (existingAdjustment) {
      return existingAdjustment.items.map(i => ({ id: i.id, itemId: i.itemId, physicalQuantity: i.physicalQuantity, unitRate: i.unitRate }));
    }
    if (prefillItemId) return [{ id: uuidv4(), itemId: prefillItemId, physicalQuantity: '', unitRate: 0 }];
    return [{ id: uuidv4(), itemId: '', physicalQuantity: '', unitRate: 0 }];
  });

  const handleAdd = () => setAdjItems([...adjItems, { id: uuidv4(), itemId: '', physicalQuantity: '', unitRate: 0 }]);
  const handleRemove = id => setAdjItems(adjItems.filter(i => i.id !== id));
  
  const handleChange = (id, field, value) => {
    setAdjItems(adjItems.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        if (field === 'itemId' && header.locationId) {
          updated.physicalQuantity = getSystemStock(value, header.locationId); // default to sys stock
        }
        return updated;
      }
      return i;
    }));
  };

  const calcDiff = item => {
    if (item.physicalQuantity === '') return 0;
    const sys = getSystemStock(item.itemId, header.locationId);
    return (parseFloat(item.physicalQuantity) || 0) - sys;
  };

  const calcAmount = item => Math.abs(calcDiff(item)) * (parseFloat(item.unitRate) || 0);
  const total = adjItems.reduce((s, i) => s + calcAmount(i), 0);
  const getNumber = () => `ADJ-${String(adjustments.length + 1).padStart(5, '0')}`;

  const validate = () => {
    if (!header.locationId) { toast.error('Location is required'); return false; }
    if (!header.reason) { toast.error('Reason is required'); return false; }
    if (adjItems.length === 0) { toast.error('Add at least one item'); return false; }
    for (const item of adjItems) {
      if (!item.itemId) { toast.error('Select an item for all rows'); return false; }
      if (item.physicalQuantity === '' || parseFloat(item.physicalQuantity) < 0) { toast.error('Physical quantity cannot be negative'); return false; }
      const diff = calcDiff(item);
      const sys = getSystemStock(item.itemId, header.locationId);
      if (sys + diff < 0) {
        toast.error('Adjustment would result in negative stock'); return false;
      }
    }
    return true;
  };

  const buildFinalItems = () => adjItems.map(ai => {
    const itemDef = items.find(i => i.id === ai.itemId);
    const uomDef = uoms.find(u => u.id === itemDef?.baseUomId);
    const sys = getSystemStock(ai.itemId, header.locationId);
    const diff = calcDiff(ai);
    return {
      id: ai.id, itemId: ai.itemId, itemCode: itemDef?.code || '', itemName: itemDef?.name || '',
      uomId: itemDef?.baseUomId || '', uomName: uomDef?.code || '',
      systemQuantity: sys, physicalQuantity: parseFloat(ai.physicalQuantity) || 0, differenceQuantity: diff,
      unitRate: parseFloat(ai.unitRate) || 0, amount: calcAmount(ai)
    };
  });

  const handleSave = (confirm) => {
    if (!validate()) return;
    const finalItems = buildFinalItems();
    const timestamp = new Date().toISOString();

    if (editId && existingAdjustment) {
      dispatch(updateAdjustment({ id: existingAdjustment.id, ...header, items: finalItems, total }));
      toast.success('Adjustment updated'); navigate('/inventory/adjustments'); return;
    }

    const newId = `adj-${uuidv4().substring(0, 8)}`;
    const adjNumber = getNumber();
    const newAdj = { id: newId, adjustmentNumber: adjNumber, ...header, status: 'DRAFT', items: finalItems, total, createdBy: currentUser?.id, createdAt: timestamp, updatedAt: timestamp };

    dispatch(createAdjustment(newAdj));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'ADJUSTMENT_CREATED', entityType: 'ADJUSTMENT', entityId: newId, description: `Created Adjustment ${adjNumber}`, createdAt: timestamp }));

    if (confirm) {
      try { dispatch(confirmAdjustment(newAdj, currentUser)); toast.success(`Adjustment ${adjNumber} confirmed`); }
      catch (err) { toast.error(err.message); navigate('/inventory/adjustments'); return; }
    } else { toast.success('Draft saved'); }
    navigate('/inventory/adjustments');
  };

  return (
    <div className="space-y-6">
      <PageHeader title={editId ? `Edit Adjustment ${existingAdjustment?.adjustmentNumber || ''}` : 'New Adjustment'} breadcrumbs="Inventory / Adjustments / New"
        actions={<>
          <Button variant="outline" onClick={() => navigate('/inventory/adjustments')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)}><Save className="w-4 h-4 mr-2" />Save Draft</Button>
          <Button onClick={() => handleSave(true)}><CheckCircle className="w-4 h-4 mr-2" />Confirm Adjustment</Button>
        </>} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Adjustment Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select label="Location *" value={header.locationId} onChange={e => setHeader({ ...header, locationId: e.target.value })} options={[{ value: '', label: 'Select location...' }, ...activeLocations.map(l => ({ value: l.id, label: l.name }))]} />
                <Select label="Reason *" value={header.reason} onChange={e => setHeader({ ...header, reason: e.target.value })} options={REASON_OPTIONS} />
                <Input type="date" label="Adjustment Date *" value={header.adjustmentDate} onChange={e => setHeader({ ...header, adjustmentDate: e.target.value })} />
              </div>
              <div className="mt-4"><Input label="Notes" value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} placeholder="Optional notes" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Adjustment Items</CardTitle><Button size="sm" variant="outline" onClick={handleAdd}><Plus className="w-4 h-4 mr-1" />Add Item</Button></CardHeader>
            <CardContent>
              {/* Mobile */}
              <div className="md:hidden space-y-4">
                {adjItems.map((ai, idx) => {
                  const sys = getSystemStock(ai.itemId, header.locationId);
                  const diff = calcDiff(ai);
                  return (
                    <div key={ai.id} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex justify-between items-center"><span className="text-xs font-bold text-primary uppercase">Item {idx + 1}</span><button onClick={() => handleRemove(ai.id)} className="p-1.5 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button></div>
                      <div><label className="text-xs text-text-muted block mb-1">Item *</label><Select label="Item" hideLabel value={ai.itemId} onChange={e => handleChange(ai.id, 'itemId', e.target.value)} options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} /></div>
                      {ai.itemId && <p className="text-xs text-text-muted">System Stock: <span className="font-medium">{sys}</span></p>}
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-text-muted block mb-1">Physical Qty *</label><Input label="Quantity" hideLabel type="number" min="0" step="0.1" value={ai.physicalQuantity} onChange={e => handleChange(ai.id, 'physicalQuantity', e.target.value)} /></div>
                        <div><label className="text-xs text-text-muted block mb-1">Rate (₹)</label><Input label="Rate" hideLabel type="number" min="0" step="0.01" value={ai.unitRate} onChange={e => handleChange(ai.id, 'unitRate', e.target.value)} /></div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-xs">Diff: <span className={`font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-text-muted'}`}>{diff > 0 ? `+${diff}` : diff}</span></div>
                        <div className="font-medium">{formatCurrency(calcAmount(ai))}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <thead><tr><Table.Th>Item *</Table.Th><Table.Th>System Qty</Table.Th><Table.Th>Physical Qty *</Table.Th><Table.Th>Diff</Table.Th><Table.Th>Rate (₹)</Table.Th><Table.Th>Amount (Abs)</Table.Th><Table.Th align="right"></Table.Th></tr></thead>
                  <tbody>
                    {adjItems.length === 0 ? <tr><td colSpan="7" className="text-center py-8 text-text-muted">Add items to adjust</td></tr> :
                      adjItems.map(ai => {
                        const sys = getSystemStock(ai.itemId, header.locationId);
                        const diff = calcDiff(ai);
                        return (
                          <tr key={ai.id}>
                            <Table.Td className="min-w-[200px]"><Select label="Item" hideLabel value={ai.itemId} onChange={e => handleChange(ai.id, 'itemId', e.target.value)} options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} /></Table.Td>
                            <Table.Td><span className="font-medium">{ai.itemId ? sys : '—'}</span></Table.Td>
                            <Table.Td className="min-w-[120px]"><Input label="Quantity" hideLabel type="number" min="0" step="0.1" value={ai.physicalQuantity} onChange={e => handleChange(ai.id, 'physicalQuantity', e.target.value)} /></Table.Td>
                            <Table.Td><span className={`font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-text-muted'}`}>{ai.itemId ? (diff > 0 ? `+${diff}` : diff) : '—'}</span></Table.Td>
                            <Table.Td className="min-w-[120px]"><Input label="Rate" hideLabel type="number" min="0" step="0.01" value={ai.unitRate} onChange={e => handleChange(ai.id, 'unitRate', e.target.value)} /></Table.Td>
                            <Table.Td className="font-medium">{formatCurrency(calcAmount(ai))}</Table.Td>
                            <Table.Td align="right"><button onClick={() => handleRemove(ai.id)} className="p-2 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button></Table.Td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-1">
          <Card className="sticky top-6">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Total Items</span><span className="font-medium">{adjItems.length}</span></div>
                <div className="pt-3 border-t border-border flex justify-between"><span className="font-bold">Total Variance</span><span className="text-xl font-bold text-primary">{formatCurrency(total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
