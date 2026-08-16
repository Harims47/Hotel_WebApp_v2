# Stage 6: GM Operations Command Center

Implement a comprehensive, read-only operational dashboard for the General Manager to monitor the entire restaurant's real-time state.

## Proposed Changes

### 1. Unified Metrics Aggregation
We will update `GMDashboard.jsx` to fetch state from all primary Redux slices:
- `orders.data`: To track active (IN_PROGRESS) orders segmented by `DINE_IN` and `TAKEAWAY` (`CUSTOMER_PICKUP` vs `DELIVERY`).
- `kot.data`: To monitor kitchen load (NEW, PREPARING, READY items).
- `tables.data`: To show live occupancy and table statuses.
- `delivery.data`: To track out-for-delivery vs pending assignments.
- `billing.data` & `payments.data`: To compute Today's Revenue and Pending Collections.
- `audit.data`: To display a live "Recent Activity" feed of restaurant events (orders created, payments received).

### 2. Dashboard Layout & Aesthetics
The GM Dashboard will be redesigned to feel like a premium "Command Center". We will employ:
- **Top Row (Hero Metrics):** High-level KPIs like Today's Revenue, Total Active Orders, Occupied Tables, and Pending Deliveries using distinct iconography and visual emphasis.
- **Middle Section (Operational Grid):** 
  - **Kitchen & Fulfillment:** Donut/Bar visualizations or clean stat blocks showing KOTs by status (New, Preparing) and Deliveries by status (Assigned, Out).
  - **Tables Overview:** A condensed map or list showing which tables are occupied and for how long (or active order value).
- **Bottom/Sidebar Section (Live Feed):** A scrolling list of the latest `audit` logs indicating who did what, providing immediate operational awareness without needing to switch tabs.

### 3. Target Files
#### [MODIFY] [GMDashboard.jsx](file:///C:/Users/admin/Documents/.cache/.data/.res/src/pages/gm/GMDashboard.jsx)
Completely rewrite the component to subscribe to all relevant Redux slices, compute the aggregate metrics, and render the premium dashboard layout using our existing UI components (Cards, Badges, etc.) supplemented by clear visual hierarchies.

# Stage 7 Implementation Plan: Super Admin & Restaurant Configuration

## Goal
Implement the Super Admin configuration area for the Restaurant Management System V1. The objective is to allow the `SUPER_ADMIN` to configure the restaurant's operational master data (Users, Tables, Menu, Tax, Payment Methods) and have the existing Waiter, KOT, Cashier, Delivery, and GM workflows use that configuration dynamically, while strictly maintaining the immutability of historical transactions.

## User Review Required
> [!IMPORTANT]
> The seed data currently does not have `configStatus` for tables, `paymentMethods` settings, or email/GST for the restaurant. We will initialize these in Redux during the first load so as not to break existing data structure. 
> Please review the proposed changes below and click **Proceed** to approve.

## Proposed Changes

### Redux State Enhancements
- **`src/features/restaurant/restaurantSlice.js`**
  - Add reducers: `updateRestaurantProfile`, `updateTaxSettings`, `updatePaymentMethods`.
  - Default payment methods to `{ CASH: true, UPI: true }` if missing.
- **`src/features/users/usersSlice.js`**
  - Add reducers: `createUser`, `updateUser`, `updateUserStatus` (ACTIVE/INACTIVE), `updateUserRole`.
- **`src/features/tables/tablesSlice.js`**
  - Add reducers: `createTable`, `updateTable`, `updateTableConfigStatus` (ACTIVE/INACTIVE). 
  - Ensure that runtime `status` (AVAILABLE/OCCUPIED) remains untouched by configuration actions.
- **`src/features/menu/menuSlice.js`**
  - Add reducers for `categories`: `createCategory`, `updateCategory`, `updateCategoryStatus`.
  - Add reducers for `items`: `createMenuItem`, `updateMenuItem`, `updateMenuItemStatus`.
- **`src/features/audit/auditSlice.js`**
  - All admin configuration updates will be logged to this slice using the existing format.

### Application Routing & Layout
- **`src/app/router/index.jsx`**
  - Register `/admin/*` routes wrapped in `RoleProtectedRoute` restricted to `SUPER_ADMIN`.
- **`src/components/layout/Sidebar.jsx`**
  - Add the Super Admin sidebar section containing: Dashboard, Tables, Menu, Users, Restaurant, Tax & Billing, Payment Methods.

### Super Admin Pages
- **`[NEW] src/pages/admin/AdminDashboard.jsx`**: Dashboard showing simple real-time configuration metrics (counts of active users, tables, items, tax %, etc.).
- **`[NEW] src/pages/admin/AdminRestaurant.jsx`**: Form for Restaurant Name, Address, Phone, Email, GST Number.
- **`[NEW] src/pages/admin/AdminUsers.jsx`**: List users. Form to create/edit users, change roles, and deactivate/activate.
- **`[NEW] src/pages/admin/AdminTables.jsx`**: List tables. Form to create/edit tables and change `configStatus` without affecting runtime status.
- **`[NEW] src/pages/admin/AdminMenu.jsx`**: Manage categories and items. Allow price changes and status toggles. Confirmation modals for deactivations.
- **`[NEW] src/pages/admin/AdminTax.jsx`**: Form to configure Tax percentage and toggle it on/off.
- **`[NEW] src/pages/admin/AdminPayments.jsx`**: Checkboxes/toggles to enable or disable `CASH` and `UPI`.

### Workflow Integration (Historical Immutability)
- **Waiter & Takeaway Workflows (`src/pages/waiter/WaiterTables.jsx`, `src/pages/waiter/WaiterMenu.jsx`)**: 
  - Filter out tables where `configStatus === 'INACTIVE'`.
  - Filter out menu categories/items where `status !== 'ACTIVE'`. 
  - Price changes naturally only affect new order items because the `createOrder` logic snapshots `unitPrice`.
- **Cashier Workflow (`src/features/workflows/cashierWorkflow.js`)**: 
  - Modify `createBill` to read the current tax percentage from `state.restaurant.data.settings`. Historical bills will retain their original `taxAmount` since they were snapshotted at creation.
- **Payment Screens (`src/components/billing/PaymentModal.jsx`, etc.)**:
  - Read `restaurant.settings.paymentMethods` to conditionally render `CASH` and `UPI` options.

## Verification Plan

### Manual Verification
1. Log in as `superadmin` / `123456`.
2. Modify menu price (e.g., Chicken Biryani ₹220 → ₹250).
3. Deactivate a table (e.g., T12).
4. Update Tax to 8% and disable UPI payment.
5. Log out and log in as `waiter1`.
6. Verify T12 is unavailable for new orders.
7. Verify Chicken Biryani is ₹250 for new orders, but existing orders retain ₹220.
8. Create a new bill and verify tax is 8%.
9. Attempt payment and verify UPI is hidden for new payments.
