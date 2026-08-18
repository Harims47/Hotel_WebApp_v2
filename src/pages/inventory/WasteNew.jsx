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
import { createWaste, updateWaste } from '../../features/inventory/wasteSlice';
import { confirmWaste } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react';

const WASTE_REASONS = [
  { value: '', label: 'Select reason...' },
  { value: 'SPOILED', label: 'Spoiled' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'OVERPRODUCTION', label: 'Overproduction' },
  { value: 'PREPARATION_WASTE', label: 'Preparation Waste' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'OTHER', label: 'Other' }
];

export function WasteNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const prefillItemId = searchParams.get('itemId');
  const prefillLocationId = searchParams.get('locationId');
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';
  useEffect(() => { if (isGM) { toast.error('No permission'); navigate('/inventory/waste'); } }, [isGM, navigate]);

  const items = useSelector(state => state.invItems.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const wastes = useSelector(state => state.invWaste.data) || [];

  const existingWaste = editId ? wastes.find(w => w.id === editId && w.status === 'DRAFT') : null;
  useEffect(() => { if (editId && !existingWaste) { toast.error('Not editable'); navigate('/inventory/waste'); } }, [editId, existingWaste, navigate]);

  const activeItems = items.filter(i => i.status === 'ACTIVE');
  const activeLocations = locations.filter(l => l.status === 'ACTIVE');

  const [header, setHeader] = useState({
    locationId: existingWaste?.locationId || prefillLocationId || '',
    reason: existingWaste?.reason || '',
    wasteDate: existingWaste?.wasteDate || new Date().toISOString().split('T')[0],
    notes: existingWaste?.notes || ''
  });

  const [wasteItems, setWasteItems] = useState(() => {
    if (existingWaste) return existingWaste.items.map(i => ({ id: i.id, itemId: i.itemId, quantity: i.quantity, unitRate: i.unitRate }));
    if (prefillItemId) return [{ id: uuidv4(), itemId: prefillItemId, quantity: 1, unitRate: 0 }];
    return [{ id: uuidv4(), itemId: '', quantity: 1, unitRate: 0 }];
  });

  const getAvail = (itemId, locationId) => {
    if (!itemId || !locationId) return 0;
    return stock.filter(s => s.itemId === itemId && s.locationId === locationId).reduce((s, r) => s + r.quantity, 0);
  };

  const handleAdd = () => setWasteItems([...wasteItems, { id: uuidv4(), itemId: '', quantity: 1, unitRate: 0 }]);
  const handleRemove = id => setWasteItems(wasteItems.filter(i => i.id !== id));
  const handleChange = (id, field, value) => setWasteItems(wasteItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  const calcAmount = item => (parseFloat(item.quantity) || 0) * (parseFloat(item.unitRate) || 0);
  const total = wasteItems.reduce((s, i) => s + calcAmount(i), 0);
  const getWasteNumber = () => `WST-${String(wastes.length + 1).padStart(5, '0')}`;

  const validate = () => {
    if (!header.locationId) { toast.error('Location is required'); return false; }
    if (!header.reason) { toast.error('Reason is required'); return false; }
    if (wasteItems.length === 0) { toast.error('Add at least one item'); return false; }
    for (const item of wasteItems) {
      if (!item.itemId) { toast.error('Select an item for all rows'); return false; }
      const qty = parseFloat(item.quantity) || 0;
      if (qty <= 0) { toast.error('Quantity must be > 0'); return false; }
      const avail = getAvail(item.itemId, header.locationId);
      if (qty > avail) {
        const name = items.find(i => i.id === item.itemId)?.name || 'item';
        toast.error(`Insufficient stock for ${name}. Available: ${avail}`); return false;
      }
    }
    return true;
  };

  const buildFinalItems = () => wasteItems.map(wi => {
    const itemDef = items.find(i => i.id === wi.itemId);
    const uomDef = uoms.find(u => u.id === itemDef?.baseUomId);
    return { id: wi.id, itemId: wi.itemId, itemCode: itemDef?.code || '', itemName: itemDef?.name || '', uomId: itemDef?.baseUomId || '', uomName: uomDef?.code || '', quantity: parseFloat(wi.quantity), unitRate: parseFloat(wi.unitRate) || 0, amount: calcAmount(wi) };
  });

  const handleSave = async (confirm) => {
    if (!validate()) return;
    const finalItems = buildFinalItems();
    const timestamp = new Date().toISOString();

    if (editId && existingWaste) {
      dispatch(updateWaste({ id: existingWaste.id, ...header, items: finalItems, total }));
      toast.success('Waste updated'); navigate('/inventory/waste'); return;
    }

    const newId = `wst-${uuidv4().substring(0, 8)}`;
    const wasteNumber = getWasteNumber();
    const newWaste = { id: newId, wasteNumber, ...header, status: 'DRAFT', items: finalItems, total, createdBy: currentUser?.id, createdAt: timestamp, updatedAt: timestamp };

    dispatch(createWaste(newWaste));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'WASTE_CREATED', entityType: 'WASTE', entityId: newId, description: `Created Waste ${wasteNumber}`, createdAt: timestamp }));

    if (confirm) {
      try {
        await dispatch(confirmWaste({ waste: newWaste, currentUser })).unwrap();
        toast.success(`Waste ${wasteNumber} confirmed`);
      } catch (err) {
        toast.error(err?.message || err || 'Unable to confirm waste');
        navigate('/inventory/waste');
        return;
      }
    } else { toast.success('Draft saved'); }
    navigate('/inventory/waste');
  };

  return (
    <div className="space-y-6">
      <PageHeader title={editId ? `Edit Waste ${existingWaste?.wasteNumber || ''}` : 'Record Waste'} breadcrumbs="Inventory / Waste / New"
        actions={<>
          <Button variant="outline" onClick={() => navigate('/inventory/waste')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)}><Save className="w-4 h-4 mr-2" />Save Draft</Button>
          <Button onClick={() => handleSave(true)}><CheckCircle className="w-4 h-4 mr-2" />Confirm Waste</Button>
        </>} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Waste Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Location *" value={header.locationId} onChange={e => setHeader({ ...header, locationId: e.target.value })}
                  options={[{ value: '', label: 'Select location...' }, ...activeLocations.map(l => ({ value: l.id, label: l.name }))]} />
                <Select label="Reason *" value={header.reason} onChange={e => setHeader({ ...header, reason: e.target.value })} options={WASTE_REASONS} />
                <Input type="date" label="Waste Date *" value={header.wasteDate} onChange={e => setHeader({ ...header, wasteDate: e.target.value })} />
              </div>
              <div className="mt-4">
                <Input label="Notes" value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} placeholder="Optional notes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Waste Items</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAdd}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
            </CardHeader>
            <CardContent>
              {/* Mobile */}
              <div className="md:hidden space-y-4">
                {wasteItems.map((wi, idx) => {
                  const avail = getAvail(wi.itemId, header.locationId);
                  return (
                    <div key={wi.id} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary uppercase">Item {idx + 1}</span>
                        <button onClick={() => handleRemove(wi.id)} className="p-1.5 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div><label className="text-xs text-text-muted block mb-1">Item *</label>
                        <Select label="Item" hideLabel value={wi.itemId} onChange={e => handleChange(wi.id, 'itemId', e.target.value)}
                          options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} /></div>
                      {wi.itemId && <p className="text-xs text-text-muted">Available: <span className={avail <= 0 ? 'text-red-500 font-bold' : 'text-green-600 font-medium'}>{avail}</span></p>}
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-text-muted block mb-1">Quantity *</label>
                          <Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={wi.quantity} onChange={e => handleChange(wi.id, 'quantity', e.target.value)} /></div>
                        <div><label className="text-xs text-text-muted block mb-1">Rate (₹)</label>
                          <Input label="Rate" hideLabel type="number" min="0" step="0.01" value={wi.unitRate} onChange={e => handleChange(wi.id, 'unitRate', e.target.value)} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Table.Th>Item *</Table.Th>
                    <Table.Th>Available</Table.Th>
                    <Table.Th>Quantity *</Table.Th>
                    <Table.Th>Rate (₹)</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th align="right"></Table.Th>
                  </tr></thead>
                  <tbody>
                    {wasteItems.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-text-muted">Add items to record as waste</td></tr> :
                      wasteItems.map(wi => {
                        const avail = getAvail(wi.itemId, header.locationId);
                        return (
                          <tr key={wi.id}>
                            <Table.Td className="min-w-[200px]">
                              <Select label="Item" hideLabel value={wi.itemId} onChange={e => handleChange(wi.id, 'itemId', e.target.value)}
                                options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} />
                            </Table.Td>
                            <Table.Td><span className={wi.itemId ? (avail <= 0 ? 'text-red-500 font-bold' : 'text-green-600') : 'text-text-muted'}>{wi.itemId ? avail : '—'}</span></Table.Td>
                            <Table.Td className="min-w-[120px]"><Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={wi.quantity} onChange={e => handleChange(wi.id, 'quantity', e.target.value)} /></Table.Td>
                            <Table.Td className="min-w-[120px]"><Input label="Rate" hideLabel type="number" min="0" step="0.01" value={wi.unitRate} onChange={e => handleChange(wi.id, 'unitRate', e.target.value)} /></Table.Td>
                            <Table.Td className="font-medium">{formatCurrency(calcAmount(wi))}</Table.Td>
                            <Table.Td align="right"><button onClick={() => handleRemove(wi.id)} className="p-2 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button></Table.Td>
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
                <div className="flex justify-between"><span className="text-text-muted">Total Items</span><span className="font-medium">{wasteItems.length}</span></div>
                <div className="pt-3 border-t border-border flex justify-between">
                  <span className="font-bold">Total Value</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
