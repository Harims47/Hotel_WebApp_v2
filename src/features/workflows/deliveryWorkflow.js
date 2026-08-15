import { v4 as uuidv4 } from 'uuid';
import { updateDeliveryStatus, updateDeliveryPayment, assignDeliveryBoy as assignBoyAction } from '../delivery/deliverySlice';
import { addNotification } from '../notifications/notificationsSlice';
import { logAction } from '../audit/auditSlice';
import { recordPayment } from './cashierWorkflow';

export const assignDeliveryBoy = (deliveryId, deliveryBoyUserId, cashierId) => (dispatch, getState) => {
  const state = getState();
  const delivery = state.delivery.data.find(d => d.id === deliveryId);
  const now = new Date().toISOString();

  dispatch(assignBoyAction({ deliveryId, userId: deliveryBoyUserId }));

  // Notify Delivery Boy
  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    userId: deliveryBoyUserId,
    role: 'DELIVERY_BOY',
    title: 'New Delivery Assigned',
    message: `Order: ${delivery.orderId} - ${delivery.customerName}`,
    type: 'INFO',
    referenceId: deliveryId,
    isRead: false,
    createdAt: now,
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: cashierId,
    action: 'DELIVERY_ASSIGNED',
    entityType: 'DELIVERY',
    entityId: deliveryId,
    description: `Delivery assigned to user ${deliveryBoyUserId}`,
    createdAt: now
  }));
};

export const pickupDeliveryOrder = (deliveryId, deliveryBoyId) => (dispatch, getState) => {
  const state = getState();
  const delivery = state.delivery.data.find(d => d.id === deliveryId);
  const now = new Date().toISOString();

  dispatch(updateDeliveryStatus({ deliveryId, status: 'PICKED_UP' }));

  // Notify Cashier
  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    userId: null,
    role: 'CASHIER',
    title: 'Delivery Picked Up',
    message: `Order ${delivery.orderId} picked up by Delivery Boy`,
    type: 'INFO',
    referenceId: deliveryId,
    isRead: false,
    createdAt: now,
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: deliveryBoyId,
    action: 'DELIVERY_PICKED_UP',
    entityType: 'DELIVERY',
    entityId: deliveryId,
    description: `Delivery picked up`,
    createdAt: now
  }));
};

export const startDelivery = (deliveryId, deliveryBoyId) => (dispatch, getState) => {
  const state = getState();
  const delivery = state.delivery.data.find(d => d.id === deliveryId);
  const now = new Date().toISOString();

  dispatch(updateDeliveryStatus({ deliveryId, status: 'OUT_FOR_DELIVERY' }));

  // Notify Cashier
  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    userId: null,
    role: 'CASHIER',
    title: 'Out for Delivery',
    message: `Order ${delivery.orderId} is out for delivery`,
    type: 'INFO',
    referenceId: deliveryId,
    isRead: false,
    createdAt: now,
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: deliveryBoyId,
    action: 'DELIVERY_STARTED',
    entityType: 'DELIVERY',
    entityId: deliveryId,
    description: `Delivery started`,
    createdAt: now
  }));
};

export const confirmDelivery = (deliveryId, paymentMethod, deliveryBoyId) => (dispatch, getState) => {
  const state = getState();
  const delivery = state.delivery.data.find(d => d.id === deliveryId);
  const bill = state.billing.data.find(b => b.orderId === delivery.orderId && b.status === 'PRINTED');
  const now = new Date().toISOString();

  if (!bill) {
    throw new Error('Cannot complete delivery: Printed bill not found.');
  }

  // Update Delivery status
  dispatch(updateDeliveryPayment({ deliveryId, paymentMethod }));
  dispatch(updateDeliveryStatus({ deliveryId, status: 'DELIVERED' }));

  // Notify Cashier
  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    userId: null,
    role: 'CASHIER',
    title: 'Order Delivered',
    message: `Order ${delivery.orderId} delivered successfully. Payment: ${paymentMethod}`,
    type: 'SUCCESS',
    referenceId: deliveryId,
    isRead: false,
    createdAt: now,
  }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: deliveryBoyId,
    action: 'DELIVERY_COMPLETED',
    entityType: 'DELIVERY',
    entityId: deliveryId,
    description: `Delivery completed. Payment via ${paymentMethod}`,
    createdAt: now
  }));

  // Trigger Cashier recordPayment to close out the bill, order, and record payment
  // The delivery boy acts as the receiver in this context.
  dispatch(recordPayment(bill.id, paymentMethod, bill.grandTotal, deliveryBoyId));
};
