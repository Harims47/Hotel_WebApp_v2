import { v4 as uuidv4 } from 'uuid';
import { updateOrderStatus, createOrder, updateOrderItemStatus } from '../orders/ordersSlice';
import { createKOT } from '../kot/kotSlice';
import { createBill, updateBillStatus, updateBillDetails } from '../billing/billingSlice';
import { createPayment } from '../payments/paymentsSlice';
import { updateTableStatus } from '../tables/tablesSlice';
import { addNotification } from '../notifications/notificationsSlice';
import { logAction } from '../audit/auditSlice';
import { createDelivery } from '../delivery/deliverySlice';

/**
 * Initiated by the Waiter when all food has been served.
 */
export const completeOrder = (orderId, waiterId) => (dispatch, getState) => {
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  const menuItems = state.menu.items;
  const restaurantSettings = state.restaurant.data?.settings || {};
  const isTaxEnabled = restaurantSettings.taxEnabled !== false; // Default true
  const taxRate = isTaxEnabled ? (restaurantSettings.taxRate || 5) : 0;

  const now = new Date().toISOString();

  // Change order status
  dispatch(updateOrderStatus({ orderId, status: 'BILL_REQUESTED' }));

  // Calculate items and totals
  let subtotal = 0;
  const billItems = order.items
    .filter(i => i.status !== 'CANCELLED')
    .map(i => {
      // Find current menu price if order doesn't have it explicitly stored as unitPrice
      const mItem = menuItems.find(m => m.id === i.menuItemId);
      const originalRate = i.unitPrice || mItem?.price || 0;
      const lineTotal = originalRate * i.quantity;
      subtotal += lineTotal;

      return {
        id: `bi-${uuidv4()}`,
        orderItemId: i.id,
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        originalRate,
        billRate: originalRate,
        lineTotal
      };
    });

  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  // Create Bill
  const billingData = state.billing.data || state.billing.bills || []; // Fallback for old localstorage schema
  
  // Prevent duplicate bills for the same order
  const existingBill = billingData.find(b => b.orderId === orderId && b.status !== 'CANCELLED');
  if (existingBill) {
    return;
  }

  const billId = `bill-${uuidv4()}`;
  const billNumber = `BILL-${billingData.length + 1001}`;

  const newBill = {
    id: billId,
    billNumber,
    orderId,
    tableId: order.tableId,
    waiterId: order.waiterId,
    status: 'REQUESTED',
    items: billItems,
    subtotal,
    discountPercentage: 0,
    discountAmount: 0,
    taxRate,
    taxAmount,
    grandTotal,
    createdAt: now,
    printedAt: null,
  };

  dispatch(createBill(newBill));

  // Notify Cashier
  const orderLocationLabel = order.tableId
    ? `Table ${state.tables.data.find(t => t.id === order.tableId)?.tableNumber || 'Unknown'}`
    : `${order.orderType === 'TAKEAWAY' ? (order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Takeaway') : 'Order'}${order.customerName ? ` (${order.customerName})` : ''}`;
  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    userId: null,
    role: 'CASHIER',
    type: 'BILL_REQUESTED',
    title: 'New Bill Request',
    message: `${orderLocationLabel} (Order #${order.orderNumber}) requested bill. Total: ₹${grandTotal.toFixed(2)}`,
    referenceId: billId,
    entityType: 'BILL',
    entityId: billId,
    actionUrl: '/cashier/bills',
    priority: 'INFO',
    eventKey: `BILL_REQUESTED:${billId}:CASHIER`,
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: waiterId,
    action: 'BILL_REQUESTED',
    entityType: 'BILL',
    entityId: billId,
    description: `Waiter requested bill for Order ${order.orderNumber}`,
    createdAt: now
  }));
};

/**
 * Called by Cashier after modifying rates or discount.
 */
export const saveBillChanges = (billId, cashierId, updatedItems, discountAmount, discountPercentage, reason) => (dispatch, getState) => {
  const state = getState();
  const bill = state.billing.data ? state.billing.data.find(b => b.id === billId) : state.billing.bills.find(b => b.id === billId);
  const now = new Date().toISOString();
  const menuItems = state.menu.items;

  let subtotal = 0;
  updatedItems.forEach(i => {
    subtotal += i.lineTotal;
  });

  const taxAmount = ((subtotal - discountAmount) * bill.taxRate) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  dispatch(updateBillDetails({
    billId,
    items: updatedItems,
    subtotal,
    discountAmount,
    discountPercentage,
    taxAmount,
    grandTotal
  }));

  // Create detailed audit logs
  updatedItems.forEach((item, idx) => {
    const originalItem = bill.items[idx];
    if (item.billRate !== originalItem.billRate) {
      const mItem = menuItems.find(m => m.id === item.menuItemId);
      dispatch(logAction({
        id: `log-${uuidv4()}`,
        userId: cashierId,
        action: 'BILL_ITEM_RATE_CHANGED',
        entityType: 'BILL_ITEM',
        entityId: item.id,
        description: `Rate changed for ${mItem?.name || 'Item'}: ₹${originalItem.billRate} → ₹${item.billRate}. Reason: ${reason}`,
        createdAt: now
      }));
    }
  });

  if (discountAmount !== bill.discountAmount || discountPercentage !== bill.discountPercentage) {
    const actionName = (bill.discountAmount === 0 && bill.discountPercentage === 0) ? 'BILL_DISCOUNT_APPLIED' : 'BILL_DISCOUNT_UPDATED';
    const discountDesc = discountPercentage > 0 ? `${discountPercentage}%` : `₹${discountAmount}`;
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: cashierId,
      action: actionName,
      entityType: 'BILL',
      entityId: billId,
      description: `Discount ${actionName.includes('APPLIED') ? 'applied' : 'updated'}: ${discountDesc}. Reason: ${reason}`,
      createdAt: now
    }));
  }
};

/**
 * Called by Cashier when printing the bill.
 */
export const printBill = (billId, cashierId) => (dispatch) => {
  const now = new Date().toISOString();

  dispatch(updateBillStatus({ billId, status: 'PRINTED', printedAt: now }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'BILL_PRINTED',
    entityType: 'BILL',
    entityId: billId,
    description: `Bill printed`,
    createdAt: now
  }));
};

/**
 * Called by Cashier to record payment and close the table.
 */
export const recordPayment = (billId, method, amount, cashierId) => (dispatch, getState) => {
  const state = getState();
  const bill = state.billing.data.find(b => b.id === billId);
  const order = state.orders.data.find(o => o.id === bill.orderId);
  
  const now = new Date().toISOString();
  const paymentId = `pay-${uuidv4()}`;

  // 1. Create Payment
  const newPayment = {
    id: paymentId,
    paymentNumber: `PAY-${state.payments.data.length + 1001}`,
    billId,
    orderId: bill.orderId,
    amount,
    method, // 'CASH' | 'UPI'
    status: 'PAID',
    receivedBy: cashierId,
    createdAt: now
  };

  dispatch(createPayment(newPayment));

  // 2. Update Bill to PAID
  dispatch(updateBillStatus({ billId, status: 'PAID' }));

  // 3. Update Order to CLOSED
  dispatch(updateOrderStatus({ orderId: bill.orderId, status: 'CLOSED' }));

  // 4. Update Table to AVAILABLE (only for dine-in)
  if (bill.tableId) {
    dispatch(updateTableStatus({ tableId: bill.tableId, status: 'AVAILABLE' }));
  }

  // Logs
  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'PAYMENT_RECEIVED',
    entityType: 'PAYMENT',
    entityId: paymentId,
    description: `Payment of ₹${amount} received via ${method}`,
    createdAt: now
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'ORDER_CLOSED',
    entityType: 'ORDER',
    entityId: bill.orderId,
    description: `Order closed and table released`,
    createdAt: now
  }));
};

export const createTakeawayOrder = (source, customerName, customerPhone, notes, cartItems, cashierId, fulfillmentType = 'CUSTOMER_PICKUP', address = null) => (dispatch, getState) => {
  const state = getState();
  const now = new Date().toISOString();
  const orderId = `ord-${uuidv4()}`;
  const orderNumber = `ORD-${state.orders.data.length + 1001}`;

  const orderItems = cartItems.map(item => ({
    id: `oi-${uuidv4()}`,
    orderId,
    menuItemId: item.id,
    quantity: item.quantity,
    unitPrice: item.price,
    status: 'ORDERED',
    notes: notes || '',
    createdAt: now,
  }));

  const newOrder = {
    id: orderId,
    orderNumber,
    tableId: null, // No table for takeaway
    waiterId: cashierId, // Cashier is acting as order taker
    orderType: 'TAKEAWAY',
    source, // 'OFFLINE' | 'PHONE'
    customerName,
    customerPhone,
    fulfillmentType,
    status: 'IN_PROGRESS',
    items: orderItems,
    createdAt: now,
  };

  dispatch(createOrder(newOrder));

  // Create KOT
  const kotId = `kot-${uuidv4()}`;
  const kotNumber = `KOT-${state.kot.data.length + 101}`;
  
  const kotItems = orderItems.map(oi => ({
    id: `ki-${uuidv4()}`,
    kotId,
    orderItemId: oi.id,
    quantity: oi.quantity,
    status: 'NEW'
  }));

  const newKOT = {
    id: kotId,
    kotNumber,
    orderId,
    tableId: null,
    waiterId: cashierId,
    orderType: 'TAKEAWAY',
    source,
    customerName,
    customerName,
    customerPhone,
    fulfillmentType,
    status: 'NEW',
    items: kotItems,
    createdAt: now
  };

  dispatch(createKOT(newKOT));

  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    userId: null,
    role: 'KOT',
    type: 'ORDER_CREATED',
    title: 'New Takeaway Order',
    message: `Takeaway (${source}): ${customerName || 'Customer'} - ${kotItems.length} items`,
    referenceId: kotId,
    entityType: 'KOT',
    entityId: kotId,
    actionUrl: '/kot/orders',
    priority: 'INFO',
    eventKey: `ORDER_CREATED:${kotId}:KOT`,
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'TAKEAWAY_ORDER_CREATED',
    entityType: 'ORDER',
    entityId: orderId,
    description: `Takeaway order created via ${source}`,
    createdAt: now
  }));

  if (fulfillmentType === 'DELIVERY') {
    const deliveryId = `del-${uuidv4()}`;
    dispatch(createDelivery({
      id: deliveryId,
      orderId,
      assignedDeliveryUserId: null,
      customerName,
      customerPhone,
      address: address?.addressLine || '',
      area: address?.area || '',
      city: address?.city || '',
      pincode: address?.pincode || '',
      landmark: address?.landmark || '',
      status: 'PENDING',
      paymentMethod: null,
      createdAt: now
    }));
  }
};

export const handoverTakeawayOrder = (orderId, cashierId) => (dispatch, getState) => {
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  const now = new Date().toISOString();

  // Handover just transitions the order so it can be billed
  
  // Transition order status
  dispatch(updateOrderStatus({ orderId, status: 'BILL_REQUESTED' }));
  
  order.items.forEach(item => {
    dispatch(updateOrderItemStatus({ orderId, orderItemId: item.id, status: 'PICKED_UP' }));
  });

  // Generate bill via the exact same completeOrder logic
  dispatch(completeOrder(orderId, cashierId));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'TAKEAWAY_HANDOVER',
    entityType: 'ORDER',
    entityId: orderId,
    description: `Takeaway order handed over to customer`,
    createdAt: now
  }));
};

export const cancelTakeawayOrder = (orderId, cashierId) => (dispatch, getState) => {
  const state = getState();
  const order = state.orders.data.find(o => o.id === orderId);
  const now = new Date().toISOString();

  dispatch(updateOrderStatus({ orderId, status: 'CANCELLED' }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'TAKEAWAY_ORDER_CANCELLED',
    entityType: 'ORDER',
    entityId: orderId,
    description: `Takeaway order cancelled`,
    createdAt: now
  }));
};
