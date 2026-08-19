import React, { useState } from 'react';
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
import { addStockCount, updateStockCount } from '../../features/inventory/stockCountSlice';
import { confirmStockCount } from '../../features/inventory/inventoryThunks';
import { logAction } from '../../features/audit/auditSlice';
import { formatCurrency } from '../../utils/currency';
import { Save, Plus, Trash2, CheckCircle, RefreshCw, ClipboardList } from 'lucide-react';
import { Modal, ModalFooter } from '../../components/ui/Modal';

// A variance beyond this % of system qty is considered "significant" and
// prompts a warning before confirmation (UI-level safeguard only).
const SIGNIFICANT_VARIANCE_THRESHOLD_PCT = 20;

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
    notes: existingCount?.notes || '',
  });

  const [countItems, setCountItems] = useState(existingCount?.items || []);
  // Confirmation modal — may carry variance warning details
  const [confirmModal, setConfirmModal] = useState(false);
  const [variantWarnings, setVariantWarnings] = useState([]);

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  /** Get system (current) stock qty for an item at a location. Read-only source of truth. */
  const getSystemQty = (itemId, locationId) => {
    if (!itemId || !locationId) return 0;
    return currentStock
      .filter(s => s.itemId === itemId && s.locationId === locationId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  /** Build a count row from an item definition + current stock. */
  const buildRow = (itemDef, locationId, overridePhysical = null) => {
    const uomDef = uoms.find(u => u.id === itemDef.baseUomId);
    const sysQty = getSystemQty(itemDef.id, locationId);
    const physQty = overridePhysical !== null ? overridePhysical : sysQty;
    const variance = physQty - sysQty;
    const rate = itemDef.currentRate || 0;
    return {
      id: `sci-${uuidv4()}`,
      itemId: itemDef.id,
      itemCode: itemDef.code || '',
      itemName: itemDef.name || '',
      uomId: itemDef.baseUomId || '',
      uomName: uomDef?.code || '',
      unitRate: rate,
      systemQuantity: sysQty,
      physicalQuantity: physQty,
      varianceQuantity: variance,
      varianceValue: variance * rate,
    };
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Location change — refresh system quantities, clear rows for new count
  // ────────────────────────────────────────────────────────────────────────────

  const handleLocationChange = (val) => {
    setHeader(prev => ({ ...prev, locationId: val }));
    if (!editId) {
      // Clear items on location change so system quantities reflect the new location
      setCountItems([]);
    } else {
      // For edit: refresh system quantities but preserve physical entries
      setCountItems(prev => prev.map(row => {
        const itemDef = items.find(i => i.id === row.itemId);
        if (!itemDef) return row;
        const sysQty = getSystemQty(row.itemId, val);
        const phys = parseFloat(row.physicalQuantity) || 0;
        const variance = phys - sysQty;
        const rate = itemDef.currentRate || 0;
        return { ...row, systemQuantity: sysQty, varianceQuantity: variance, varianceValue: variance * rate };
      }));
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Load System Quantities (formerly "Populate Expected Stock")
  // ────────────────────────────────────────────────────────────────────────────

  const loadSystemQuantities = () => {
    if (!header.locationId) {
      toast.error('Please select a location first.');
      return;
    }
    const locationStock = currentStock.filter(s => s.locationId === header.locationId && s.quantity > 0);
    if (locationStock.length === 0) {
      toast.error('No stock found for the selected location.');
      return;
    }
    const existingItemIds = new Set(countItems.map(i => i.itemId));
    const newRows = locationStock
      .map(ls => {
        const itemDef = items.find(i => i.id === ls.itemId);
        if (!itemDef || existingItemIds.has(itemDef.id)) return null;
        return buildRow(itemDef, header.locationId);
      })
      .filter(Boolean);

    setCountItems(prev => [...prev, ...newRows]);
    if (newRows.length > 0) {
      toast.success(`Loaded ${newRows.length} item${newRows.length > 1 ? 's' : ''} from system stock.`);
    } else {
      toast.info('All items already added to this count.');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Add individual item
  // ────────────────────────────────────────────────────────────────────────────

  const handleAddItem = (itemId) => {
    if (!itemId) return;
    if (countItems.find(i => i.itemId === itemId)) {
      toast.error('This item is already in the count.');
      return;
    }
    const itemDef = items.find(i => i.id === itemId);
    if (!itemDef) return;
    // Physical qty defaults to empty string so user must enter a real count
    const row = buildRow(itemDef, header.locationId, '');
    setCountItems(prev => [...prev, row]);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Physical Qty edit — recalculate variance + variance value instantly
  // ────────────────────────────────────────────────────────────────────────────

  const handleUpdatePhysicalQty = (id, rawVal) => {
    // Allow empty string while typing; prevent negatives from numeric input
    if (rawVal !== '' && parseFloat(rawVal) < 0) return;
    setCountItems(prev => prev.map(row => {
      if (row.id !== id) return row;
      const phys = rawVal === '' ? '' : parseFloat(rawVal);
      const physNum = typeof phys === 'number' ? phys : 0;
      const variance = row.systemQuantity !== undefined ? physNum - row.systemQuantity : 0;
      const rate = parseFloat(row.unitRate) || 0;
      return {
        ...row,
        physicalQuantity: rawVal === '' ? '' : phys,
        varianceQuantity: rawVal === '' ? null : variance,
        varianceValue: rawVal === '' ? null : variance * rate,
      };
    }));
  };

  const handleRemoveItem = (id) => setCountItems(prev => prev.filter(i => i.id !== id));

  // ────────────────────────────────────────────────────────────────────────────
  // Variance display helpers
  // ────────────────────────────────────────────────────────────────────────────

  const varianceClass = (v) => {
    if (v === null || v === undefined || v === '') return 'text-text-muted';
    if (v < 0) return 'text-status-danger font-semibold';
    if (v > 0) return 'text-green-600 font-semibold';
    return 'text-text-muted';
  };

  const formatVariance = (v, uomName = '') => {
    if (v === null || v === undefined || v === '') return '—';
    const sign = v > 0 ? '+' : '';
    const suffix = uomName ? ` ${uomName}` : '';
    return `${sign}${v}${suffix}`;
  };

  const formatVarianceValue = (v) => {
    if (v === null || v === undefined || v === '') return '—';
    const rate = /* already computed */ v;
    if (rate === 0) return <span className="text-text-muted">—</span>;
    const cls = rate < 0 ? 'text-status-danger font-semibold' : rate > 0 ? 'text-green-600 font-semibold' : 'text-text-muted';
    return <span className={cls}>{formatCurrency(rate)}</span>;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Summary values (live, safe)
  // ────────────────────────────────────────────────────────────────────────────

  const itemsWithVariance = countItems.filter(i => i.varianceQuantity !== null && i.varianceQuantity !== 0).length;
  const totalVarianceValue = countItems.reduce((sum, i) => {
    const v = parseFloat(i.varianceValue) || 0;
    return sum + v;
  }, 0);

  // ────────────────────────────────────────────────────────────────────────────
  // Validate before save / confirm
  // ────────────────────────────────────────────────────────────────────────────

  const validate = () => {
    if (!header.locationId) { toast.error('Please select a location.'); return false; }
    if (!header.countDate) { toast.error('Count Date is required.'); return false; }
    if (countItems.length === 0) { toast.error('Please add at least one item to count.'); return false; }
    for (const item of countItems) {
      if (item.physicalQuantity === '' || item.physicalQuantity === null || item.physicalQuantity === undefined) {
        toast.error(`Please enter the physical quantity for ${item.itemName}.`);
        return false;
      }
      const phys = parseFloat(item.physicalQuantity);
      if (isNaN(phys) || phys < 0) {
        toast.error(`Physical quantity for ${item.itemName} cannot be negative.`);
        return false;
      }
    }
    return true;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Confirm button — checks for significant variance, shows warning modal
  // ────────────────────────────────────────────────────────────────────────────

  const handleConfirmClick = () => {
    if (!validate()) return;

    // Check for significant variances (UI-level safeguard only)
    const warnings = countItems
      .filter(item => {
        const v = item.varianceQuantity;
        if (!v || v === 0) return false;
        const sys = item.systemQuantity || 0;
        if (sys === 0) return Math.abs(v) > 0;
        return (Math.abs(v) / sys) * 100 >= SIGNIFICANT_VARIANCE_THRESHOLD_PCT;
      })
      .map(item => ({
        name: item.itemName,
        uom: item.uomName,
        sys: item.systemQuantity,
        phys: item.physicalQuantity,
        variance: item.varianceQuantity,
        varianceValue: item.varianceValue,
        rate: item.unitRate,
      }));

    setVariantWarnings(warnings);
    setConfirmModal(true);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Save / Confirm
  // ────────────────────────────────────────────────────────────────────────────

  const handleSave = async (isConfirming = false) => {
    const countNumber = existingCount?.countNumber
      || `SC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const finalItems = countItems.map(item => ({
      ...item,
      physicalQuantity: parseFloat(item.physicalQuantity) || 0,
      varianceQuantity: parseFloat(item.varianceQuantity) || 0,
      varianceValue: parseFloat(item.varianceValue) || 0,
    }));

    const payload = {
      id: existingCount?.id || `sc-${uuidv4()}`,
      countNumber,
      ...header,
      items: finalItems,
      status: 'DRAFT',
      createdBy: existingCount?.createdBy || currentUser.id,
      createdAt: existingCount?.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (existingCount) {
      dispatch(updateStockCount(payload));
    } else {
      dispatch(addStockCount(payload));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser.id, action: 'STOCK_COUNT_CREATED',
        entityType: 'STOCK_COUNT', entityId: payload.id,
        description: `Created Draft Stock Count ${countNumber}`, createdAt: timestamp,
      }));
    }

    if (isConfirming) {
      try {
        await dispatch(confirmStockCount({ stockCount: payload, currentUser })).unwrap();
        toast.success(`Stock Count ${countNumber} confirmed`);
        navigate('/inventory/stock-counts');
      } catch (err) {
        toast.error(err?.message || err || 'Unable to confirm stock count');
        setConfirmModal(false);
      }
    } else {
      toast.success('Stock Count saved as draft');
      navigate('/inventory/stock-counts');
    }
  };

  const activeLocations = locations.filter(l => l.status === 'ACTIVE');
  const activeItems = items.filter(i => i.status === 'ACTIVE');
  // Items not already in the count list
  const addableItems = activeItems.filter(i => !countItems.find(ci => ci.itemId === i.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={existingCount ? `Edit Draft: ${existingCount.countNumber}` : 'New Stock Count'}
        breadcrumbs="Inventory / Stock Counts / New"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/inventory/stock-counts')}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => { if (validate()) handleSave(false); }}>
              <Save className="w-4 h-4 mr-2" />Save Draft
            </Button>
            <Button onClick={handleConfirmClick}>
              <CheckCircle className="w-4 h-4 mr-2" />Confirm Count
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: Count Items ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Count Items</CardTitle>
              <div className="flex gap-2 flex-wrap">
                {header.locationId && (
                  <Button variant="outline" size="sm" onClick={loadSystemQuantities}>
                    <RefreshCw className="w-4 h-4 mr-1" />Load System Quantities
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Add individual item selector */}
              <div className="mb-5">
                <Select
                  label="Add Item"
                  value=""
                  onChange={e => handleAddItem(e.target.value)}
                  options={[
                    { value: '', label: header.locationId ? 'Select an item to add...' : 'Select a location first' },
                    ...addableItems.map(i => ({ value: i.id, label: `${i.code} — ${i.name}` })),
                  ]}
                  disabled={!header.locationId}
                />
                {!header.locationId && (
                  <p className="text-xs text-text-muted mt-1">
                    Select a location in Count Details to begin.
                  </p>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>System Qty</Table.Th>
                      <Table.Th>Physical Qty *</Table.Th>
                      <Table.Th>Variance</Table.Th>
                      <Table.Th>Variance Value</Table.Th>
                      <Table.Th align="right"></Table.Th>
                    </tr>
                  </thead>
                  <tbody>
                    {countItems.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ClipboardList className="w-10 h-10 text-text-muted mb-3 opacity-40" />
                            <p className="font-semibold text-text-main">No items added yet</p>
                            <p className="text-sm text-text-muted mt-1">
                              Use <span className="font-medium">"Load System Quantities"</span> to populate all items,
                              or select an item above to add individually.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      countItems.map(item => {
                        const hasPhys = item.physicalQuantity !== '' && item.physicalQuantity !== null && item.physicalQuantity !== undefined;
                        const vqty = hasPhys ? item.varianceQuantity : null;
                        const vval = hasPhys ? item.varianceValue : null;
                        const rate = parseFloat(item.unitRate) || 0;
                        return (
                          <tr key={item.id}>
                            <Table.Td className="min-w-[160px]">
                              <div className="font-medium text-text-main">{item.itemName}</div>
                              <div className="text-xs text-text-muted">{item.itemCode}</div>
                            </Table.Td>
                            {/* System Qty — read-only */}
                            <Table.Td>
                              <span className="font-medium tabular-nums">
                                {item.systemQuantity}
                                {item.uomName && <span className="text-xs text-text-muted ml-1">{item.uomName}</span>}
                              </span>
                            </Table.Td>
                            {/* Physical Qty — user-entered */}
                            <Table.Td className="min-w-[110px]">
                              <Input
                                hideLabel
                                label="Physical Qty"
                                type="number"
                                value={item.physicalQuantity}
                                onChange={e => handleUpdatePhysicalQty(item.id, e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="Enter qty"
                              />
                            </Table.Td>
                            {/* Variance — auto-calculated, read-only */}
                            <Table.Td>
                              {hasPhys ? (
                                <span className={varianceClass(vqty)}>
                                  {formatVariance(vqty, item.uomName)}
                                </span>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </Table.Td>
                            {/* Variance Value — derived from item rate */}
                            <Table.Td>
                              {hasPhys && rate > 0 ? (
                                <span className={varianceClass(vval)}>
                                  {vval === 0 ? <span className="text-text-muted">—</span> : formatCurrency(vval)}
                                </span>
                              ) : (
                                <span className="text-text-muted">
                                  {hasPhys && rate === 0 ? <span className="italic text-xs">No rate</span> : '—'}
                                </span>
                              )}
                            </Table.Td>
                            <Table.Td align="right">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-2 text-text-muted hover:text-status-danger transition-colors"
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

              {/* Mobile card layout */}
              <div className="md:hidden space-y-3 mt-2">
                {countItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ClipboardList className="w-8 h-8 text-text-muted mb-2 opacity-40" />
                    <p className="font-semibold text-text-main text-sm">No items added yet</p>
                    <p className="text-xs text-text-muted mt-1">Load system quantities or add items above.</p>
                  </div>
                ) : (
                  countItems.map((item, idx) => {
                    const hasPhys = item.physicalQuantity !== '' && item.physicalQuantity !== null;
                    const vqty = hasPhys ? item.varianceQuantity : null;
                    const vval = hasPhys ? item.varianceValue : null;
                    const rate = parseFloat(item.unitRate) || 0;
                    return (
                      <div key={item.id} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-primary uppercase">Item {idx + 1}</span>
                          <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-text-muted hover:text-status-danger">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <p className="font-medium text-text-main">{item.itemName}</p>
                          <p className="text-xs text-text-muted">{item.itemCode}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-text-muted mb-1">System Qty</p>
                            <p className="font-medium tabular-nums">{item.systemQuantity} {item.uomName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Physical Qty *</p>
                            <Input
                              hideLabel label="Physical Qty"
                              type="number" min="0" step="0.01"
                              value={item.physicalQuantity}
                              onChange={e => handleUpdatePhysicalQty(item.id, e.target.value)}
                              placeholder="Enter qty"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Variance</p>
                            {hasPhys
                              ? <p className={varianceClass(vqty)}>{formatVariance(vqty, item.uomName)}</p>
                              : <p className="text-text-muted">—</p>}
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Variance Value</p>
                            {hasPhys && rate > 0
                              ? <p className={varianceClass(vval)}>{vval === 0 ? '—' : formatCurrency(vval)}</p>
                              : <p className="text-text-muted text-xs italic">{hasPhys ? 'No rate' : '—'}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Count Details + Summary ───────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Count Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Location *"
                value={header.locationId}
                onChange={e => handleLocationChange(e.target.value)}
                options={[
                  { value: '', label: 'Select location...' },
                  ...activeLocations.map(l => ({ value: l.id, label: l.name })),
                ]}
                disabled={!!existingCount}
              />
              <Input
                type="date"
                label="Count Date *"
                value={header.countDate}
                onChange={e => setHeader(prev => ({ ...prev, countDate: e.target.value }))}
              />
              <Input
                label="Notes"
                value={header.notes}
                onChange={e => setHeader(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special notes regarding this count..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Total Items Counted</span>
                <span className="font-medium">{countItems.length}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Items with Variance</span>
                <span className={`font-medium ${itemsWithVariance > 0 ? 'text-orange-600' : ''}`}>
                  {itemsWithVariance}
                </span>
              </div>
              <div className="pt-1 flex justify-between items-center">
                <span className="font-bold text-text-main">Total Variance Value</span>
                <span className={`text-lg font-bold ${totalVarianceValue < 0 ? 'text-status-danger' : totalVarianceValue > 0 ? 'text-green-600' : 'text-text-muted'}`}>
                  {totalVarianceValue !== 0 ? formatCurrency(totalVarianceValue) : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirm Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title={variantWarnings.length > 0 ? '⚠ Significant Stock Variance Detected' : 'Confirm Stock Count?'}
        description={
          variantWarnings.length === 0
            ? 'Are you sure you want to confirm this count? This action cannot be undone.'
            : 'Please review the significant variances below before confirming.'
        }
      >
        {variantWarnings.length > 0 && (
          <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
            {variantWarnings.map((w, i) => (
              <div key={i} className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
                <p className="font-bold text-orange-800">{w.name}</p>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-orange-700">
                  <span className="text-text-muted">System:</span>
                  <span className="font-medium tabular-nums">{w.sys} {w.uom}</span>
                  <span className="text-text-muted">Physical:</span>
                  <span className="font-medium tabular-nums">{w.phys} {w.uom}</span>
                  <span className="text-text-muted">Variance:</span>
                  <span className={`font-bold tabular-nums ${w.variance < 0 ? 'text-status-danger' : 'text-green-700'}`}>
                    {w.variance > 0 ? `+${w.variance}` : w.variance} {w.uom}
                  </span>
                  {w.rate > 0 && (
                    <>
                      <span className="text-text-muted">Variance Value:</span>
                      <span className={`font-bold tabular-nums ${w.varianceValue < 0 ? 'text-status-danger' : 'text-green-700'}`}>
                        {formatCurrency(w.varianceValue)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-text-muted mt-2">
              Please verify the physical count before confirming.
            </p>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmModal(false)}>
            {variantWarnings.length > 0 ? 'Review Count' : 'Cancel'}
          </Button>
          <Button onClick={() => handleSave(true)}>Confirm Stock Count</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
