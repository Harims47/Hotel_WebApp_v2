import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Login } from '../../pages/login';

// Dashboards & Waiter
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { GMDashboard } from '../../pages/gm/GMDashboard';
import { WaiterDashboard } from '../../pages/waiter/WaiterDashboard';
import { WaiterTables } from '../../pages/waiter/WaiterTables';
import { WaiterOrderScreen } from '../../pages/waiter/WaiterOrderScreen';
import { WaiterOrders } from '../../pages/waiter/WaiterOrders';

// KOT
import { KOTDashboard } from '../../pages/kot/KOTDashboard';
import { KOTNewOrders, KOTPreparing, KOTReady, KOTCompleted } from '../../pages/kot/KOTScreens';

import { CashierDashboard } from '../../pages/cashier/CashierDashboard';
import { CashierBills } from '../../pages/cashier/CashierBills';
import { CashierBillDetails } from '../../pages/cashier/CashierBillDetails';
import { CashierPayments } from '../../pages/cashier/CashierPayments';
import { CashierTakeaway } from '../../pages/cashier/CashierTakeaway';
import { NewTakeawayOrder } from '../../pages/cashier/NewTakeawayOrder';
import { CashierDelivery } from '../../pages/cashier/CashierDelivery';
import { DeliveryDashboard } from '../../pages/delivery/DeliveryDashboard';
import { DeliveryOrders } from '../../pages/delivery/DeliveryOrders';
import { DeliveryOrderDetails } from '../../pages/delivery/DeliveryOrderDetails';

// Placeholders for other routes so there are no broken links in Sidebar
const Placeholder = ({ title }) => <div className="p-6 text-text-main font-semibold text-xl">{title} Placeholder</div>;

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      
      // Admin Routes
      { path: 'admin/dashboard', element: <AdminDashboard /> },
      { path: 'admin/users', element: <Placeholder title="Admin Users" /> },
      { path: 'admin/tables', element: <Placeholder title="Admin Tables" /> },
      { path: 'admin/menu', element: <Placeholder title="Admin Menu" /> },
      { path: 'admin/orders', element: <Placeholder title="Admin Orders" /> },
      { path: 'admin/kot', element: <Placeholder title="Admin KOT" /> },
      
      // GM Routes
      { path: 'gm/dashboard', element: <GMDashboard /> },
      { path: 'gm/orders', element: <Placeholder title="GM Orders" /> },
      { path: 'gm/kot', element: <Placeholder title="GM KOT" /> },
      { path: 'gm/tables', element: <Placeholder title="GM Tables" /> },
      
      // Waiter Routes
      { path: 'waiter/dashboard', element: <WaiterDashboard /> },
      { path: 'waiter/tables', element: <WaiterTables /> },
      { path: 'waiter/tables/:tableId', element: <WaiterOrderScreen /> },
      { path: 'waiter/menu', element: <Navigate to="/waiter/tables" replace /> },
      { path: 'waiter/orders', element: <WaiterOrders /> },
      
      // KOT Routes
      { path: 'kot/dashboard', element: <KOTDashboard /> },
      { path: 'kot/orders', element: <KOTNewOrders /> },
      { path: 'kot/preparing', element: <KOTPreparing /> },
      { path: 'kot/ready', element: <KOTReady /> },
      { path: 'kot/completed', element: <KOTCompleted /> },
      
      // Cashier Routes
      { path: 'cashier/dashboard', element: <CashierDashboard /> },
      { path: 'cashier/bills', element: <CashierBills /> },
      { path: 'cashier/bills/:billId', element: <CashierBillDetails /> },
      { path: 'cashier/payments', element: <CashierPayments /> },
      { path: 'cashier/takeaway', element: <CashierTakeaway /> },
      { path: 'cashier/takeaway/new', element: <NewTakeawayOrder /> },
      { path: 'cashier/delivery', element: <CashierDelivery /> },
      
      // Delivery Routes
      { path: 'delivery/dashboard', element: <DeliveryDashboard /> },
      { path: 'delivery/orders', element: <DeliveryOrders /> },
      { path: 'delivery/orders/:id', element: <DeliveryOrderDetails /> },
      
      // Catch-all
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
