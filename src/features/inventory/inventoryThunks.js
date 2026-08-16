import { v4 as uuidv4 } from 'uuid';
import { confirmGRNState } from './grnSlice';
import { confirmIssueState } from './issueSlice';
import { confirmWasteState } from './wasteSlice';
import { confirmTransferState } from './transferSlice';
import { confirmAdjustmentState, createAdjustment } from './adjustmentSlice';
import { updateStockCountStatus } from './stockCountSlice';
import { invStockActions, invItemsActions } from './inventorySlices';
import { updatePO } from './purchaseOrdersSlice';
import { addMultipleLedgerEntries } from './stockLedgerSlice';
import { logAction } from '../audit/auditSlice';
import { addNotification } from '../notifications/notificationsSlice';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a pendingStockMap from current Redux stock state.
 * Key: `${itemId}::${locationId}` → current quantity
 * This is the foundation of the B4-corrected balanceAfter calculation.
 */
function buildStockMap(currentStock) {
  const map = {};
  currentStock.forEach(record => {
    map[`${record.itemId}::${record.locationId}`] = record.quantity;
  });
  return map;
}

/**
 * Apply a stock delta to the accumulator map and determine create vs update.
 * Returns: { stockUpdates, stockCreates, balanceAfter }
 */
function applyStockDelta(pendingStockMap, currentStock, itemId, locationId, delta, timestamp) {
  const key = `${itemId}::${locationId}`;
  const prevBalance = pendingStockMap[key] ?? 0;
  const balanceAfter = prevBalance + delta;
  pendingStockMap[key] = balanceAfter;

  const existingRecord = currentStock.find(s => s.itemId === itemId && s.locationId === locationId);
  const update = existingRecord
    ? { type: 'update', payload: { id: existingRecord.id, quantity: balanceAfter, updatedAt: timestamp } }
    : { type: 'create', payload: { id: `stk-${uuidv4()}`, itemId, locationId, quantity: Math.max(0, balanceAfter), updatedAt: timestamp } };

  return { update, balanceAfter };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM GRN (Stage 3 — preserved)
// ─────────────────────────────────────────────────────────────────────────────

export const confirmGRN = (grn, currentUser) => (dispatch, getState) => {
  const state = getState();
  const currentStock = state.invStock.data || [];
  const purchaseOrders = state.purchaseOrders.data || [];
  const timestamp = new Date().toISOString();

  dispatch(confirmGRNState({ id: grn.id, confirmedAt: timestamp, confirmedBy: currentUser.id }));

  const pendingStockMap = buildStockMap(currentStock);
  const ledgerEntries = [];
  const stockUpdates = [];
  const stockCreates = [];
  let poUpdates = null;

  let po = null;
  if (grn.poId) {
    po = purchaseOrders.find(p => p.id === grn.poId);
    if (po) {
      poUpdates = { id: po.id, items: po.items.map(pi => ({ ...pi })) };
    }
  }

  grn.items.forEach(grnItem => {
    const acceptedQty = parseFloat(grnItem.acceptedQuantity || 0);
    if (acceptedQty > 0) {
      const { update, balanceAfter } = applyStockDelta(
        pendingStockMap, currentStock, grnItem.itemId, grn.locationId, acceptedQty, timestamp
      );
      if (update.type === 'update') stockUpdates.push(update.payload);
      else stockCreates.push(update.payload);

      ledgerEntries.push({
        id: `ledg-${uuidv4()}`,
        transactionType: 'STOCK_IN',
        referenceType: grn.poId ? 'GRN' : 'DIRECT_PURCHASE',
        referenceId: grn.id,
        referenceNumber: grn.grnNumber,
        itemId: grnItem.itemId,
        itemCode: grnItem.itemCode,
        itemName: grnItem.itemName,
        locationId: grn.locationId,
        uomId: grnItem.uomId,
        quantity: acceptedQty,
        rate: grnItem.unitRate,
        amount: acceptedQty * grnItem.unitRate,
        balanceAfter,
        transactionDate: timestamp,
        createdBy: currentUser.id,
        createdAt: timestamp
      });
    }

    if (poUpdates) {
      const poItem = poUpdates.items.find(pi => pi.itemId === grnItem.itemId);
      if (poItem) {
        const receivedQty = parseFloat(grnItem.currentReceivedQuantity || 0);
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + receivedQty;
        poItem.pendingQuantity = Math.max(0, poItem.quantity - poItem.receivedQuantity);
      }
    }
  });

  stockUpdates.forEach(u => dispatch(invStockActions.updateRecord(u)));
  stockCreates.forEach(c => dispatch(invStockActions.createRecord(c)));
  if (ledgerEntries.length > 0) dispatch(addMultipleLedgerEntries(ledgerEntries));

  // Update currentRate on each item with the last GRN unit rate (last-price method)
  const itemRateUpdates = {};
  grn.items.forEach(grnItem => {
    if (grnItem.unitRate && grnItem.unitRate > 0) {
      itemRateUpdates[grnItem.itemId] = grnItem.unitRate;
    }
  });
  Object.entries(itemRateUpdates).forEach(([itemId, rate]) => {
    dispatch(invItemsActions.updateRecord({ id: itemId, currentRate: rate }));
  });

  if (poUpdates) {
    const allReceived = poUpdates.items.every(pi => pi.pendingQuantity === 0);
    poUpdates.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    poUpdates.updatedAt = timestamp;
    dispatch(updatePO(poUpdates));
  }

  dispatch(logAction({
    id: `log-${uuidv4()}`, userId: currentUser.id, action: 'GRN_CONFIRMED',
    entityType: 'GRN', entityId: grn.id,
    description: `Confirmed GRN ${grn.grnNumber}`, createdAt: timestamp
  }));
  dispatch(addNotification({
    id: `notif-grn-${grn.id}`, role: 'INVENTORY_MANAGER', title: 'GRN Confirmed',
    message: `GRN ${grn.grnNumber} has been confirmed and stock updated.`,
    isRead: false, actionRequired: 'NONE', referenceId: grn.id, createdAt: timestamp
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM STOCK ISSUE
// ─────────────────────────────────────────────────────────────────────────────

export const confirmStockIssue = (issue, currentUser) => (dispatch, getState) => {
  const state = getState();
  const currentStock = state.invStock.data || [];
  const timestamp = new Date().toISOString();

  // PRE-VALIDATION: Check all items have sufficient stock before any mutation
  const pendingStockMap = buildStockMap(currentStock);
  for (const item of issue.items) {
    const key = `${item.itemId}::${issue.fromLocationId}`;
    const available = pendingStockMap[key] ?? 0;
    const qty = parseFloat(item.quantity || 0);
    if (qty <= 0) {
      throw new Error(`Quantity must be greater than 0 for item ${item.itemName}`);
    }
    if (available < qty) {
      throw new Error(`Insufficient stock for ${item.itemName}. Available: ${available}, Requested: ${qty}`);
    }
    // Pre-deduct to catch combined shortfall across multiple items
    pendingStockMap[key] = available - qty;
  }

  // VALIDATION PASSED — rebuild map fresh and apply mutations
  const freshMap = buildStockMap(currentStock);
  const ledgerEntries = [];
  const stockUpdates = [];
  const stockCreates = [];

  dispatch(confirmIssueState({ id: issue.id, confirmedAt: timestamp, confirmedBy: currentUser.id }));

  issue.items.forEach(issueItem => {
    const qty = parseFloat(issueItem.quantity || 0);
    const { update, balanceAfter } = applyStockDelta(
      freshMap, currentStock, issueItem.itemId, issue.fromLocationId, -qty, timestamp
    );
    if (update.type === 'update') stockUpdates.push(update.payload);
    else stockCreates.push(update.payload);

    ledgerEntries.push({
      id: `ledg-${uuidv4()}`,
      transactionType: 'STOCK_OUT',
      referenceType: 'ISSUE',
      referenceId: issue.id,
      referenceNumber: issue.issueNumber,
      itemId: issueItem.itemId,
      itemCode: issueItem.itemCode,
      itemName: issueItem.itemName,
      locationId: issue.fromLocationId,
      uomId: issueItem.uomId,
      quantity: -qty,
      rate: issueItem.unitRate,
      amount: qty * issueItem.unitRate,
      balanceAfter,
      transactionDate: timestamp,
      createdBy: currentUser.id,
      createdAt: timestamp
    });
  });

  stockUpdates.forEach(u => dispatch(invStockActions.updateRecord(u)));
  stockCreates.forEach(c => dispatch(invStockActions.createRecord(c)));
  if (ledgerEntries.length > 0) dispatch(addMultipleLedgerEntries(ledgerEntries));

  dispatch(logAction({
    id: `log-${uuidv4()}`, userId: currentUser.id, action: 'STOCK_ISSUE_CONFIRMED',
    entityType: 'STOCK_ISSUE', entityId: issue.id,
    description: `Confirmed Stock Issue ${issue.issueNumber}`, createdAt: timestamp
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM WASTE
// ─────────────────────────────────────────────────────────────────────────────

export const confirmWaste = (waste, currentUser) => (dispatch, getState) => {
  const state = getState();
  const currentStock = state.invStock.data || [];
  const timestamp = new Date().toISOString();

  // PRE-VALIDATION
  const pendingStockMap = buildStockMap(currentStock);
  for (const item of waste.items) {
    const key = `${item.itemId}::${waste.locationId}`;
    const available = pendingStockMap[key] ?? 0;
    const qty = parseFloat(item.quantity || 0);
    if (qty <= 0) throw new Error(`Quantity must be greater than 0 for item ${item.itemName}`);
    if (available < qty) {
      throw new Error(`Insufficient stock for ${item.itemName}. Available: ${available}, Waste qty: ${qty}`);
    }
    pendingStockMap[key] = available - qty;
  }

  // VALIDATION PASSED
  const freshMap = buildStockMap(currentStock);
  const ledgerEntries = [];
  const stockUpdates = [];
  const stockCreates = [];

  dispatch(confirmWasteState({ id: waste.id, confirmedAt: timestamp, confirmedBy: currentUser.id }));

  waste.items.forEach(wasteItem => {
    const qty = parseFloat(wasteItem.quantity || 0);
    const { update, balanceAfter } = applyStockDelta(
      freshMap, currentStock, wasteItem.itemId, waste.locationId, -qty, timestamp
    );
    if (update.type === 'update') stockUpdates.push(update.payload);
    else stockCreates.push(update.payload);

    ledgerEntries.push({
      id: `ledg-${uuidv4()}`,
      transactionType: 'WASTE',
      referenceType: 'WASTE',
      referenceId: waste.id,
      referenceNumber: waste.wasteNumber,
      itemId: wasteItem.itemId,
      itemCode: wasteItem.itemCode,
      itemName: wasteItem.itemName,
      locationId: waste.locationId,
      uomId: wasteItem.uomId,
      quantity: -qty,
      rate: wasteItem.unitRate,
      amount: qty * wasteItem.unitRate,
      balanceAfter,
      transactionDate: timestamp,
      createdBy: currentUser.id,
      createdAt: timestamp
    });
  });

  stockUpdates.forEach(u => dispatch(invStockActions.updateRecord(u)));
  stockCreates.forEach(c => dispatch(invStockActions.createRecord(c)));
  if (ledgerEntries.length > 0) dispatch(addMultipleLedgerEntries(ledgerEntries));

  dispatch(logAction({
    id: `log-${uuidv4()}`, userId: currentUser.id, action: 'WASTE_CONFIRMED',
    entityType: 'WASTE', entityId: waste.id,
    description: `Confirmed Waste ${waste.wasteNumber}`, createdAt: timestamp
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM TRANSFER
// ─────────────────────────────────────────────────────────────────────────────

export const confirmTransfer = (transfer, currentUser) => (dispatch, getState) => {
  const state = getState();
  const currentStock = state.invStock.data || [];
  const timestamp = new Date().toISOString();

  // PRE-VALIDATION: Validate ALL items first. If any fails, throw before any dispatch.
  const pendingStockMap = buildStockMap(currentStock);
  for (const item of transfer.items) {
    const key = `${item.itemId}::${transfer.fromLocationId}`;
    const available = pendingStockMap[key] ?? 0;
    const qty = parseFloat(item.quantity || 0);
    if (qty <= 0) throw new Error(`Quantity must be greater than 0 for ${item.itemName}`);
    if (available < qty) {
      throw new Error(`Insufficient stock at source for ${item.itemName}. Available: ${available}, Transfer: ${qty}`);
    }
    pendingStockMap[key] = available - qty;
  }

  // VALIDATION PASSED — apply atomically
  const freshMap = buildStockMap(currentStock);
  const ledgerEntries = [];
  const stockUpdates = [];
  const stockCreates = [];

  dispatch(confirmTransferState({ id: transfer.id, confirmedAt: timestamp, confirmedBy: currentUser.id }));

  transfer.items.forEach(txItem => {
    const qty = parseFloat(txItem.quantity || 0);

    // OUT: source location
    const { update: outUpdate, balanceAfter: outBalance } = applyStockDelta(
      freshMap, currentStock, txItem.itemId, transfer.fromLocationId, -qty, timestamp
    );
    if (outUpdate.type === 'update') stockUpdates.push(outUpdate.payload);
    else stockCreates.push(outUpdate.payload);

    ledgerEntries.push({
      id: `ledg-${uuidv4()}`,
      transactionType: 'TRANSFER_OUT',
      referenceType: 'TRANSFER',
      referenceId: transfer.id,
      referenceNumber: transfer.transferNumber,
      itemId: txItem.itemId,
      itemCode: txItem.itemCode,
      itemName: txItem.itemName,
      locationId: transfer.fromLocationId,
      uomId: txItem.uomId,
      quantity: -qty,
      rate: txItem.unitRate,
      amount: qty * txItem.unitRate,
      balanceAfter: outBalance,
      transactionDate: timestamp,
      createdBy: currentUser.id,
      createdAt: timestamp
    });

    // IN: destination location
    const { update: inUpdate, balanceAfter: inBalance } = applyStockDelta(
      freshMap, currentStock, txItem.itemId, transfer.toLocationId, qty, timestamp
    );
    if (inUpdate.type === 'update') stockUpdates.push(inUpdate.payload);
    else stockCreates.push(inUpdate.payload);

    ledgerEntries.push({
      id: `ledg-${uuidv4()}`,
      transactionType: 'TRANSFER_IN',
      referenceType: 'TRANSFER',
      referenceId: transfer.id,
      referenceNumber: transfer.transferNumber,
      itemId: txItem.itemId,
      itemCode: txItem.itemCode,
      itemName: txItem.itemName,
      locationId: transfer.toLocationId,
      uomId: txItem.uomId,
      quantity: qty,
      rate: txItem.unitRate,
      amount: qty * txItem.unitRate,
      balanceAfter: inBalance,
      transactionDate: timestamp,
      createdBy: currentUser.id,
      createdAt: timestamp
    });
  });

  stockUpdates.forEach(u => dispatch(invStockActions.updateRecord(u)));
  stockCreates.forEach(c => dispatch(invStockActions.createRecord(c)));
  if (ledgerEntries.length > 0) dispatch(addMultipleLedgerEntries(ledgerEntries));

  dispatch(logAction({
    id: `log-${uuidv4()}`, userId: currentUser.id, action: 'TRANSFER_CONFIRMED',
    entityType: 'TRANSFER', entityId: transfer.id,
    description: `Confirmed Transfer ${transfer.transferNumber}`, createdAt: timestamp
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM ADJUSTMENT
// ─────────────────────────────────────────────────────────────────────────────

export const confirmAdjustment = (adjustment, currentUser) => (dispatch, getState) => {
  const state = getState();
  const currentStock = state.invStock.data || [];
  const timestamp = new Date().toISOString();

  // PRE-VALIDATION: For negative adjustments, ensure balance stays >= 0
  const pendingStockMap = buildStockMap(currentStock);
  for (const item of adjustment.items) {
    const diff = parseFloat(item.differenceQuantity || 0);
    if (diff < 0) {
      const key = `${item.itemId}::${adjustment.locationId}`;
      const available = pendingStockMap[key] ?? 0;
      if (available + diff < 0) {
        throw new Error(`Adjustment would result in negative stock for ${item.itemName}. Current: ${available}, Adjustment: ${diff}`);
      }
      pendingStockMap[key] = available + diff;
    }
  }

  // VALIDATION PASSED
  const freshMap = buildStockMap(currentStock);
  const ledgerEntries = [];
  const stockUpdates = [];
  const stockCreates = [];

  dispatch(confirmAdjustmentState({ id: adjustment.id, confirmedAt: timestamp, confirmedBy: currentUser.id }));

  adjustment.items.forEach(adjItem => {
    const diff = parseFloat(adjItem.differenceQuantity || 0);
    if (diff === 0) return; // No change needed

    const { update, balanceAfter } = applyStockDelta(
      freshMap, currentStock, adjItem.itemId, adjustment.locationId, diff, timestamp
    );
    if (update.type === 'update') stockUpdates.push(update.payload);
    else stockCreates.push(update.payload);

    const txType = diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    ledgerEntries.push({
      id: `ledg-${uuidv4()}`,
      transactionType: txType,
      referenceType: 'ADJUSTMENT',
      referenceId: adjustment.id,
      referenceNumber: adjustment.adjustmentNumber,
      itemId: adjItem.itemId,
      itemCode: adjItem.itemCode,
      itemName: adjItem.itemName,
      locationId: adjustment.locationId,
      uomId: adjItem.uomId,
      quantity: diff,
      rate: adjItem.unitRate,
      amount: Math.abs(diff) * adjItem.unitRate,
      balanceAfter,
      transactionDate: timestamp,
      createdBy: currentUser.id,
      createdAt: timestamp
    });
  });

  stockUpdates.forEach(u => dispatch(invStockActions.updateRecord(u)));
  stockCreates.forEach(c => dispatch(invStockActions.createRecord(c)));
  if (ledgerEntries.length > 0) dispatch(addMultipleLedgerEntries(ledgerEntries));

  dispatch(logAction({
    id: `log-${uuidv4()}`, userId: currentUser.id, action: 'ADJUSTMENT_CONFIRMED',
    entityType: 'ADJUSTMENT', entityId: adjustment.id,
    description: `Confirmed Adjustment ${adjustment.adjustmentNumber}`, createdAt: timestamp
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM STOCK COUNT (Stage 5)
// ─────────────────────────────────────────────────────────────────────────────

export const confirmStockCount = (stockCount, currentUser) => (dispatch, getState) => {
  const timestamp = new Date().toISOString();
  
  // Filter for non-zero variances
  const adjustmentItems = stockCount.items
    .filter(item => parseFloat(item.varianceQuantity || 0) !== 0)
    .map(item => ({
       id: `adj-item-${uuidv4()}`,
       itemId: item.itemId,
       itemCode: item.itemCode,
       itemName: item.itemName,
       uomId: item.uomId,
       uomName: item.uomName,
       systemQuantity: item.systemQuantity,
       physicalQuantity: item.physicalQuantity,
       differenceQuantity: item.varianceQuantity,
       unitRate: item.unitRate,
       differenceValue: item.varianceValue
    }));

  let newAdjustment = null;
  if (adjustmentItems.length > 0) {
    const adjId = `adj-${uuidv4()}`;
    newAdjustment = {
      id: adjId,
      adjustmentNumber: `ADJ-${stockCount.countNumber}`,
      adjustmentDate: timestamp,
      locationId: stockCount.locationId,
      reason: 'PHYSICAL_COUNT',
      status: 'DRAFT',
      notes: `Auto-generated from Stock Count ${stockCount.countNumber}`,
      items: adjustmentItems,
      totalDifferenceValue: adjustmentItems.reduce((sum, item) => sum + (item.differenceValue || 0), 0),
      createdBy: currentUser.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      referenceType: 'STOCK_COUNT',
      referenceId: stockCount.id
    };

    // Pre-validate negative stock
    const state = getState();
    const currentStock = state.invStock.data || [];
    const pendingStockMap = buildStockMap(currentStock);
    for (const item of newAdjustment.items) {
      const diff = parseFloat(item.differenceQuantity || 0);
      if (diff < 0) {
        const key = `${item.itemId}::${newAdjustment.locationId}`;
        const available = pendingStockMap[key] ?? 0;
        if (available + diff < 0) {
          throw new Error(`Adjustment would result in negative stock for ${item.itemName}. Current: ${available}, Adjustment: ${diff}`);
        }
        pendingStockMap[key] = available + diff;
      }
    }

    // Validation passed, add the adjustment
    dispatch(createAdjustment(newAdjustment));
    
    // Now confirm the adjustment to trigger stock/ledger updates
    dispatch(confirmAdjustment(newAdjustment, currentUser));
  }

  // Update stock count status
  dispatch(updateStockCountStatus({ id: stockCount.id, status: 'CONFIRMED', confirmedAt: timestamp, confirmedBy: currentUser.id }));
  
  dispatch(logAction({
    id: `log-${uuidv4()}`, userId: currentUser.id, action: 'STOCK_COUNT_CONFIRMED',
    entityType: 'STOCK_COUNT', entityId: stockCount.id,
    description: `Confirmed Stock Count ${stockCount.countNumber}`, createdAt: timestamp
  }));
};
