import { configureStore } from '@reduxjs/toolkit';
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

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
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
  },
  preloadedState,
});

store.subscribe(() => {
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
  });
});
