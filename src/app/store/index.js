import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../services/persistence/localStorage';

import authReducer from '../../features/auth/authSlice';
import restaurantReducer from '../../features/restaurant/restaurantSlice';
import usersReducer from '../../features/users/usersSlice';
import tablesReducer from '../../features/tables/tablesSlice';
import menuReducer from '../../features/menu/menuSlice';
import ordersReducer from '../../features/orders/ordersSlice';
import kotReducer from '../../features/kot/kotSlice';
import billingReducer from '../../features/billing/billingSlice';
import paymentsReducer from '../../features/payments/paymentsSlice';
import customersReducer from '../../features/customers/customersSlice';
import deliveryReducer from '../../features/delivery/deliverySlice';
import notificationsReducer from '../../features/notifications/notificationsSlice';
import auditReducer from '../../features/audit/auditSlice';
import purchaseOrdersReducer from '../../features/inventory/purchaseOrdersSlice';
import grnReducer from '../../features/inventory/grnSlice';
import stockLedgerReducer from '../../features/inventory/stockLedgerSlice';
import issueReducer from '../../features/inventory/issueSlice';
import wasteReducer from '../../features/inventory/wasteSlice';
import transferReducer from '../../features/inventory/transferSlice';
import adjustmentReducer from '../../features/inventory/adjustmentSlice';
import stockCountReducer from '../../features/inventory/stockCountSlice';
import reimbursementsReducer from '../../features/inventory/reimbursementSlice';
import { 
  invCategoriesReducer, 
  invUomReducer, 
  invLocationsReducer, 
  invSuppliersReducer, 
  invItemsReducer,
  invStockReducer
} from '../../features/inventory/inventorySlices';

// A modified loadState that injects initial states for new modules
const { _version, ...rawPreloadedState } = loadState();
const preloadedState = {
  ...rawPreloadedState,
  invStock: rawPreloadedState.invStock || { data: [] },
  purchaseOrders: rawPreloadedState.purchaseOrders || { data: [] },
  grn: rawPreloadedState.grn || { data: [] },
  stockLedger: rawPreloadedState.stockLedger || { data: [] },
  invIssues: rawPreloadedState.invIssues || { data: [] },
  invWaste: rawPreloadedState.invWaste || { data: [] },
  invTransfers: rawPreloadedState.invTransfers || { data: [] },
  invAdjustments: rawPreloadedState.invAdjustments || { data: [] },
  invStockCounts: rawPreloadedState.invStockCounts || { data: [] },
  reimbursements: rawPreloadedState.reimbursements || { data: [] },
};

const appReducer = combineReducers({
  auth: authReducer,
  restaurant: restaurantReducer,
  users: usersReducer,
  tables: tablesReducer,
  menu: menuReducer,
  orders: ordersReducer,
  kot: kotReducer,
  billing: billingReducer,
  payments: paymentsReducer,
  customers: customersReducer,
  delivery: deliveryReducer,
  notifications: notificationsReducer,
  audit: auditReducer,
  invCategories: invCategoriesReducer,
  invUom: invUomReducer,
  invLocations: invLocationsReducer,
  invSuppliers: invSuppliersReducer,
  invItems: invItemsReducer,
  invStock: invStockReducer,
  purchaseOrders: purchaseOrdersReducer,
  grn: grnReducer,
  stockLedger: stockLedgerReducer,
  invIssues: issueReducer,
  invWaste: wasteReducer,
  invTransfers: transferReducer,
  invAdjustments: adjustmentReducer,
  invStockCounts: stockCountReducer,
  reimbursements: reimbursementsReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'HYDRATE_STATE') {
    return {
      ...state,
      ...action.payload,
    };
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
});

// Setup cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === 'restaurant_os_v1_state') {
    try {
      const newState = JSON.parse(e.newValue);
      if (newState) {
        // Remove version before hydrating to avoid mismatch
        const { _version, ...stateWithoutVersion } = newState;
        store.dispatch({ type: 'HYDRATE_STATE', payload: stateWithoutVersion });
      }
    } catch (err) {
      console.error('Failed to sync state across tabs:', err);
    }
  }
});

let isSaving = false;

store.subscribe(() => {
  if (isSaving) return;
  isSaving = true;
  
  saveState({
    auth: store.getState().auth,
    restaurant: store.getState().restaurant,
    users: store.getState().users,
    tables: store.getState().tables,
    menu: store.getState().menu,
    orders: store.getState().orders,
    kot: store.getState().kot,
    billing: store.getState().billing,
    payments: store.getState().payments,
    customers: store.getState().customers,
    delivery: store.getState().delivery,
    notifications: store.getState().notifications,
    audit: store.getState().audit,
    invCategories: store.getState().invCategories,
    invUom: store.getState().invUom,
    invLocations: store.getState().invLocations,
    invSuppliers: store.getState().invSuppliers,
    invItems: store.getState().invItems,
    invStock: store.getState().invStock,
    purchaseOrders: store.getState().purchaseOrders,
    grn: store.getState().grn,
    stockLedger: store.getState().stockLedger,
    invIssues: store.getState().invIssues,
    invWaste: store.getState().invWaste,
    invTransfers: store.getState().invTransfers,
    invAdjustments: store.getState().invAdjustments,
    invStockCounts: store.getState().invStockCounts,
    reimbursements: store.getState().reimbursements,
  });
  
  // setTimeout to allow event loop to breathe if multiple syncs happen
  setTimeout(() => { isSaving = false; }, 100);
});
