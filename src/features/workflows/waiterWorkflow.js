import { v4 as uuidv4 } from 'uuid';
import { createOrder, updateOrderItemStatus, addOrderItems } from '../orders/ordersSlice';
import { createKOT, updateKOTStatus } from '../kot/kotSlice';
import { updateTableStatus } from '../tables/tablesSlice';
import { logAction } from '../audit/auditSlice';

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
    if (kot.status === 'READY' || kot.status === 'PREPARING') {
      const hasItem = kot.items.some(ki => ki.orderItemId === orderItemId);
      if (hasItem) {
        const allCompleted = kot.items.every(ki => {
          const oi = order.items.find(i => i.id === ki.orderItemId);
          // Check if oi is PICKED_UP, SERVED, or CANCELLED. We must handle the current item manually if getState is stale, but redux is sync so it's fine.
          // Wait, state is grabbed BEFORE dispatch if we aren't careful.
          // Let's just use the updated order. Wait, `order` was grabbed from state BEFORE dispatch? No, state = getState() is after dispatch.
          return oi?.status === 'PICKED_UP' || oi?.status === 'SERVED' || oi?.status === 'CANCELLED' || ki.orderItemId === orderItemId;
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
    if (kot.status === 'READY' || kot.status === 'PREPARING') {
      const hasItem = kot.items.some(ki => ki.orderItemId === orderItemId);
      if (hasItem) {
        const allCompleted = kot.items.every(ki => {
          const oi = order.items.find(i => i.id === ki.orderItemId);
          return oi?.status === 'PICKED_UP' || oi?.status === 'SERVED' || oi?.status === 'CANCELLED' || ki.orderItemId === orderItemId;
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
