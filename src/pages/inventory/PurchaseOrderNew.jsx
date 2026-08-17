import React, { useState, useEffect, useRef } from 'react';
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
import { createPO, updatePOFull } from '../../features/inventory/purchaseOrdersSlice';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Trash2, Plus, Save, Send } from 'lucide-react';

export function PurchaseOrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId'); // Present when editing a draft
  const dispatch = useDispatch();
  
  const { currentUser } = useSelector(state => state.auth);
  const isGM = currentUser?.role === 'GM';
  
  useEffect(() => {
    if (isGM) {
      toast.error('You do not have permission to create Purchase Orders');
      navigate('/inventory/purchase-orders');
    }
  }, [isGM, navigate]);

  const items = useSelector(state => state.invItems.data) || [];
  const suppliers = useSelector(state => state.invSuppliers.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const stock = useSelector(state => state.invStock.data) || [];
  const pos = useSelector(state => state.purchaseOrders.data) || [];

  const activeItems = items.filter(i => i.status === 'ACTIVE');
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE');

  // Load existing draft if editing
  const existingPO = editId ? pos.find(p => p.id === editId && p.status === 'DRAFT') : null;

  const [poData, setPoData] = useState({
    supplierId: existingPO?.supplierId || '',
    orderDate: existingPO?.orderDate || new Date().toISOString().split('T')[0],
    expectedDeliveryDate: existingPO?.expectedDeliveryDate || '',
    notes: existingPO?.notes || ''
  });

  const [poItems, setPoItems] = useState(() => {
    if (existingPO) {
      return existingPO.items.map(pi => ({
        id: pi.id,
        itemId: pi.itemId,
        quantity: pi.quantity,
        unitRate: pi.unitRate,
      }));
    }
    return [];
  });

  // Redirect if editing a non-draft PO
  useEffect(() => {
    if (editId && !existingPO) {
      toast.error('That Purchase Order cannot be edited.');
      navigate('/inventory/purchase-orders');
    }
  }, [editId, existingPO, navigate]);

  // Check if we arrived from Low Stock with a prefilled item.
  // Guarded by a ref so it applies exactly once, even though `items`/`activeSuppliers`
  // are recreated every render (window.history.replaceState does not clear
  // React Router's in-memory location.state, so this effect would otherwise
  // re-fire — and re-add the item — on every subsequent re-render).
  const prefillAppliedRef = useRef(false);
  const prefilledItemId = location.state?.prefilledItem;
  useEffect(() => {
    if (!editId && prefilledItemId && !prefillAppliedRef.current) {
      prefillAppliedRef.current = true;
      const item = items.find(i => i.id === prefilledItemId);
      if (item && item.status === 'ACTIVE') {
        if (item.preferredSupplierId) {
          const supplier = activeSuppliers.find(s => s.id === item.preferredSupplierId);
          if (supplier) {
            setPoData(prev => ({ ...prev, supplierId: supplier.id }));
          }
        }
        handleAddEmptyItem(item.id);
      }
      window.history.replaceState({}, document.title);
    }
  }, [prefilledItemId, editId]);

  const handleAddEmptyItem = (prefillItemId = '') => {
    setPoItems(prev => [...prev, {
      id: uuidv4(),
      itemId: prefillItemId,
      quantity: 1,
      unitRate: 0
    }]);
  };

  const handleRemoveItem = (id) => {
    setPoItems(poItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setPoItems(poItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateItemAmount = (item) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unitRate) || 0);
  };

  const subtotal = poItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const total = subtotal;

  const validatePO = () => {
    if (!poData.supplierId) {
      toast.error('Please select a supplier');
      return false;
    }
    if (poItems.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }
    for (const item of poItems) {
      if (!item.itemId) {
        toast.error('Please select an item for all rows');
        return false;
      }
      if (item.quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return false;
      }
      if (item.unitRate < 0) {
        toast.error('Rate cannot be negative');
        return false;
      }
    }
    return true;
  };

  const getNewPoNumber = () => {
    const count = pos.length + 1;
    return `PO-${String(count).padStart(5, '0')}`;
  };

  const handleSave = (status) => {
    if (!validatePO()) return;

    const finalizedItems = poItems.map(pi => {
      const itemDef = items.find(i => i.id === pi.itemId);
      const uomDef = uoms.find(u => u.id === itemDef.purchaseUomId);
      return {
        id: pi.id,
        itemId: pi.itemId,
        itemCodeSnapshot: itemDef.code,
        itemNameSnapshot: itemDef.name,
        uomId: itemDef.purchaseUomId,
        uomNameSnapshot: uomDef?.name || '',
        quantity: parseFloat(pi.quantity),
        unitRate: parseFloat(pi.unitRate),
        amount: calculateItemAmount(pi),
        receivedQuantity: existingPO ? (existingPO.items.find(ei => ei.id === pi.id)?.receivedQuantity || 0) : 0,
        pendingQuantity: parseFloat(pi.quantity),
      };
    });

    if (editId && existingPO) {
      // Editing a draft
      const updatedPO = {
        id: existingPO.id,
        supplierId: poData.supplierId,
        orderDate: poData.orderDate,
        expectedDeliveryDate: poData.expectedDeliveryDate,
        notes: poData.notes,
        status: status,
        items: finalizedItems,
        subtotal,
        total,
      };
      dispatch(updatePOFull(updatedPO));
      dispatch(logAction({
        id: `log-${uuidv4()}`,
        userId: currentUser?.id,
        action: status === 'SENT' ? 'PO_SENT' : 'PO_UPDATED',
        entityType: 'PURCHASE_ORDER',
        entityId: existingPO.id,
        description: `${status === 'SENT' ? 'Sent' : 'Edited draft'} Purchase Order ${existingPO.poNumber}`,
        createdAt: new Date().toISOString()
      }));
      toast.success(status === 'SENT' ? 'Purchase Order Sent' : 'Draft Updated');
    } else {
      // Creating a new PO
      const newPoId = `po-${uuidv4().substring(0, 8)}`;
      const poNumber = getNewPoNumber();

      const newPO = {
        id: newPoId,
        poNumber,
        supplierId: poData.supplierId,
        orderDate: poData.orderDate,
        expectedDeliveryDate: poData.expectedDeliveryDate,
        status: status,
        items: finalizedItems,
        subtotal,
        discount: 0,
        tax: 0,
        total,
        notes: poData.notes,
        createdBy: currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dispatch(createPO(newPO));
      dispatch(logAction({
        id: `log-${uuidv4()}`,
        userId: currentUser?.id,
        action: status === 'SENT' ? 'PO_SENT' : 'PO_CREATED',
        entityType: 'PURCHASE_ORDER',
        entityId: newPoId,
        description: `${status === 'SENT' ? 'Sent' : 'Created draft'} Purchase Order ${poNumber}`,
        createdAt: new Date().toISOString()
      }));
      toast.success(status === 'SENT' ? 'Purchase Order Sent' : 'Draft Saved');
    }

    navigate('/inventory/purchase-orders');
  };

  const pageTitle = editId ? `Edit Draft PO ${existingPO?.poNumber || ''}` : 'Create Purchase Order';

  return (
    <div className="space-y-6">
      <PageHeader 
        title={pageTitle}
        breadcrumbs={`Inventory / Purchase Orders / ${editId ? 'Edit' : 'New'}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/inventory/purchase-orders')}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSave('DRAFT')}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave('SENT')}>
              <Send className="w-4 h-4 mr-2" />
              Send PO
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Supplier"
                  value={poData.supplierId}
                  onChange={e => setPoData({...poData, supplierId: e.target.value})}
                  options={[
                    { value: '', label: 'Select a supplier...' },
                    ...activeSuppliers.map(s => ({ value: s.id, label: s.name }))
                  ]}
                />
                <Input type="date"
                  label="Order Date"
                  value={poData.orderDate}
                  onChange={e => setPoData({...poData, orderDate: e.target.value})}
                />
                <Input type="date"
                  label="Expected Delivery Date"
                  value={poData.expectedDeliveryDate}
                  onChange={e => setPoData({...poData, expectedDeliveryDate: e.target.value})}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Notes" 
                  value={poData.notes} 
                  onChange={e => setPoData({...poData, notes: e.target.value})} 
                  placeholder="Additional instructions..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleAddEmptyItem()}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>Stock Info</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Rate (₹)</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th align="right"></Table.Th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-text-muted text-sm">
                          No items added yet. Click "Add Item" to begin.
                        </td>
                      </tr>
                    ) : (
                      poItems.map((pi) => {
                        const selectedItem = activeItems.find(i => i.id === pi.itemId);
                        let stockInfo = '-';
                        let uomLabel = '';
                        if (selectedItem) {
                          const itemStockRecords = stock.filter(s => s.itemId === selectedItem.id);
                          const totalStock = itemStockRecords.reduce((sum, record) => sum + record.quantity, 0);
                          const purchaseUom = uoms.find(u => u.id === selectedItem.purchaseUomId);
                          uomLabel = purchaseUom ? purchaseUom.code : '';
                          stockInfo = (
                            <div className="text-xs">
                              <div>Curr: <span className={totalStock <= selectedItem.reorderLevel ? 'text-red-500 font-bold' : ''}>{totalStock}</span></div>
                              <div className="text-text-muted">Reorder: {selectedItem.reorderLevel}</div>
                            </div>
                          );
                        }

                        return (
                          <tr key={pi.id}>
                            <Table.Td className="min-w-[200px]">
                              <Select label="Item" hideLabel value={pi.itemId}
                                onChange={e => handleItemChange(pi.id, 'itemId', e.target.value)}
                                options={[
                                  { value: '', label: 'Select Item...' },
                                  ...activeItems.map(i => ({ value: i.id, label: i.name }))
                                ]}
                              />
                            </Table.Td>
                            <Table.Td>{stockInfo}</Table.Td>
                            <Table.Td className="min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <Input label="Quantity" hideLabel type="number" 
                                  min="0.1" 
                                  step="0.1" 
                                  value={pi.quantity}
                                  onChange={e => handleItemChange(pi.id, 'quantity', e.target.value)}
                                  className="w-24"
                                />
                                <span className="text-xs text-text-muted">{uomLabel}</span>
                              </div>
                            </Table.Td>
                            <Table.Td className="min-w-[120px]">
                              <Input label="Rate" hideLabel type="number" 
                                min="0" 
                                step="0.01" 
                                value={pi.unitRate}
                                onChange={e => handleItemChange(pi.id, 'unitRate', e.target.value)}
                                className="w-24"
                              />
                            </Table.Td>
                            <Table.Td className="font-medium min-w-[100px]">
                              {formatCurrency(calculateItemAmount(pi))}
                            </Table.Td>
                            <Table.Td align="right">
                              <button 
                                onClick={() => handleRemoveItem(pi.id)}
                                className="p-2 text-text-muted hover:text-status-danger transition-colors rounded-lg hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Table.Td>
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
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">PO Number</span>
                    <span className="font-medium text-text-main">{existingPO?.poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Total Items</span>
                  <span className="font-medium text-text-main">{poItems.length}</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-base font-bold text-text-main">Grand Total</span>
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
