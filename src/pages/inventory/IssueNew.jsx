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
import { createIssue, updateIssue } from '../../features/inventory/issueSlice';
import { confirmStockIssue } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react';

export function IssueNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const prefillItemId = searchParams.get('itemId');
  const prefillLocationId = searchParams.get('locationId');
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';

  useEffect(() => {
    if (isGM) { toast.error('No permission'); navigate('/inventory/issues'); }
  }, [isGM, navigate]);

  const items = useSelector(state => state.invItems.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const issues = useSelector(state => state.invIssues.data) || [];

  const existingIssue = editId ? issues.find(i => i.id === editId && i.status === 'DRAFT') : null;

  useEffect(() => {
    if (editId && !existingIssue) { toast.error('Issue not editable'); navigate('/inventory/issues'); }
  }, [editId, existingIssue, navigate]);

  const activeItems = items.filter(i => i.status === 'ACTIVE');
  const activeLocations = locations.filter(l => l.status === 'ACTIVE');

  const [header, setHeader] = useState({
    fromLocationId: existingIssue?.fromLocationId || prefillLocationId || '',
    toLocationId: existingIssue?.toLocationId || '',
    department: existingIssue?.department || '',
    issueDate: existingIssue?.issueDate || new Date().toISOString().split('T')[0],
    notes: existingIssue?.notes || ''
  });

  const [issueItems, setIssueItems] = useState(() => {
    if (existingIssue) {
      return existingIssue.items.map(i => ({ id: i.id, itemId: i.itemId, quantity: i.quantity, unitRate: i.unitRate }));
    }
    if (prefillItemId) {
      return [{ id: uuidv4(), itemId: prefillItemId, quantity: 1, unitRate: 0 }];
    }
    return [{ id: uuidv4(), itemId: '', quantity: 1, unitRate: 0 }];
  });

  const getAvailableStock = (itemId, locationId) => {
    if (!itemId || !locationId) return 0;
    return stock.filter(s => s.itemId === itemId && s.locationId === locationId).reduce((sum, s) => sum + s.quantity, 0);
  };

  const handleAdd = () => setIssueItems([...issueItems, { id: uuidv4(), itemId: '', quantity: 1, unitRate: 0 }]);
  const handleRemove = id => setIssueItems(issueItems.filter(i => i.id !== id));
  const handleChange = (id, field, value) => setIssueItems(issueItems.map(i => i.id === id ? { ...i, [field]: value } : i));

  const calcAmount = item => (parseFloat(item.quantity) || 0) * (parseFloat(item.unitRate) || 0);
  const total = issueItems.reduce((s, i) => s + calcAmount(i), 0);

  const getIssueNumber = () => `ISS-${String(issues.length + 1).padStart(5, '0')}`;

  const validate = () => {
    if (!header.fromLocationId) { toast.error('Source Location is required'); return false; }
    if (issueItems.length === 0) { toast.error('Add at least one item'); return false; }
    for (const item of issueItems) {
      if (!item.itemId) { toast.error('Select an item for all rows'); return false; }
      const qty = parseFloat(item.quantity) || 0;
      if (qty <= 0) { toast.error('Quantity must be > 0'); return false; }
      const avail = getAvailableStock(item.itemId, header.fromLocationId);
      if (qty > avail) {
        const itemName = items.find(i => i.id === item.itemId)?.name || 'item';
        toast.error(`Insufficient stock for ${itemName}. Available: ${avail}`);
        return false;
      }
    }
    return true;
  };

  const buildFinalItems = () => issueItems.map(ii => {
    const itemDef = items.find(i => i.id === ii.itemId);
    const uomDef = uoms.find(u => u.id === itemDef?.baseUomId);
    return {
      id: ii.id, itemId: ii.itemId,
      itemCode: itemDef?.code || '', itemName: itemDef?.name || '',
      uomId: itemDef?.baseUomId || '', uomName: uomDef?.code || '',
      quantity: parseFloat(ii.quantity), unitRate: parseFloat(ii.unitRate) || 0,
      amount: calcAmount(ii)
    };
  });

  const handleSave = (confirm) => {
    if (!validate()) return;
    const finalItems = buildFinalItems();
    const timestamp = new Date().toISOString();

    if (editId && existingIssue) {
      const updated = { id: existingIssue.id, ...header, items: finalItems, total };
      dispatch(updateIssue(updated));
      toast.success('Issue updated');
      navigate('/inventory/issues');
      return;
    }

    const newId = `iss-${uuidv4().substring(0, 8)}`;
    const issueNumber = getIssueNumber();
    const newIssue = {
      id: newId, issueNumber, ...header, status: 'DRAFT',
      items: finalItems, total,
      createdBy: currentUser?.id, createdAt: timestamp, updatedAt: timestamp
    };

    dispatch(createIssue(newIssue));
    dispatch(logAction({ id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'STOCK_ISSUE_CREATED', entityType: 'STOCK_ISSUE', entityId: newId, description: `Created Issue ${issueNumber}`, createdAt: timestamp }));

    if (confirm) {
      try {
        dispatch(confirmStockIssue(newIssue, currentUser));
        toast.success(`Issue ${issueNumber} confirmed`);
      } catch (err) {
        toast.error(err.message);
        navigate('/inventory/issues');
        return;
      }
    } else {
      toast.success('Draft saved');
    }
    navigate('/inventory/issues');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={editId ? `Edit Issue ${existingIssue?.issueNumber || ''}` : 'New Stock Issue'}
        breadcrumbs="Inventory / Issues / New"
        actions={<>
          <Button variant="outline" onClick={() => navigate('/inventory/issues')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)}>
            <Save className="w-4 h-4 mr-2" />Save Draft
          </Button>
          <Button onClick={() => handleSave(true)}>
            <CheckCircle className="w-4 h-4 mr-2" />Confirm Issue
          </Button>
        </>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Issue Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Source Location *" value={header.fromLocationId} onChange={e => setHeader({ ...header, fromLocationId: e.target.value })}
                  options={[{ value: '', label: 'Select source location...' }, ...activeLocations.map(l => ({ value: l.id, label: l.name }))]} />
                <Select label="Destination Location" value={header.toLocationId} onChange={e => setHeader({ ...header, toLocationId: e.target.value })}
                  options={[{ value: '', label: 'Optional — select if transferring to a location' }, ...activeLocations.map(l => ({ value: l.id, label: l.name }))]} />
                <Input label="Department / Issued To" value={header.department} onChange={e => setHeader({ ...header, department: e.target.value })} placeholder="e.g. Kitchen, Bar, Events" />
                <Input type="date" label="Issue Date *" value={header.issueDate} onChange={e => setHeader({ ...header, issueDate: e.target.value })} />
              </div>
              <div className="mt-4">
                <Input label="Notes" value={header.notes} onChange={e => setHeader({ ...header, notes: e.target.value })} placeholder="Optional notes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issue Items</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAdd}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
            </CardHeader>
            <CardContent>
              {/* Mobile card layout */}
              <div className="md:hidden space-y-4">
                {issueItems.map((ii, idx) => {
                  const itemDef = activeItems.find(i => i.id === ii.itemId);
                  const avail = getAvailableStock(ii.itemId, header.fromLocationId);
                  return (
                    <div key={ii.id} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary uppercase">Item {idx + 1}</span>
                        <button onClick={() => handleRemove(ii.id)} className="p-1.5 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">Item *</label>
                        <Select label="Item" hideLabel value={ii.itemId} onChange={e => handleChange(ii.id, 'itemId', e.target.value)}
                          options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} />
                      </div>
                      {ii.itemId && <p className="text-xs text-text-muted">Available: <span className={avail <= 0 ? 'text-red-500 font-bold' : 'text-green-600 font-medium'}>{avail}</span></p>}
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-text-muted block mb-1">Quantity *</label>
                          <Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={ii.quantity} onChange={e => handleChange(ii.id, 'quantity', e.target.value)} /></div>
                        <div><label className="text-xs text-text-muted block mb-1">Rate (₹)</label>
                          <Input label="Rate" hideLabel type="number" min="0" step="0.01" value={ii.unitRate} onChange={e => handleChange(ii.id, 'unitRate', e.target.value)} /></div>
                      </div>
                      <div className="flex justify-end text-sm font-medium">{formatCurrency(calcAmount(ii))}</div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Table.Th>Item *</Table.Th>
                    <Table.Th>Available Stock</Table.Th>
                    <Table.Th>Quantity *</Table.Th>
                    <Table.Th>Rate (₹)</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th align="right"></Table.Th>
                  </tr></thead>
                  <tbody>
                    {issueItems.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-text-muted">Add items to issue</td></tr> :
                      issueItems.map(ii => {
                        const avail = getAvailableStock(ii.itemId, header.fromLocationId);
                        return (
                          <tr key={ii.id}>
                            <Table.Td className="min-w-[200px]">
                              <Select label="Item" hideLabel value={ii.itemId} onChange={e => handleChange(ii.id, 'itemId', e.target.value)}
                                options={[{ value: '', label: 'Select item...' }, ...activeItems.map(i => ({ value: i.id, label: i.name }))]} />
                            </Table.Td>
                            <Table.Td>
                              <span className={ii.itemId ? (avail <= 0 ? 'text-red-500 font-bold' : 'text-green-600 font-medium') : 'text-text-muted'}>
                                {ii.itemId ? avail : '—'}
                              </span>
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={ii.quantity} onChange={e => handleChange(ii.id, 'quantity', e.target.value)} />
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Rate" hideLabel type="number" min="0" step="0.01" value={ii.unitRate} onChange={e => handleChange(ii.id, 'unitRate', e.target.value)} />
                            </Table.Td>
                            <Table.Td className="font-medium">{formatCurrency(calcAmount(ii))}</Table.Td>
                            <Table.Td align="right">
                              <button onClick={() => handleRemove(ii.id)} className="p-2 text-text-muted hover:text-status-danger"><Trash2 className="w-4 h-4" /></button>
                            </Table.Td>
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
                <div className="flex justify-between"><span className="text-text-muted">Total Items</span><span className="font-medium">{issueItems.length}</span></div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-bold text-text-main">Total Value</span>
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
