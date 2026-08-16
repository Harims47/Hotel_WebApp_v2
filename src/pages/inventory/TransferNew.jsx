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
import { createTransfer, updateTransfer } from '../../features/inventory/transferSlice';
import { confirmTransfer } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react';

export function TransferNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const prefillItemId = searchParams.get('itemId');
  const prefillLocationId = searchParams.get('locationId');
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';
  useEffect(() => { if (isGM) { toast.error('No permission'); navigate('/inventory/transfers'); } }, [isGM, navigate]);

  const items = useSelector(state => state.invItems.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const transfers = useSelector(state => state.invTransfers.data) || [];

  const existingTransfer = editId ? transfers.find(t => t.id === editId && t.status === 'DRAFT') : null;
  useEffect(() => { if (editId && !existingTransfer) { toast.error('Not editable'); navigate('/inventory/transfers'); } }, [editId, existingTransfer, navigate]);

  const activeItems = items.filter(i => i.status === 'ACTIVE');
  const activeLocations = locations.filter(l => l.status === 'ACTIVE');

  const [header, setHeader] = useState({
    fromLocationId: existingTransfer?.fromLocationId || prefillLocationId || '',
    toLocationId: existingTransfer?.toLocationId || '',
    transferDate: existingTransfer?.transferDate || new Date().toISOString().split('T')[0],
    notes: existingTransfer?.notes || ''
  });

  const [transferItems, setTransferItems] = useState(() => {
    if (existingTransfer) return existingTransfer.items.map(i => ({ id: i.id, itemId: i.itemId, quantity: i.quantity, unitRate: i.unitRate }));
    if (prefillItemId) return [{ id: uuidv4(), itemId: prefillItemId, quantity: 1, unitRate: 0 }];
    return [{ id: uuidv4(), itemId: '', quantity: 1, unitRate: 0 }];
  });

  const getAvail = (itemId, locationId) => {
    if (!itemId || !locationId) return 0;
    return stock.filter(s => s.itemId === itemId && s.locationId === locationId).reduce((s, r) => s + r.quantity, 0);
  };

  const handleAdd = () => setTransferItems([...transferItems, { id: uuidv4(), itemId: '', quantity: 1, unitRate: 0 }]);
  const handleRemove = id => setTransferItems(transferItems.filter(i => i.id !== id));
  const handleChange = (id, field, value) => setTransferItems(transferItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  const calcAmount = item => (parseFloat(item.quantity) || 0) * (parseFloat(item.unitRate) || 0);
  const total = transferItems.reduce((s, i) => s + calcAmount(i), 0);
  const getTransferNumber = () => `TRF-${String(transfers.length + 1).padStart(5, '0')}`;

  const validate = () => {
    if (!header.fromLocationId) { toast.error('Source Location is required'); return false; }
    if (!header.toLocationId) { toast.error('Destination Location is required'); return false; }
    if (header.fromLocationId === header.toLocationId) { toast.error('Source and Destination must be different'); return false; }
    if (transferItems.length === 0) { toast.error('Add at least one item'); return false; }
    for (const item of transferItems) {
      if (!item.itemId) { toast.error('Select an item for all rows'); return false; }
      const qty = parseFloat(item.quantity) || 0;
      if (qty <= 0) { toast.error('Quantity must be > 0'); return false; }
      const avail = getAvail(item.itemId, header.fromLocationId);
      if (qty > avail) {
        const name = items.find(i => i.id === item.itemId)?.name || 'item';
        toast.error(`Insufficient stock for ${name}. Available: ${avail}`); return false;
      }
    }
    return true;
  };

  const buildFinalItems = () => transferItems.map(ti => {
    const itemDef = items.find(i => i.id === ti.itemId);
    const uomDef = uoms.find(u => u.id === itemDef?.baseUomId);
    return { id: ti.id, itemId: ti.itemId, itemCode: itemDef?.code || '', itemName: itemDef?.name || '', uomId: itemDef?.baseUomId || '', uomName: uomDef?.code || '', quantity: parseFloat(ti.quantity), unitRate: parseFloat(ti.unitRate) || 0, amount: calcAmount(ti) };
  });

  const handleSave = (confirm) => {
    if (!validate()) return;
    const finalItems = buildFinalItems();
    const timestamp = new Date().toISOString();

    if (editId && existingTransfer) {
      dispatch(updateTransfer({ id: existingTransfer.id, ...header, items: finalItems, total }));
      toast.success('Transfer updated'); navigate('/inventory/transfers'); return;
    }

    const newId = `trf-${uuidv4().substring(0, 8)}`;
    const transferNumber = getTransferNumber();
    const newTransfer = { id: newId, transferNumber, ...header, status: 'DRAFT', items: finalItems, total, createdBy: currentUser?.id, createdAt: timestamp, updatedAt: timestamp };

    dispatch(createTransfer(newTransfer));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'TRANSFER_CREATED', entityType: 'TRANSFER', entityId: newId, description: `Created Transfer ${transferNumber}`, createdAt: timestamp }));

    if (confirm) {
      try { dispatch(confirmTransfer(newTransfer, currentUser)); toast.success(`Transfer ${transferNumber} confirmed`); }
      catch (err) { toast.error(err.message); navigate('/inventory/transfers'); return; }
    } else { toast.success('Draft saved'); }
    navigate('/inventory/transfers');
  };

  return (
    <div className="space-y-6">
      <PageHeader title={editId ? `Edit Transfer ${existingTransfer?.transferNumber || ''}` : 'New Transfer'} breadcrumbs="Inventory / Transfers / New"
        actions={<>
          <Button variant="outline" onClick={() => navigate('/inventory/transfers')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)}><Save className="w-4 h-4 mr-2" />Save Draft</Button>
          <Button onClick={() => handleSave(true)}><CheckCircle className="w-4 h-4 mr-2" />Confirm Transfer</Button>
        </>} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Transfer Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select label="From Location *" value={header.fromLocationId} onChange={e => setHeader({ ...header, fromLocationId: e.target.value })} options={[{ value: '', label: 'Select source...' }, ...activeLocations.map(l => ({ value: l.id, label: l.name }))]} />
                <Select label="To Location *" value={header.toLocationId} onChange={e => setHeader({ ...header, toLocationId: e.target.value })} options={[{ value: '', label: 'Select destination...' }, ...activeLocations.map(l => ({ value: l.id, label: l.name }))]} />
                <Input type="date" label="Transfer Date *" value={header.transferDate} onChange={e => setHeader({ ...header, transferDate: e.target.value })} />
              </div>
              <div className="mt-4"><Input label="Notes" value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} placeholder="Optional notes" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Transfer Items</CardTitle><Button size="sm" variant="outline" onClick={handleAdd}><Plus className="w-4 h-4 mr-1" />Add Item</Button></CardHeader>
            <CardContent>
              {/* Mobile */}
              <div className="md:hidden space-y-4">
                {transferItems.map((ti, idx) => {
                  const avail = getAvail(ti.itemId, header.fromLocationId);
                  return (
                    <div key={ti.id} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex justify-between items-center"><span className="text-xs font-bold text-primary uppercase">Item {idx + 1}</span><button onClick={() => handleRemove(ti.id)} className="p-1.5 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button></div>
                      <div><label className="text-xs text-text-muted block mb-1">Item *</label><Select label="Item" hideLabel value={ti.itemId} onChange={e => handleChange(ti.id, 'itemId', e.target.value)} options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} /></div>
                      {ti.itemId && <p className="text-xs text-text-muted">Available: <span className={avail <= 0 ? 'text-red-500 font-bold' : 'text-green-600 font-medium'}>{avail}</span></p>}
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-text-muted block mb-1">Quantity *</label><Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={ti.quantity} onChange={e => handleChange(ti.id, 'quantity', e.target.value)} /></div>
                        <div><label className="text-xs text-text-muted block mb-1">Rate (₹)</label><Input label="Rate" hideLabel type="number" min="0" step="0.01" value={ti.unitRate} onChange={e => handleChange(ti.id, 'unitRate', e.target.value)} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <thead><tr><Table.Th>Item *</Table.Th><Table.Th>Available at Source</Table.Th><Table.Th>Quantity *</Table.Th><Table.Th>Rate (₹)</Table.Th><Table.Th>Amount</Table.Th><Table.Th align="right"></Table.Th></tr></thead>
                  <tbody>
                    {transferItems.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-text-muted">Add items to transfer</td></tr> :
                      transferItems.map(ti => {
                        const avail = getAvail(ti.itemId, header.fromLocationId);
                        return (
                          <tr key={ti.id}>
                            <Table.Td className="min-w-[200px]"><Select label="Item" hideLabel value={ti.itemId} onChange={e => handleChange(ti.id, 'itemId', e.target.value)} options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} /></Table.Td>
                            <Table.Td><span className={ti.itemId ? (avail <= 0 ? 'text-red-500 font-bold' : 'text-green-600') : 'text-text-muted'}>{ti.itemId ? avail : '—'}</span></Table.Td>
                            <Table.Td className="min-w-[120px]"><Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={ti.quantity} onChange={e => handleChange(ti.id, 'quantity', e.target.value)} /></Table.Td>
                            <Table.Td className="min-w-[120px]"><Input label="Rate" hideLabel type="number" min="0" step="0.01" value={ti.unitRate} onChange={e => handleChange(ti.id, 'unitRate', e.target.value)} /></Table.Td>
                            <Table.Td className="font-medium">{formatCurrency(calcAmount(ti))}</Table.Td>
                            <Table.Td align="right"><button onClick={() => handleRemove(ti.id)} className="p-2 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button></Table.Td>
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
                <div className="flex justify-between"><span className="text-text-muted">Total Items</span><span className="font-medium">{transferItems.length}</span></div>
                <div className="pt-3 border-t border-border flex justify-between"><span className="font-bold">Total Value</span><span className="text-xl font-bold text-primary">{formatCurrency(total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
