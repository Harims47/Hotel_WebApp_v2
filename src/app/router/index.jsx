import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Login } from '../../pages/login';

// Dashboards & Waiter
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { GMDashboard } from '../../pages/gm/GMDashboard';
import { GMOrders } from '../../pages/gm/GMOrders';
import { GMKOT } from '../../pages/gm/GMKOT';
import { GMTables } from '../../pages/gm/GMTables';
import { GMBills } from '../../pages/gm/GMBills';
import { GMDelivery } from '../../pages/gm/GMDelivery';
import { WaiterDashboard } from '../../pages/waiter/WaiterDashboard';
import { WaiterTables } from '../../pages/waiter/WaiterTables';
import { WaiterOrderScreen } from '../../pages/waiter/WaiterOrderScreen';
import { WaiterOrders } from '../../pages/waiter/WaiterOrders';
import { WaiterMenu } from '../../pages/waiter/WaiterMenu';
import { WaiterKOT } from '../../pages/waiter/WaiterKOT';

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

// Admin Routes
import { AdminRestaurant } from '../../pages/admin/AdminRestaurant';
import { AdminUsers } from '../../pages/admin/AdminUsers';
import { AdminTables } from '../../pages/admin/AdminTables';
import { AdminMenu } from '../../pages/admin/AdminMenu';
import { AdminTax } from '../../pages/admin/AdminTax';
import { AdminPayments } from '../../pages/admin/AdminPayments';

// Inventory Routes
import { InventoryDashboard } from '../../pages/inventory/InventoryDashboard';
import { ItemsMaster } from '../../pages/inventory/ItemsMaster';
import { CategoriesMaster } from '../../pages/inventory/CategoriesMaster';
import { SuppliersMaster } from '../../pages/inventory/SuppliersMaster';
import { LocationsMaster } from '../../pages/inventory/LocationsMaster';
import { UomMaster } from '../../pages/inventory/UomMaster';
import { LowStock } from '../../pages/inventory/LowStock';
import { PurchaseOrdersList } from '../../pages/inventory/PurchaseOrdersList';
import { PurchaseOrderNew } from '../../pages/inventory/PurchaseOrderNew';
import { PurchaseOrderDetails } from '../../pages/inventory/PurchaseOrderDetails';
import { GRNList } from '../../pages/inventory/GRNList';
import { GRNNew } from '../../pages/inventory/GRNNew';
import { GRNDetails } from '../../pages/inventory/GRNDetails';
import { CurrentStock } from '../../pages/inventory/CurrentStock';
import { StockLedger } from '../../pages/inventory/StockLedger';
import { IssueList } from '../../pages/inventory/IssueList';
import { IssueNew } from '../../pages/inventory/IssueNew';
import { IssueDetails } from '../../pages/inventory/IssueDetails';
import { WasteList } from '../../pages/inventory/WasteList';
import { WasteNew } from '../../pages/inventory/WasteNew';
import { WasteDetails } from '../../pages/inventory/WasteDetails';
import { TransferList } from '../../pages/inventory/TransferList';
import { TransferNew } from '../../pages/inventory/TransferNew';
import { TransferDetails } from '../../pages/inventory/TransferDetails';
import { AdjustmentList } from '../../pages/inventory/AdjustmentList';
import { AdjustmentNew } from '../../pages/inventory/AdjustmentNew';
import { AdjustmentDetails } from '../../pages/inventory/AdjustmentDetails';
import { StockCountList } from '../../pages/inventory/StockCountList';
import { StockCountNew } from '../../pages/inventory/StockCountNew';
import { StockCountDetails } from '../../pages/inventory/StockCountDetails';
import { InventoryAlerts } from '../../pages/inventory/InventoryAlerts';
import { StockValuation } from '../../pages/inventory/StockValuation';
import { InventoryReports } from '../../pages/inventory/InventoryReports';
import { ReimbursementList } from '../../pages/inventory/ReimbursementList';
import { ReimbursementNew } from '../../pages/inventory/ReimbursementNew';
import { ReimbursementDetails } from '../../pages/inventory/ReimbursementDetails';

// Management Routes
import { ManagementDashboard } from '../../pages/management/ManagementDashboard';
import { ManagementReports } from '../../pages/management/ManagementReports';

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
      { path: 'admin/restaurant', element: <AdminRestaurant /> },
      { path: 'admin/users', element: <AdminUsers /> },
      { path: 'admin/tables', element: <AdminTables /> },
      { path: 'admin/menu', element: <AdminMenu /> },
      { path: 'admin/settings/tax', element: <AdminTax /> },
      { path: 'admin/settings/payment-methods', element: <AdminPayments /> },
      
      // GM Routes
      { path: 'gm/dashboard', element: <GMDashboard /> },
      { path: 'gm/orders', element: <GMOrders /> },
      { path: 'gm/kot', element: <GMKOT /> },
      { path: 'gm/tables', element: <GMTables /> },
      { path: 'gm/bills', element: <GMBills /> },
      { path: 'gm/delivery', element: <GMDelivery /> },
      
      // Waiter Routes
      { path: 'waiter/dashboard', element: <Navigate to="/waiter/tables" replace /> },
      { path: 'waiter/tables', element: <WaiterTables /> },
      { path: 'waiter/tables/:tableId', element: <WaiterOrderScreen /> },
      { path: 'waiter/menu', element: <WaiterMenu /> },
      { path: 'waiter/orders', element: <WaiterOrders /> },
      { path: 'waiter/kot', element: <WaiterKOT /> },
      
      // KOT Routes
      { path: 'kot/dashboard', element: <KOTDashboard /> },
      { path: 'kot/orders', element: <KOTNewOrders /> },
      { path: 'kot/preparing', element: <KOTPreparing /> },
      { path: 'kot/ready', element: <KOTReady /> },
      { path: 'kot/completed', element: <KOTCompleted /> },
      
      // Cashier Routes
      { path: 'cashier/dashboard', element: <Navigate to="/cashier/bills" replace /> },
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
      
      // Inventory Routes
      { path: 'inventory/dashboard', element: <InventoryDashboard /> },
      { path: 'inventory/items', element: <ItemsMaster /> },
      { path: 'inventory/categories', element: <CategoriesMaster /> },
      { path: 'inventory/suppliers', element: <SuppliersMaster /> },
      { path: 'inventory/locations', element: <LocationsMaster /> },
      { path: 'inventory/uom', element: <UomMaster /> },
      { path: 'inventory/low-stock', element: <LowStock /> },
      { path: 'inventory/purchase-orders', element: <PurchaseOrdersList /> },
      { path: 'inventory/purchase-orders/new', element: <PurchaseOrderNew /> },
      { path: 'inventory/purchase-orders/:poId', element: <PurchaseOrderDetails /> },
      { path: 'inventory/grn', element: <GRNList /> },
      { path: 'inventory/grn/new', element: <GRNNew /> },
      { path: 'inventory/grn/:grnId', element: <GRNDetails /> },
      { path: 'inventory/stock', element: <CurrentStock /> },
      { path: 'inventory/stock-ledger', element: <StockLedger /> },
      
      { path: 'inventory/issues', element: <IssueList /> },
      { path: 'inventory/issues/new', element: <IssueNew /> },
      { path: 'inventory/issues/:issueId', element: <IssueDetails /> },
      
      { path: 'inventory/waste', element: <WasteList /> },
      { path: 'inventory/waste/new', element: <WasteNew /> },
      { path: 'inventory/waste/:wasteId', element: <WasteDetails /> },
      
      { path: 'inventory/transfers', element: <TransferList /> },
      { path: 'inventory/transfers/new', element: <TransferNew /> },
      { path: 'inventory/transfers/:transferId', element: <TransferDetails /> },
      
      { path: 'inventory/adjustments', element: <AdjustmentList /> },
      { path: 'inventory/adjustments/new', element: <AdjustmentNew /> },
      { path: 'inventory/adjustments/:adjustmentId', element: <AdjustmentDetails /> },
      { path: 'inventory/stock-counts', element: <StockCountList /> },
      { path: 'inventory/stock-counts/new', element: <StockCountNew /> },
      { path: 'inventory/stock-counts/:countId', element: <StockCountDetails /> },
      { path: 'inventory/alerts', element: <InventoryAlerts /> },
      { path: 'inventory/valuation', element: <StockValuation /> },
      { path: 'inventory/reports', element: <InventoryReports /> },
      { path: 'inventory/reimbursements', element: <ReimbursementList /> },
      { path: 'inventory/reimbursements/new', element: <ReimbursementNew /> },
      { path: 'inventory/reimbursements/:id', element: <ReimbursementDetails /> },
      
      // Management Routes
      { path: 'management/dashboard', element: <ManagementDashboard /> },
      { path: 'management/reports', element: <ManagementReports /> },
      
      // Catch-all
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
