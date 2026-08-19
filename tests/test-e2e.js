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
import { store } from '../frontend/src/app/store/index.js';
import { createTakeawayOrder, handoverTakeawayOrder, saveBillChanges, printBill, recordPayment, completeOrder } from '../frontend/src/features/workflows/cashierWorkflow.js';
import { startKOTPreparation, markItemReady } from '../frontend/src/features/workflows/kitchenWorkflow.js';
import { sendOrderToKOT, pickupItem, serveItem } from '../frontend/src/features/workflows/waiterWorkflow.js';
import { assignDeliveryBoy, pickupDeliveryOrder, startDelivery, confirmDelivery } from '../frontend/src/features/workflows/deliveryWorkflow.js';
import { login } from '../frontend/src/features/auth/authSlice.js';

async function runTests() {
  console.log('--- Starting Stage 5 E2E Integration Tests ---\n');

  // Helpers
  const getState = () => store.getState();
  const getOrder = (id) => getState().orders.data.find(o => o.id === id);
  const getKOT = (orderId) => getState().kot.data.find(k => k.orderId === orderId);
  const getBill = (orderId) => (getState().billing.data || getState().billing.bills || []).find(b => b.orderId === orderId);
  const getDelivery = (orderId) => getState().delivery.data.find(d => d.orderId === orderId);

  // Users
  const cashierId = 'u-6'; // Front Desk Cashier
  const kitchenId = 'u-5'; // Main Kitchen
  const deliveryBoyId = 'u-7'; // Raj (Delivery)
  const waiterId = 'u-3'; // Rahul (Waiter)
  
  // Menu Item IDs (from initial state)
  const chickenBiryani = getState().menu.items.find(m => m.name === 'Chicken Biryani');
  const coke = getState().menu.items.find(m => m.name === 'Coke');

  // =========================================================================
  // TEST A-F: DELIVERY WORKFLOW
  // =========================================================================
  console.log('Test A: Delivery Phone Order - Creation');
  
  const cart1 = [
    { ...chickenBiryani, quantity: 2 },
    { ...coke, quantity: 2 }
  ];

  const address = {
    addressLine: '12, Gandhi Road',
    area: 'RS Puram',
    city: 'Coimbatore',
    pincode: '641002',
    landmark: 'Near ABC School'
  };

  store.dispatch(createTakeawayOrder('PHONE', 'Arun Kumar', '9876543210', '', cart1, cashierId, 'DELIVERY', address));
  
  const stateAfterCreation = getState();
  const deliveryOrder = stateAfterCreation.orders.data[stateAfterCreation.orders.data.length - 1];
  
  assert.strictEqual(deliveryOrder.orderType, 'TAKEAWAY');
  assert.strictEqual(deliveryOrder.source, 'PHONE');
  assert.strictEqual(deliveryOrder.fulfillmentType, 'DELIVERY');
  assert.strictEqual(deliveryOrder.customerName, 'Arun Kumar');
  assert.strictEqual(deliveryOrder.items.length, 2);

  const deliveryKOT = getKOT(deliveryOrder.id);
  assert.ok(deliveryKOT, 'KOT should be created');
  assert.strictEqual(deliveryKOT.status, 'NEW');

  const deliveryRecord = getDelivery(deliveryOrder.id);
  assert.ok(deliveryRecord, 'Delivery record should be created');
  assert.strictEqual(deliveryRecord.status, 'PENDING');
  console.log('✅ Delivery Phone Order Creation Passed');

  console.log('\nTest B: Kitchen Preparation & Mark Ready');
  store.dispatch(startKOTPreparation(deliveryKOT.id, kitchenId));
  
  deliveryKOT.items.forEach(item => {
    store.dispatch(markItemReady(deliveryKOT.id, item.id, kitchenId));
  });

  const kotAfterPrep = getKOT(deliveryOrder.id);
  assert.strictEqual(kotAfterPrep.status, 'READY', 'KOT should be READY');

  const deliveryAfterPrep = getDelivery(deliveryOrder.id);
  assert.strictEqual(deliveryAfterPrep.status, 'READY', 'Delivery status should be READY');

  const billAfterPrep = getBill(deliveryOrder.id);
  assert.ok(billAfterPrep, 'Bill should be automatically created');
  assert.strictEqual(billAfterPrep.status, 'REQUESTED', 'Bill should be REQUESTED');
  console.log('✅ Kitchen Preparation Passed');

  console.log('\nTest C: Cashier Bill Printing');
  store.dispatch(printBill(billAfterPrep.id, cashierId));

  const billAfterPrint = getBill(deliveryOrder.id);
  assert.strictEqual(billAfterPrint.status, 'PRINTED', 'Bill should be PRINTED');
  console.log('✅ Cashier Bill Printing Passed');

  console.log('\nTest D: Assign Delivery Boy');
  store.dispatch(assignDeliveryBoy(deliveryRecord.id, deliveryBoyId, cashierId));

  const deliveryAfterAssign = getDelivery(deliveryOrder.id);
  assert.strictEqual(deliveryAfterAssign.status, 'ASSIGNED', 'Delivery status should be ASSIGNED');
  assert.strictEqual(deliveryAfterAssign.assignedDeliveryUserId, deliveryBoyId, 'Delivery Boy assigned');
  console.log('✅ Assign Delivery Boy Passed');

  console.log('\nTest E: Delivery Boy Pickup & Start');
  store.dispatch(pickupDeliveryOrder(deliveryRecord.id, deliveryBoyId));
  
  let currentDel = getDelivery(deliveryOrder.id);
  assert.strictEqual(currentDel.status, 'PICKED_UP', 'Delivery status should be PICKED_UP');

  store.dispatch(startDelivery(deliveryRecord.id, deliveryBoyId));
  currentDel = getDelivery(deliveryOrder.id);
  assert.strictEqual(currentDel.status, 'OUT_FOR_DELIVERY', 'Delivery status should be OUT_FOR_DELIVERY');
  console.log('✅ Delivery Pickup & Start Passed');

  console.log('\nTest F: Customer Delivery & Payment');
  store.dispatch(confirmDelivery(deliveryRecord.id, 'UPI', deliveryBoyId));

  currentDel = getDelivery(deliveryOrder.id);
  assert.strictEqual(currentDel.status, 'DELIVERED', 'Delivery status should be DELIVERED');
  assert.strictEqual(currentDel.paymentMethod, 'UPI', 'Payment method recorded');

  const billAfterDel = getBill(deliveryOrder.id);
  assert.strictEqual(billAfterDel.status, 'PAID', 'Bill should be PAID');

  const orderAfterDel = getOrder(deliveryOrder.id);
  assert.strictEqual(orderAfterDel.status, 'CLOSED', 'Order should be CLOSED');
  console.log('✅ Customer Delivery Passed');

  // =========================================================================
  // TEST H: REGRESSION - OFFLINE TAKEAWAY
  // =========================================================================
  console.log('\nTest H: Regression - Offline Takeaway (Stage 4)');
  store.dispatch(createTakeawayOrder('OFFLINE', 'Bob', '1111111111', '', cart1, cashierId, 'CUSTOMER_PICKUP', null));
  const offOrder = getState().orders.data[getState().orders.data.length - 1];
  const offKOT = getKOT(offOrder.id);
  store.dispatch(startKOTPreparation(offKOT.id, kitchenId));
  offKOT.items.forEach(item => store.dispatch(markItemReady(offKOT.id, item.id, kitchenId)));
  store.dispatch(handoverTakeawayOrder(offOrder.id, cashierId));
  const offBill = getBill(offOrder.id);
  store.dispatch(recordPayment(offBill.id, 'CASH', offBill.grandTotal, cashierId));
  
  assert.strictEqual(getOrder(offOrder.id).status, 'CLOSED');
  console.log('✅ Regression Offline Takeaway Passed');

  // =========================================================================
  // TEST I: REGRESSION - DINE IN
  // =========================================================================
  console.log('\nTest I: Regression - Dine In (Stage 3)');
  const tableId = 't-1';
  store.dispatch(sendOrderToKOT(tableId, waiterId, cart1));
  const dineInOrder = getState().orders.data[getState().orders.data.length - 1];
  const dineInKOT = getKOT(dineInOrder.id);
  
  store.dispatch(startKOTPreparation(dineInKOT.id, kitchenId));
  dineInKOT.items.forEach(item => store.dispatch(markItemReady(dineInKOT.id, item.id, kitchenId)));
  
  dineInKOT.items.forEach(item => {
    store.dispatch(pickupItem(dineInOrder.id, item.orderItemId, waiterId));
    store.dispatch(serveItem(dineInOrder.id, item.orderItemId, waiterId));
  });

  store.dispatch(completeOrder(dineInOrder.id, waiterId));
  const dineInBill = getBill(dineInOrder.id);
  store.dispatch(recordPayment(dineInBill.id, 'UPI', dineInBill.grandTotal, cashierId));

  assert.strictEqual(getOrder(dineInOrder.id).status, 'CLOSED');
  console.log('✅ Regression Dine In Passed');

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED 🎉');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
