import { v4 as uuidv4 } from 'uuid';
import { createOrder, updateOrderItemStatus, updateOrderItem, addOrderItems, updateOrderStatus } from '../orders/ordersSlice';
import { createKOT, updateKOTStatus, updateKOTItemStatus } from '../kot/kotSlice';
import { updateTableStatus } from '../tables/tablesSlice';
import { logAction } from '../audit/auditSlice';
import { addNotification } from '../notifications/notificationsSlice';

// Waiter actions
export const sendOrderToKOT = (tableId, waiterId, items) => (dispatch, getState) => {
  const state = getState();
  const existingOrder = state.orders.data.find(o => o.tableId === tableId && o.status === 'IN_PROGRESS');
  
  const now = new Date().toISOString();
  let orderId;
  let orderItemsToCreate = [];

  if (existingOrder) {
    orderId = existingOrder.id;
    orderItemsToCreate = items.map(item => ({
      id: `oi-${uuidv4()}`,
      orderId,
      menuItemId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      notes: item.notes || '',
      status: 'ORDERED'
    }));
    
    dispatch(addOrderItems({ orderId, items: orderItemsToCreate }));
  } else {
    orderId = `ord-${uuidv4()}`;
    const newOrderNumber = `ORD-${state.orders.data.length + 1001}`;
    
    orderItemsToCreate = items.map(item => ({
      id: `oi-${uuidv4()}`,
      orderId,
      menuItemId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      notes: item.notes || '',
      status: 'ORDERED'
    }));

    const newOrder = {
      id: orderId,
      orderNumber: newOrderNumber,
      orderType: 'DINE_IN',
      source: 'WAITER',
      tableId,
      waiterId,
      status: 'IN_PROGRESS',
      createdAt: now,
      items: orderItemsToCreate
    };
    
    dispatch(createOrder(newOrder));
    dispatch(updateTableStatus({ tableId, status: 'OCCUPIED' }));
    
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: waiterId,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: orderId,
      description: `Order ${newOrderNumber} created by Waiter`,
      createdAt: now
    }));
  }

  // Create KOT
  const kotId = `kot-${uuidv4()}`;
  const kotNumber = `KOT-${state.kot.data.length + 101}`;
  
  const newKOT = {
    id: kotId,
    kotNumber,
    orderId,
    tableId,
    createdBy: waiterId,
    status: 'NEW',
    createdAt: now,
    items: orderItemsToCreate.map(oi => ({
      id: `ki-${uuidv4()}`,
      kotId,
      orderItemId: oi.id,
      quantity: oi.quantity,
      status: 'ORDERED'
    }))
  };

  dispatch(createKOT(newKOT));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: waiterId,
    action: 'ORDER_SENT_TO_KOT',
    entityType: 'KOT',
    entityId: kotId,
    description: `Sent items to KOT ${kotNumber}`,
    createdAt: now
  }));
};

export const pickupItem = (orderId, orderItemId, waiterId) => (dispatch, getState) => {
  const now = new Date().toISOString();
  
  dispatch(updateOrderItemStatus({ orderId, orderItemId, status: 'PICKED_UP' }));
  
  // Check if this completes a KOT
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  const kots = state.kot.data.filter(k => k.orderId === orderId);
  
  kots.forEach(kot => {
    const kotItem = kot.items.find(ki => ki.orderItemId === orderItemId);
    if (kotItem) {
      dispatch(updateKOTItemStatus({ kotId: kot.id, kotItemId: kotItem.id, status: 'PICKED_UP' }));
    }

    if (kot.status === 'READY' || kot.status === 'PREPARING') {
      const hasItem = kot.items.some(ki => ki.orderItemId === orderItemId);
      if (hasItem) {
        const updatedKot = getState().kot.data.find(k => k.id === kot.id);
        const allCompleted = updatedKot.items.every(ki => {
          return ['PICKED_UP', 'SERVED', 'CANCELLED', 'COMPLETED'].includes(ki.status);
        });
        if (allCompleted) {
          dispatch(updateKOTStatus({ kotId: kot.id, status: 'COMPLETED' }));
        }
      }
    }
  });
  
  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: waiterId,
    action: 'ITEM_PICKED_UP',
    entityType: 'ORDER_ITEM',
    entityId: orderItemId,
    description: `Item picked up by waiter`,
    createdAt: now
  }));
};

export const serveItem = (orderId, orderItemId, waiterId) => (dispatch, getState) => {
  const now = new Date().toISOString();
  
  dispatch(updateOrderItemStatus({ orderId, orderItemId, status: 'SERVED' }));
  
  // Check if this completes a KOT (in case it wasn't caught in pickup somehow)
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  const kots = state.kot.data.filter(k => k.orderId === orderId);
  
  kots.forEach(kot => {
    const kotItem = kot.items.find(ki => ki.orderItemId === orderItemId);
    if (kotItem) {
      dispatch(updateKOTItemStatus({ kotId: kot.id, kotItemId: kotItem.id, status: 'SERVED' }));
    }

    if (kot.status === 'READY' || kot.status === 'PREPARING') {
      const hasItem = kot.items.some(ki => ki.orderItemId === orderItemId);
      if (hasItem) {
        const updatedKot = getState().kot.data.find(k => k.id === kot.id);
        const allCompleted = updatedKot.items.every(ki => {
          return ['PICKED_UP', 'SERVED', 'CANCELLED', 'COMPLETED'].includes(ki.status);
        });
        if (allCompleted) {
          dispatch(updateKOTStatus({ kotId: kot.id, status: 'COMPLETED' }));
        }
      }
    }
  });
  
  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: waiterId,
    action: 'ITEM_SERVED',
    entityType: 'ORDER_ITEM',
    entityId: orderItemId,
    description: `Item served by waiter`,
    createdAt: now
  }));
};

export const cancelItem = (orderId, orderItemId, waiterId, reason) => (dispatch, getState) => {
  const now = new Date().toISOString();
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  const orderItem = order?.items.find(i => i.id === orderItemId);
  if (!orderItem || !['ORDERED', 'PREPARING'].includes(orderItem.status)) return;
  
  const menuItemId = orderItem.menuItemId;
  const menuItem = state.menu.items.find(m => m.id === menuItemId);

  // Update order item status & cancellation details
  dispatch(updateOrderItem({
    orderId,
    orderItemId,
    updates: {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledBy: waiterId,
      cancelledAt: now
    }
  }));

  // Find associated KOT item and cancel it
  const kots = state.kot.data.filter(k => k.orderId === orderId);
  kots.forEach(kot => {
    const kotItem = kot.items.find(ki => ki.orderItemId === orderItemId);
    if (kotItem && ['NEW', 'PREPARING', 'ORDERED'].includes(kotItem.status)) {
      dispatch(updateKOTItemStatus({ kotId: kot.id, kotItemId: kotItem.id, status: 'CANCELLED' }));
      
      // Notify kitchen
      dispatch(addNotification({
        id: `notif-${uuidv4()}`,
        userId: null,
        role: 'KITCHEN',
        type: 'ITEM_CANCELLED',
        title: 'Item Cancelled',
        message: `Table ${order.tableId.replace('t', 'T')} (Order ${order.orderNumber}): ${menuItem?.name || 'Item'} cancelled. Reason: ${reason}`,
        referenceId: kot.id,
        isRead: false,
        createdAt: now
      }));
      
      // Check if this completes/cancels the whole KOT
      const updatedKotItems = kot.items.map(ki => ki.id === kotItem.id ? { ...ki, status: 'CANCELLED' } : ki);
      const allDone = updatedKotItems.every(ki => ki.status === 'COMPLETED' || ki.status === 'CANCELLED' || ki.status === 'READY');
      if (allDone && !['COMPLETED', 'CANCELLED'].includes(kot.status)) {
        dispatch(updateKOTStatus({ kotId: kot.id, status: 'COMPLETED' }));
      }
    }
  });

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: waiterId,
    action: 'ITEM_CANCELLED',
    entityType: 'ORDER_ITEM',
    entityId: orderItemId,
    description: `Item cancelled. Reason: ${reason}`,
    createdAt: now
  }));
};

export const cancelOrder = (orderId, waiterId, reason) => (dispatch, getState) => {
  const now = new Date().toISOString();
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  if (!order || ['PAID', 'CLOSED', 'CANCELLED'].includes(order.status)) return;
  
  // Find all active items to cancel
  const activeItems = order.items.filter(i => ['ORDERED', 'PREPARING', 'READY'].includes(i.status));
  
  activeItems.forEach(item => {
    dispatch(cancelItem(orderId, item.id, waiterId, reason));
  });
  
  // If no items were previously served or picked up, we can cancel the order
  const hasServedItems = order.items.some(i => ['SERVED', 'PICKED_UP'].includes(i.status));
  if (!hasServedItems) {
    dispatch(updateOrderStatus({ orderId, status: 'CANCELLED' }));
    if (order.tableId) {
      dispatch(updateTableStatus({ tableId: order.tableId, status: 'AVAILABLE' }));
    }
    
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: waiterId,
      action: 'ORDER_CANCELLED',
      entityType: 'ORDER',
      entityId: orderId,
      description: `Order cancelled. Reason: ${reason}`,
      createdAt: now
    }));
  }
};
