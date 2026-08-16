import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { createGRN } from '../../features/inventory/grnSlice';
import { confirmGRN } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react';

export function GRNNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poIdParam = searchParams.get('poId');
  const dispatch = useDispatch();
  
  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';
  
  useEffect(() => {
    if (isGM) {
      toast.error('You do not have permission to create GRNs');
      navigate('/inventory/grn');
    }
  }, [isGM, navigate]);

  const items = useSelector(state => state.invItems.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const purchaseOrders = useSelector(state => state.purchaseOrders.data) || [];
  const grns = useSelector(state => state.grn.data) || [];

  const activeItems = items.filter(i => i.status === 'ACTIVE');
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE');
  const activeLocations = locations.filter(l => l.status === 'ACTIVE');

  const [isDirectPurchase, setIsDirectPurchase] = useState(!poIdParam);
  
  const [grnData, setGrnData] = useState({
    poId: poIdParam || '',
    supplierId: '',
    supplierInvoiceNumber: '',
    grnDate: new Date().toISOString().split('T')[0],
    locationId: '',
    notes: ''
  });

  const [grnItems, setGrnItems] = useState([]);

  // Auto-fill from PO
  useEffect(() => {
    if (poIdParam) {
      const po = purchaseOrders.find(p => p.id === poIdParam);
      if (po && (po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED')) {
        setGrnData(prev => ({ ...prev, poId: po.id, supplierId: po.supplierId }));
        
        // Map PO items to GRN items, only if there's pending quantity
        const newItems = po.items
          .filter(pi => pi.pendingQuantity > 0)
          .map(pi => ({
            id: uuidv4(),
            itemId: pi.itemId,
            orderedQuantity: pi.quantity,
            previouslyReceivedQuantity: pi.receivedQuantity || 0,
            pendingQuantity: pi.pendingQuantity,
            currentReceivedQuantity: pi.pendingQuantity, // default to receiving all pending
            acceptedQuantity: pi.pendingQuantity,
            rejectedQuantity: 0,
            unitRate: pi.unitRate,
            rejectionReason: '',
            isFromPO: true
          }));
        setGrnItems(newItems);
      } else {
        toast.error('Invalid or ineligible Purchase Order');
        navigate('/inventory/grn');
      }
    }
  }, [poIdParam, purchaseOrders, navigate]);

  const handleAddDirectItem = () => {
    setGrnItems([...grnItems, {
      id: uuidv4(),
      itemId: '',
      orderedQuantity: 0,
      previouslyReceivedQuantity: 0,
      pendingQuantity: 0,
      currentReceivedQuantity: 1,
      acceptedQuantity: 1,
      rejectedQuantity: 0,
      unitRate: 0,
      rejectionReason: '',
      isFromPO: false
    }]);
  };

  const handleRemoveItem = (id) => {
    setGrnItems(grnItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setGrnItems(grnItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Auto-calculate accepted/rejected rules
        if (field === 'currentReceivedQuantity') {
          const r = parseFloat(value) || 0;
          updated.acceptedQuantity = r; // reset accepted
          updated.rejectedQuantity = 0;
        } else if (field === 'acceptedQuantity') {
          const a = parseFloat(value) || 0;
          const r = parseFloat(updated.currentReceivedQuantity) || 0;
          updated.rejectedQuantity = Math.max(0, r - a);
        } else if (field === 'rejectedQuantity') {
          const rej = parseFloat(value) || 0;
          const r = parseFloat(updated.currentReceivedQuantity) || 0;
          updated.acceptedQuantity = Math.max(0, r - rej);
        }
        
        return updated;
      }
      return item;
    }));
  };

  const calculateItemAmount = (item) => {
    return (parseFloat(item.acceptedQuantity) || 0) * (parseFloat(item.unitRate) || 0);
  };

  const subtotal = grnItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);

  const validateGRN = () => {
    if (!grnData.supplierId) {
      toast.error('Please select a supplier'); return false;
    }
    if (!grnData.locationId) {
      toast.error('Please select a receiving location'); return false;
    }
    if (grnItems.length === 0) {
      toast.error('Please add at least one item'); return false;
    }

    for (const item of grnItems) {
      if (!item.itemId) {
        toast.error('Please select an item for all rows'); return false;
      }
      
      const r = parseFloat(item.currentReceivedQuantity) || 0;
      const a = parseFloat(item.acceptedQuantity) || 0;
      const rej = parseFloat(item.rejectedQuantity) || 0;
      
      if (r <= 0) {
        toast.error('Received quantity must be greater than 0'); return false;
      }
      if (a < 0 || rej < 0) {
        toast.error('Accepted and Rejected quantities cannot be negative'); return false;
      }
      if (Math.abs(r - (a + rej)) > 0.001) { // floating point tolerance
        toast.error('Accepted + Rejected must equal Received quantity'); return false;
      }
      if (item.isFromPO && r > item.pendingQuantity) {
        toast.error(`Cannot receive more than pending quantity for item`); return false;
      }
      if (rej > 0 && !item.rejectionReason?.trim()) {
        toast.error('Rejection reason is required when rejected quantity > 0'); return false;
      }
    }
    return true;
  };

  const getNewGrnNumber = () => {
    const count = grns.length + 1;
    return `GRN-${String(count).padStart(5, '0')}`;
  };

  const handleSave = (status) => {
    if (!validateGRN()) return;

    const newGrnId = `grn-${uuidv4().substring(0, 8)}`;
    const grnNumber = getNewGrnNumber();
    const timestamp = new Date().toISOString();
    
    const supplier = suppliers.find(s => s.id === grnData.supplierId);

    const finalizedItems = grnItems.map(gi => {
      const itemDef = items.find(i => i.id === gi.itemId);
      const uomDef = uoms.find(u => u.id === itemDef.purchaseUomId);
      return {
        id: gi.id,
        itemId: gi.itemId,
        itemCode: itemDef.code,
        itemName: itemDef.name,
        uomId: itemDef.purchaseUomId,
        uomName: uomDef?.name || '',
        orderedQuantity: parseFloat(gi.orderedQuantity),
        previouslyReceivedQuantity: parseFloat(gi.previouslyReceivedQuantity),
        currentReceivedQuantity: parseFloat(gi.currentReceivedQuantity),
        acceptedQuantity: parseFloat(gi.acceptedQuantity),
        rejectedQuantity: parseFloat(gi.rejectedQuantity),
        unitRate: parseFloat(gi.unitRate),
        amount: calculateItemAmount(gi),
        rejectionReason: gi.rejectionReason
      };
    });

    const newGRN = {
      id: newGrnId,
      grnNumber,
      poId: isDirectPurchase ? null : grnData.poId,
      supplierId: grnData.supplierId,
      supplierSnapshot: supplier?.name || '',
      grnDate: grnData.grnDate,
      supplierInvoiceNumber: grnData.supplierInvoiceNumber,
      locationId: grnData.locationId,
      status: 'DRAFT', // Always starts as DRAFT in the slice, confirmGRN will mutate it if needed
      items: finalizedItems,
      notes: grnData.notes,
      createdBy: currentUser?.id,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    dispatch(createGRN(newGRN));

    if (status === 'CONFIRMED') {
      // Execute the atomic confirmation thunk
      dispatch(confirmGRN(newGRN, currentUser));
    } else {
      // Just a DRAFT
      dispatch(logAction({
        id: `log-${uuidv4()}`,
        userId: currentUser?.id,
        action: 'GRN_CREATED',
        entityType: 'GRN',
        entityId: newGrnId,
        description: `Created Draft GRN ${grnNumber}`,
        createdAt: timestamp
      }));
      toast.success('Draft Saved');
    }

    navigate('/inventory/grn');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isDirectPurchase ? "Direct Purchase (GRN)" : "Receive Purchase Order (GRN)"}
        breadcrumbs="Inventory / GRN / New"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/inventory/grn')}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSave('DRAFT')}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave('CONFIRMED')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm GRN
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>General Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isDirectPurchase && (
                  <Input label="Input" hideLabel 
                    label="Purchase Order" 
                    value={purchaseOrders.find(p => p.id === grnData.poId)?.poNumber || ''} 
                    disabled 
                  />
                )}
                <Select label="Select" hideLabel 
                  label="Supplier" 
                  value={grnData.supplierId} 
                  onChange={e => setGrnData({...grnData, supplierId: e.target.value})}
                  disabled={!isDirectPurchase} // Locked if from PO
                  options={[
                    { value: '', label: 'Select Supplier...' },
                    ...activeSuppliers.map(s => ({ value: s.id, label: s.name }))
                  ]}
                />
                <Select label="Location" hideLabel 
                  label="Receiving Location" 
                  value={grnData.locationId} 
                  onChange={e => setGrnData({...grnData, locationId: e.target.value})}
                  options={[
                    { value: '', label: 'Select Location...' },
                    ...activeLocations.map(l => ({ value: l.id, label: l.name }))
                  ]}
                />
                <Input label="Input" hideLabel type="date" 
                  label="GRN Date" 
                  value={grnData.grnDate} 
                  onChange={e => setGrnData({...grnData, grnDate: e.target.value})} 
                />
                <Input label="Input" hideLabel 
                  label="Supplier Invoice No." 
                  value={grnData.supplierInvoiceNumber} 
                  onChange={e => setGrnData({...grnData, supplierInvoiceNumber: e.target.value})} 
                  placeholder="Optional"
                />
              </div>
              <div className="mt-4">
                <Input label="Input" hideLabel 
                  label="Notes" 
                  value={grnData.notes} 
                  onChange={e => setGrnData({...grnData, notes: e.target.value})} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Received Items</CardTitle>
              {isDirectPurchase && (
                <Button size="sm" variant="outline" onClick={handleAddDirectItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* MOBILE: Card layout per item */}
              <div className="md:hidden space-y-4">
                {grnItems.length === 0 ? (
                  <p className="text-center py-8 text-text-muted text-sm">No items added.</p>
                ) : (
                  grnItems.map((gi, idx) => {
                    const itemDef = activeItems.find(i => i.id === gi.itemId);
                    const purchaseUom = uoms.find(u => u.id === itemDef?.purchaseUomId);
                    const uomLabel = purchaseUom ? purchaseUom.code : '';
                    return (
                      <div key={gi.id} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Item {idx + 1}</span>
                          {isDirectPurchase && (
                            <button onClick={() => handleRemoveItem(gi.id)} className="p-1.5 text-text-muted hover:text-status-danger">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {gi.isFromPO ? (
                          <div>
                            <div className="font-bold text-text-main">{itemDef?.name}</div>
                            <div className="text-xs text-text-muted mt-0.5">Pending: {gi.pendingQuantity} {uomLabel}</div>
                          </div>
                        ) : (
                          <Select label="Item" hideLabel value={gi.itemId}
                            onChange={e => handleItemChange(gi.id, 'itemId', e.target.value)}
                            options={[
                              { value: '', label: 'Select Item...' },
                              ...activeItems.map(i => ({ value: i.id, label: i.name }))
                            ]}
                          />
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-text-muted block mb-1">Received</label>
                            <Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={gi.currentReceivedQuantity} onChange={e => handleItemChange(gi.id, 'currentReceivedQuantity', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-green-600 font-medium block mb-1">Accepted</label>
                            <Input label="Quantity" hideLabel type="number" min="0" step="0.1" value={gi.acceptedQuantity} onChange={e => handleItemChange(gi.id, 'acceptedQuantity', e.target.value)} className="border-green-300" />
                          </div>
                          <div>
                            <label className="text-xs text-status-danger font-medium block mb-1">Rejected</label>
                            <Input label="Quantity" hideLabel type="number" min="0" step="0.1" value={gi.rejectedQuantity} onChange={e => handleItemChange(gi.id, 'rejectedQuantity', e.target.value)} className="border-red-300" />
                          </div>
                        </div>
                        {parseFloat(gi.rejectedQuantity) > 0 && (
                          <Select label="Select" hideLabel value={gi.rejectionReason}
                            onChange={e => handleItemChange(gi.id, 'rejectionReason', e.target.value)}
                            options={[
                              { value: '', label: 'Select reason...' },
                              { value: 'Damaged', label: 'Damaged' },
                              { value: 'Poor Quality', label: 'Poor Quality' },
                              { value: 'Expired', label: 'Expired' },
                              { value: 'Wrong Item', label: 'Wrong Item' },
                              { value: 'Other', label: 'Other' }
                            ]}
                          />
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-border">
                          <div className="w-1/2">
                            <label className="text-xs text-text-muted block mb-1">Rate (₹)</label>
                            <Input label="Rate" hideLabel type="number" min="0" step="0.01" value={gi.unitRate} onChange={e => handleItemChange(gi.id, 'unitRate', e.target.value)} />
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-text-muted">Amount</div>
                            <div className="font-bold text-text-main">{formatCurrency(calculateItemAmount(gi))}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP/TABLET: Table layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>Received (Total)</Table.Th>
                      <Table.Th>Accepted</Table.Th>
                      <Table.Th>Rejected</Table.Th>
                      <Table.Th>Rejection Reason</Table.Th>
                      <Table.Th>Rate</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      {isDirectPurchase && <Table.Th align="right"></Table.Th>}
                    </tr>
                  </thead>
                  <tbody>
                    {grnItems.length === 0 ? (
                      <tr>
                        <td colSpan={isDirectPurchase ? 8 : 7} className="text-center py-8 text-text-muted">
                          No items added.
                        </td>
                      </tr>
                    ) : (
                      grnItems.map((gi) => {
                        const itemDef = activeItems.find(i => i.id === gi.itemId);
                        const purchaseUom = uoms.find(u => u.id === itemDef?.purchaseUomId);
                        const uomLabel = purchaseUom ? purchaseUom.code : '';
                        
                        return (
                          <tr key={gi.id}>
                            <Table.Td className="min-w-[200px]">
                              {gi.isFromPO ? (
                                <div>
                                  <div className="font-bold">{itemDef?.name}</div>
                                  <div className="text-xs text-text-muted">Pending: {gi.pendingQuantity} {uomLabel}</div>
                                </div>
                              ) : (
                                <Select label="Item" hideLabel value={gi.itemId}
                                  onChange={e => handleItemChange(gi.id, 'itemId', e.target.value)}
                                  options={[
                                    { value: '', label: 'Select Item...' },
                                    ...activeItems.map(i => ({ value: i.id, label: i.name }))
                                  ]}
                                />
                              )}
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Quantity" hideLabel type="number" min="0.1" step="0.1" value={gi.currentReceivedQuantity} onChange={e => handleItemChange(gi.id, 'currentReceivedQuantity', e.target.value)} />
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Quantity" hideLabel type="number" min="0" step="0.1" value={gi.acceptedQuantity} onChange={e => handleItemChange(gi.id, 'acceptedQuantity', e.target.value)} className="border-green-300 focus:border-green-500" />
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Quantity" hideLabel type="number" min="0" step="0.1" value={gi.rejectedQuantity} onChange={e => handleItemChange(gi.id, 'rejectedQuantity', e.target.value)} className="border-red-300 focus:border-red-500" />
                            </Table.Td>
                            <Table.Td className="min-w-[150px]">
                              <Select label="Select" hideLabel value={gi.rejectionReason}
                                onChange={e => handleItemChange(gi.id, 'rejectionReason', e.target.value)}
                                disabled={parseFloat(gi.rejectedQuantity) <= 0}
                                options={[
                                  { value: '', label: 'None' },
                                  { value: 'Damaged', label: 'Damaged' },
                                  { value: 'Poor Quality', label: 'Poor Quality' },
                                  { value: 'Expired', label: 'Expired' },
                                  { value: 'Wrong Item', label: 'Wrong Item' },
                                  { value: 'Other', label: 'Other' }
                                ]}
                              />
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Rate" hideLabel type="number" min="0" step="0.01" value={gi.unitRate} onChange={e => handleItemChange(gi.id, 'unitRate', e.target.value)} />
                            </Table.Td>
                            <Table.Td className="font-medium min-w-[100px]">
                              {formatCurrency(calculateItemAmount(gi))}
                            </Table.Td>
                            {isDirectPurchase && (
                              <Table.Td align="right">
                                <button onClick={() => handleRemoveItem(gi.id)} className="p-2 text-text-muted hover:text-status-danger">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </Table.Td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1">
          <Card className="sticky top-6">
            <CardHeader><CardTitle>Receiving Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Total Items</span>
                  <span className="font-medium">{grnItems.length}</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-base font-bold text-text-main">Accepted Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
