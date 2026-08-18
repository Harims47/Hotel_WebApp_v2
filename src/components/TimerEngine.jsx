import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { updateOrderItem } from '../features/orders/ordersSlice';
import { addNotification } from '../features/notifications/notificationsSlice';
import { logAction } from '../features/audit/auditSlice';

// Using the requested testing values or production values
// To test, you can change these to 10000 (10s) and 20000 (20s)
const REMINDER_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const ESCALATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function TimerEngine() {
  const dispatch = useDispatch();
  const orders = useSelector(state => state.orders.data);
  const tables = useSelector(state => state.tables.data);
  const menuItems = useSelector(state => state.menu.items);
  
  useEffect(() => {
    // Run the timer check every 10 seconds
    const intervalId = setInterval(() => {
      const now = Date.now();
      
      // Sweep through active orders
      orders.forEach(order => {
        if (order.status === 'CLOSED' || order.status === 'CANCELLED' || order.status === 'PAID') return;
        
        order.items.forEach(item => {
          // Only process items sitting in READY state
          if (item.status === 'READY' && item.readyAt) {
            const readyTime = new Date(item.readyAt).getTime();
            const timeElapsed = now - readyTime;
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            const itemName = menuItem ? menuItem.name : 'Item';
            const table = tables.find(t => t.id === order.tableId);
            const tableStr = table ? table.tableNumber : order.tableId;
            
            // Determine if we should Escalate or Remind
            const snoozedUntil = item.snoozedUntil ? new Date(item.snoozedUntil).getTime() : null;
            const reminderSentAt = item.reminderSentAt ? new Date(item.reminderSentAt).getTime() : null;
            
            let shouldEscalate = false;
            if (reminderSentAt && (now - reminderSentAt >= 2 * 60 * 1000)) {
              shouldEscalate = true;
            } else if (!reminderSentAt && !snoozedUntil && timeElapsed >= ESCALATION_THRESHOLD_MS) {
              shouldEscalate = true;
            }

            if (shouldEscalate && !item.escalatedAt) {
              // Dispatch GM Escalation Notification
              dispatch(addNotification({
                id: `notif-${uuidv4()}`,
                userId: null,
                role: 'GM', // Target GM specifically
                type: 'PICKUP_ESCALATION',
                title: 'Pickup Escalation',
                message: `Table ${tableStr} (Order ${order.orderNumber}): ${itemName} has not been picked up within the expected pickup window.`,
                referenceId: order.id,
                entityType: 'ORDER_ITEM',
                entityId: item.id,
                actionUrl: '/gm/dashboard', // Example URL for GM
                priority: 'CRITICAL',
                eventKey: `PICKUP_ESCALATION:${item.id}:GM`,
              }));
              
              // Dispatch Audit Event
              dispatch(logAction({
                id: `log-${uuidv4()}`,
                userId: 'SYSTEM',
                action: 'PICKUP_ESCALATED',
                entityType: 'ORDER_ITEM',
                entityId: item.id,
                description: `Pickup escalated to GM for ${itemName} on Table ${tableStr}`,
                createdAt: new Date().toISOString()
              }));
              
              // Mark as escalated
              dispatch(updateOrderItem({
                orderId: order.id,
                orderItemId: item.id,
                updates: { escalatedAt: new Date().toISOString() }
              }));
            }
            
            let shouldRemind = false;
            if (!reminderSentAt && !item.escalatedAt && !shouldEscalate) {
              if (snoozedUntil && now >= snoozedUntil) {
                shouldRemind = true;
              } else if (!snoozedUntil && timeElapsed >= REMINDER_THRESHOLD_MS) {
                shouldRemind = true;
              }
            }

            if (shouldRemind) {
              // Dispatch Waiter Reminder Notification
              dispatch(addNotification({
                id: `notif-${uuidv4()}`,
                userId: order.waiterId,
                type: 'PICKUP_REMINDER',
                title: 'Pickup Reminder',
                message: `Table ${tableStr} (Order ${order.orderNumber}): ${itemName} has been ready for pickup.`,
                referenceId: order.id,
                entityType: 'ORDER_ITEM',
                entityId: item.id,
                actionUrl: `/waiter/tables/${order.tableId}`,
                actionRequired: 'NONE', // Don't offer snooze again
                priority: 'WARNING',
                eventKey: `PICKUP_REMINDER:${item.id}:${order.waiterId}`,
              }));
              
              // Mark as reminded
              dispatch(updateOrderItem({
                orderId: order.id,
                orderItemId: item.id,
                updates: { reminderSentAt: new Date().toISOString() }
              }));
            }
          }
        });
      });
      
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [orders, tables, menuItems, dispatch]);

  return null; // This component doesn't render anything visually
}
