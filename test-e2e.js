import assert from 'assert';

// Mock localStorage and window
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
global.window = { location: { href: '' } };

// Now we can safely import the application modules
import { store } from './src/app/store/index.js';
import { createTakeawayOrder, handoverTakeawayOrder, saveBillChanges, printBill, recordPayment, completeOrder } from './src/features/workflows/cashierWorkflow.js';
import { startKOTPreparation, markItemReady } from './src/features/workflows/kitchenWorkflow.js';
import { sendOrderToKOT, pickupItem, serveItem } from './src/features/workflows/waiterWorkflow.js';
import { login } from './src/features/auth/authSlice.js';

async function runTests() {
  console.log('--- Starting Stage 4 E2E Integration Tests ---\n');

  // Helpers
  const getState = () => store.getState();
  const getOrder = (id) => getState().orders.data.find(o => o.id === id);
  const getKOT = (orderId) => getState().kot.data.find(k => k.orderId === orderId);
  const getBill = (orderId) => (getState().billing.data || getState().billing.bills || []).find(b => b.orderId === orderId);

  // Users
  const cashierId = 'user-2'; // Assumed from initial state
  const kitchenId = 'user-4';
  const waiterId = 'user-3';
  
  // Menu Item IDs (from initial state)
  const chickenBiryani = getState().menu.items.find(m => m.name === 'Chicken Biryani');
  const coke = getState().menu.items.find(m => m.name === 'Coke');

  // =========================================================================
  // TEST 1: OFFLINE TAKEAWAY
  // =========================================================================
  console.log('Test 1: Offline Takeaway - Creation');
  
  store.dispatch(login({ username: 'cashier', password: 'password' }));
  
  const cart1 = [
    { ...chickenBiryani, quantity: 2 },
    { ...coke, quantity: 2 }
  ];

  store.dispatch(createTakeawayOrder('OFFLINE', 'Arun Kumar', '9876543210', '', cart1, cashierId));

  const state1 = getState();
  const offlineOrder = state1.orders.data[state1.orders.data.length - 1];
  
  assert.strictEqual(offlineOrder.orderType, 'TAKEAWAY', 'Order type should be TAKEAWAY');
  assert.strictEqual(offlineOrder.source, 'OFFLINE', 'Source should be OFFLINE');
  assert.strictEqual(offlineOrder.customerName, 'Arun Kumar', 'Customer name mismatch');
  assert.strictEqual(offlineOrder.tableId, null, 'Takeaway tableId must be null');
  
  const offlineKOT = getKOT(offlineOrder.id);
  assert.ok(offlineKOT, 'KOT should be created');
  assert.strictEqual(offlineKOT.orderType, 'TAKEAWAY', 'KOT should be tagged TAKEAWAY');
  console.log('✅ Offline Takeaway Creation Passed\n');

  // =========================================================================
  // TEST 2: KITCHEN PREPARATION
  // =========================================================================
  console.log('Test 2: Kitchen Preparation');
  
  store.dispatch(startKOTPreparation(offlineKOT.id, kitchenId));
  assert.strictEqual(getKOT(offlineOrder.id).status, 'PREPARING', 'KOT status should be PREPARING');

  offlineKOT.items.forEach(ki => {
    store.dispatch(markItemReady(offlineKOT.id, ki.id, kitchenId));
  });

  assert.strictEqual(getKOT(offlineOrder.id).status, 'READY', 'KOT status should be READY');
  console.log('✅ Kitchen Preparation Passed\n');

  // =========================================================================
  // TEST 3: CASHIER NOTIFICATION & HANDOVER
  // =========================================================================
  console.log('Test 3: Cashier Notification & Handover');
  
  const notifications = getState().notifications.data;
  const readyNotif = notifications.find(n => n.referenceId === offlineOrder.id && n.title === 'Takeaway Order Ready');
  assert.ok(readyNotif, 'Cashier should receive Takeaway Order Ready notification');

  store.dispatch(handoverTakeawayOrder(offlineOrder.id, cashierId));

  const orderAfterHandover = getOrder(offlineOrder.id);
  assert.strictEqual(orderAfterHandover.status, 'BILL_REQUESTED', 'Order status should transition to BILL_REQUESTED');
  
  orderAfterHandover.items.forEach(item => {
    assert.strictEqual(item.status, 'PICKED_UP', 'Items should be marked PICKED_UP');
  });

  const offlineBill = getBill(offlineOrder.id);
  assert.ok(offlineBill, 'Bill should be generated');
  console.log('✅ Notification & Handover Passed\n');

  // =========================================================================
  // TEST 4: TAKEAWAY BILLING
  // =========================================================================
  console.log('Test 4: Takeaway Billing');
  
  const updatedItems = offlineBill.items.map(item => {
    if (item.menuItemId === chickenBiryani.id) {
      return { ...item, billRate: 200, lineTotal: 200 * item.quantity };
    }
    return item;
  });

  store.dispatch(saveBillChanges(offlineBill.id, cashierId, updatedItems, 0, 10, 'Test discount'));
  
  const editedBill = getBill(offlineOrder.id);
  assert.strictEqual(editedBill.items.find(i => i.menuItemId === chickenBiryani.id).billRate, 200, 'Rate should be overridden');
  assert.strictEqual(editedBill.discountPercentage, 10, '10% discount should be applied');
  
  store.dispatch(printBill(offlineBill.id, cashierId));
  assert.strictEqual(getBill(offlineOrder.id).status, 'PRINTED', 'Bill should be PRINTED');

  store.dispatch(recordPayment(offlineBill.id, 'UPI', editedBill.grandTotal, cashierId));
  
  assert.strictEqual(getBill(offlineOrder.id).status, 'PAID', 'Bill should be PAID');
  assert.strictEqual(getOrder(offlineOrder.id).status, 'CLOSED', 'Order should be CLOSED');
  console.log('✅ Takeaway Billing Passed\n');

  // =========================================================================
  // TEST 5: PHONE ORDER
  // =========================================================================
  console.log('Test 5: Phone Order (with state validation)');
  
  store.dispatch(createTakeawayOrder('PHONE', 'Priya', '1234567890', '', cart1, cashierId));
  const phoneOrder = getState().orders.data[getState().orders.data.length - 1];
  
  assert.strictEqual(phoneOrder.source, 'PHONE', 'Source should be PHONE');
  assert.strictEqual(phoneOrder.tableId, null, 'TableId should be null');

  const phoneKOT = getKOT(phoneOrder.id);
  store.dispatch(startKOTPreparation(phoneKOT.id, kitchenId));
  
  // Validate localStorage actually persisted the 'PREPARING' state
  const savedState = JSON.parse(global.localStorage.getItem('restaurant_os_v1_state'));
  const savedPhoneKot = savedState.kot.data.find(k => k.id === phoneKOT.id);
  assert.strictEqual(savedPhoneKot.status, 'PREPARING', 'Persisted state should reflect PREPARING');

  phoneKOT.items.forEach(ki => store.dispatch(markItemReady(phoneKOT.id, ki.id, kitchenId)));
  store.dispatch(handoverTakeawayOrder(phoneOrder.id, cashierId));
  
  const phoneBill = getBill(phoneOrder.id);
  store.dispatch(recordPayment(phoneBill.id, 'CASH', phoneBill.grandTotal, cashierId));
  
  assert.strictEqual(getOrder(phoneOrder.id).status, 'CLOSED', 'Phone Order should be CLOSED');
  console.log('✅ Phone Order (with persistence) Passed\n');

  // =========================================================================
  // TEST 6: REGRESSION - DINE-IN
  // =========================================================================
  console.log('Test 6: Regression - Dine-In');
  
  const table = getState().tables.data[0];
  store.dispatch(sendOrderToKOT(table.id, waiterId, [{ ...chickenBiryani, quantity: 1 }]));
  
  const dineInOrder = getState().orders.data.find(o => o.tableId === table.id && o.status === 'IN_PROGRESS');
  assert.ok(dineInOrder, 'Dine-In order should be created');
  assert.strictEqual(dineInOrder.orderType, 'DINE_IN', 'Order type should be DINE_IN');
  
  const dineInKOT = getKOT(dineInOrder.id);
  store.dispatch(startKOTPreparation(dineInKOT.id, kitchenId));
  
  dineInKOT.items.forEach(ki => {
    store.dispatch(markItemReady(dineInKOT.id, ki.id, kitchenId));
  });

  dineInOrder.items.forEach(oi => {
    store.dispatch(pickupItem(dineInOrder.id, oi.id, waiterId));
    store.dispatch(serveItem(dineInOrder.id, oi.id, waiterId));
  });

  store.dispatch(completeOrder(dineInOrder.id, waiterId));
  assert.strictEqual(getOrder(dineInOrder.id).status, 'BILL_REQUESTED', 'Dine-In order should be BILL_REQUESTED');

  const dineInBill = getBill(dineInOrder.id);
  store.dispatch(recordPayment(dineInBill.id, 'CASH', dineInBill.grandTotal, cashierId));

  assert.strictEqual(getOrder(dineInOrder.id).status, 'CLOSED', 'Dine-In order should be CLOSED');
  assert.strictEqual(getState().tables.data.find(t => t.id === table.id).status, 'AVAILABLE', 'Table should be AVAILABLE');
  console.log('✅ Regression Dine-In Passed\n');

  console.log('🎉 ALL INTEGRATION TESTS PASSED 🎉');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
