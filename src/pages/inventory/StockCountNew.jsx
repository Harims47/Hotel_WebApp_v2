import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { QuantitySelector } from '../../components/ui/QuantitySelector';
import { addStockCount, updateStockCount } from '../../features/inventory/stockCountSlice';
import { confirmStockCount } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Save, Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

export function StockCountNew() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  const { currentUser } = useSelector(state => state.auth);
  const locations = useSelector(state => state.invLocations.data) || [];
  const items = useSelector(state => state.invItems.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const currentStock = useSelector(state => state.invStock.data) || [];
  const stockCounts = useSelector(state => state.invStockCounts.data) || [];

  const existingCount = editId ? stockCounts.find(sc => sc.id === editId) : null;

  const [header, setHeader] = useState({
    locationId: existingCount?.locationId || '',
    countDate: existingCount?.countDate || new Date().toISOString().split('T')[0],
    notes: existingCount?.notes || ''
  });

  const [countItems, setCountItems] = useState(existingCount?.items || []);
  const [confirmModal, setConfirmModal] = useState(false);

  // When location changes, we can offer to auto-populate items for that location
  // But for now, we'll let user add items manually or provide a "Populate All Items" button

  const handleLocationChange = (val) => {
    setHeader({ ...header, locationId: val });
    if (!editId) {
      setCountItems([]); // Clear items if location changes on a new count
    }
  };

  const populateAllLocationItems = () => {
    if (!header.locationId) {
      toast.error('Select a location first');
      return;
    }
    
    // Find all items that have non-zero stock at this location
    const locationStock = currentStock.filter(s => s.locationId === header.locationId && s.quantity > 0);
    
    const newItems = locationStock.map(ls => {
      const itemDef = items.find(i => i.id === ls.itemId);
      if (!itemDef) return null;
      const uomDef = uoms.find(u => u.id === itemDef.baseUomId);
      return {
        id: `sci-${uuidv4()}`,
        itemId: itemDef.id,
        itemCode: itemDef.code,
        itemName: itemDef.name,
        uomId: itemDef.baseUomId || '',
        uomName: uomDef?.code || '',
        unitRate: itemDef.currentRate || 0,
        systemQuantity: ls.quantity,
        physicalQuantity: ls.quantity, // Default to system qty
        varianceQuantity: 0,
        varianceValue: 0
      };
    }).filter(Boolean);

    // Merge without duplicates
    const existingItemIds = countItems.map(i => i.itemId);
    const itemsToAdd = newItems.filter(ni => !existingItemIds.includes(ni.itemId));
    
    setCountItems([...countItems, ...itemsToAdd]);
    toast.success(`Added ${itemsToAdd.length} items to count.`);
  };

  const handleAddItem = (itemId) => {
    if (!itemId) return;
    if (countItems.find(i => i.itemId === itemId)) {
      toast.error('Item already added to count');
      return;
    }

    const itemDef = items.find(i => i.id === itemId);
    if (!itemDef) return;

    // Find system quantity for this location
    const stockRecord = currentStock.find(s => s.itemId === itemId && s.locationId === header.locationId);
    const sysQty = stockRecord ? stockRecord.quantity : 0;

    const uomDef = uoms.find(u => u.id === itemDef.baseUomId);
    const newItem = {
      id: `sci-${uuidv4()}`,
      itemId: itemDef.id,
      itemCode: itemDef.code,
      itemName: itemDef.name,
      uomId: itemDef.baseUomId || '',
      uomName: uomDef?.code || '',
      unitRate: itemDef.currentRate || 0,
      systemQuantity: sysQty,
      physicalQuantity: sysQty, // Default to system qty
      varianceQuantity: 0,
      varianceValue: 0
    };

    setCountItems([...countItems, newItem]);
  };

  const handleUpdatePhysicalQty = (id, newQty) => {
    const qty = parseFloat(newQty) || 0;
    if (qty < 0) return; // Physical qty cannot be negative

    setCountItems(countItems.map(item => {
      if (item.id === id) {
        const varianceQty = qty - item.systemQuantity;
        return {
          ...item,
          physicalQuantity: qty,
          varianceQuantity: varianceQty,
          varianceValue: varianceQty * item.unitRate
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id) => {
    setCountItems(countItems.filter(i => i.id !== id));
  };

  const handleSave = (isConfirming = false) => {
    if (!header.locationId) {
      toast.error('Please select a location');
      return;
    }
    if (countItems.length === 0) {
      toast.error('Please add at least one item to count');
      return;
    }

    const countNumber = existingCount?.countNumber || `SC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const payload = {
      id: existingCount?.id || `sc-${uuidv4()}`,
      countNumber,
      ...header,
      items: countItems,
      status: 'DRAFT',
      createdBy: existingCount?.createdBy || currentUser.id,
      createdAt: existingCount?.createdAt || timestamp,
      updatedAt: timestamp
    };

    if (existingCount) {
      dispatch(updateStockCount(payload));
    } else {
      dispatch(addStockCount(payload));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser.id, action: 'STOCK_COUNT_CREATED',
        entityType: 'STOCK_COUNT', entityId: payload.id,
        description: `Created Draft Stock Count ${countNumber}`, createdAt: timestamp
      }));
    }

    if (isConfirming) {
      try {
        dispatch(confirmStockCount(payload, currentUser));
        toast.success(`Stock Count ${countNumber} confirmed`);
        navigate('/inventory/stock-counts');
      } catch (err) {
        toast.error(err.message);
        setConfirmModal(false);
      }
    } else {
      toast.success('Stock Count saved as draft');
      navigate('/inventory/stock-counts');
    }
  };

  const totalVarianceValue = countItems.reduce((sum, i) => sum + (i.varianceValue || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={existingCount ? `Edit Draft: ${existingCount.countNumber}` : 'New Stock Count'}
        breadcrumbs="Inventory / Stock Counts / New"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/inventory/stock-counts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => setConfirmModal(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Count
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Count Items</CardTitle>
              {header.locationId && (
                <Button variant="outline" size="sm" onClick={populateAllLocationItems}>
                  <Plus className="w-4 h-4 mr-2" /> Populate Expected Stock
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-4 max-w-md">
                <Select
                  label="Add Item"
                  value=""
                  onChange={(e) => handleAddItem(e.target.value)}
                  options={[
                    { value: '', label: 'Select an item to add...' },
                    ...items.map(i => ({ value: i.id, label: `${i.code} - ${i.name}` }))
                  ]}
                  disabled={!header.locationId}
                />
                {!header.locationId && <p className="text-xs text-text-muted mt-1">Select a location first.</p>}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>System Qty</Table.Th>
                      <Table.Th>Physical Qty</Table.Th>
                      <Table.Th>Variance</Table.Th>
                      <Table.Th>Var. Value</Table.Th>
                      <Table.Th></Table.Th>
                    </tr>
                  </thead>
                  <tbody>
                    {countItems.length === 0 ? (
                      <tr>
                        <Table.Td colSpan={6} className="text-center py-4 text-text-muted">
                          No items added yet.
                        </Table.Td>
                      </tr>
                    ) : (
                      countItems.map((item) => (
                        <tr key={item.id}>
                          <Table.Td>
                            <div className="font-medium text-text-main">{item.itemName}</div>
                            <div className="text-xs text-text-muted">{item.itemCode}</div>
                          </Table.Td>
                          <Table.Td>{item.systemQuantity} {item.uomName}</Table.Td>
                          <Table.Td>
                            <Input hideLabel type="number"
                              value={item.physicalQuantity}
                              onChange={(e) => handleUpdatePhysicalQty(item.id, e.target.value)}
                              min="0"
                              step="0.01"
                              className="w-24"
                              label="Physical Qty"
                            />
                          </Table.Td>
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
                          <Table.Td className="text-right">
                            <Button variant="ghost" size="sm" className="text-status-danger" onClick={() => handleRemoveItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Table.Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Count Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Location"
                value={header.locationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                options={[
                  { value: '', label: 'Select location...' },
                  ...locations.map(l => ({ value: l.id, label: l.name }))
                ]}
                disabled={!!existingCount}
                required
              />
              <Input type="date"
                label="Count Date"
                value={header.countDate}
                onChange={(e) => setHeader({ ...header, countDate: e.target.value })}
                required
              />
              <Input type="textarea"
                label="Notes"
                value={header.notes}
                onChange={(e) => setHeader({ ...header, notes: e.target.value })}
                rows={3}
                placeholder="Any special notes regarding this count..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Total Items Counted</span>
                <span className="font-medium">{countItems.length}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Items with Variance</span>
                <span className="font-medium">{countItems.filter(i => i.varianceQuantity !== 0).length}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-base font-bold text-text-main">Total Variance Value</span>
                <span className={`text-lg font-bold ${totalVarianceValue < 0 ? 'text-status-danger' : totalVarianceValue > 0 ? 'text-green-600' : 'text-text-main'}`}>
                  {formatCurrency(totalVarianceValue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Confirm Stock Count?"
        description="Are you sure you want to confirm this count? Adjustments will be automatically created for any items with a variance. This action cannot be undone."
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(false)}>Cancel</Button>
          <Button onClick={() => handleSave(true)}>Confirm Stock Count</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
