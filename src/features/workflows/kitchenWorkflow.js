import { v4 as uuidv4 } from 'uuid';
import { updateKOTStatus, updateKOTItemStatus } from '../kot/kotSlice';
import { updateOrderItemStatus } from '../orders/ordersSlice';
import { addNotification } from '../notifications/notificationsSlice';
import { logAction } from '../audit/auditSlice';

export const startKOTPreparation = (kotId, kitchenUserId) => (dispatch, getState) => {
  const state = getState();
  const kot = state.kot.data.find(k => k.id === kotId);
  if (!kot) return;
  
  const now = new Date().toISOString();
  
  dispatch(updateKOTStatus({ kotId, status: 'PREPARING' }));
  
  // Update all associated order items to PREPARING
  kot.items.forEach(ki => {
    dispatch(updateKOTItemStatus({ kotId, kotItemId: ki.id, status: 'PREPARING' }));
    dispatch(updateOrderItemStatus({ orderId: kot.orderId, orderItemId: ki.orderItemId, status: 'PREPARING' }));
  });

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: kitchenUserId,
    action: 'KOT_STARTED',
    entityType: 'KOT',
    entityId: kotId,
    description: `Preparation started for KOT ${kot.kotNumber}`,
    createdAt: now
  }));
};

export const markItemReady = (kotId, kotItemId, kitchenUserId) => (dispatch, getState) => {
  const state = getState();
  const kot = state.kot.data.find(k => k.id === kotId);
  if (!kot) return;
  
  const kotItem = kot.items.find(i => i.id === kotItemId);
  if (!kotItem) return;

  const order = state.orders.data.find(o => o.id === kot.orderId);
  const table = state.tables.data.find(t => t.id === kot.tableId);
  const menuItemId = order?.items.find(i => i.id === kotItem.orderItemId)?.menuItemId;
  const menuItem = state.menu.items.find(m => m.id === menuItemId);

  const now = new Date().toISOString();

  // Mark item ready
  dispatch(updateKOTItemStatus({ kotId, kotItemId, status: 'READY' }));
  dispatch(updateOrderItemStatus({ orderId: kot.orderId, orderItemId: kotItem.orderItemId, status: 'READY' }));
  
  // Notify Waiter or Cashier
  if (order) {
    const itemName = menuItem ? menuItem.name : 'Item';
    if (order.orderType === 'TAKEAWAY') {
      dispatch(addNotification({
        id: `notif-${uuidv4()}`,
        userId: order.waiterId, // The cashier who created it
        type: 'ITEM_READY',
        title: 'Takeaway Order Ready',
        message: `${order.orderNumber} - ${order.customerName || 'Customer'}: ${itemName} ×${kotItem.quantity} is ready for pickup.`,
        referenceId: order.id,
        isRead: false,
        createdAt: now
      }));
    } else if (order.waiterId) {
      dispatch(addNotification({
        id: `notif-${uuidv4()}`,
        userId: order.waiterId,
        type: 'ITEM_READY',
        title: 'Item Ready',
        message: `Table ${table ? table.tableNumber : kot.tableId}: ${itemName} ×${kotItem.quantity} is ready for pickup.`,
        referenceId: order.id,
        isRead: false,
        createdAt: now
      }));
    }
  }

  // Check if ALL active items in this KOT are READY
  const updatedKot = getState().kot.data.find(k => k.id === kotId);
  const allReady = updatedKot.items.every(i => i.status === 'READY' || i.status === 'CANCELLED');
  if (allReady) {
    dispatch(updateKOTStatus({ kotId, status: 'READY' }));
  }

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: kitchenUserId,
    action: 'ITEM_READY',
    entityType: 'ORDER_ITEM',
    entityId: kotItem.orderItemId,
    description: `Item marked ready by kitchen`,
    createdAt: now
  }));
};
