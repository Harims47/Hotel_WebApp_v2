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

## Open Questions

> [!IMPORTANT]
> The GM Dashboard is read-only. Should clicking on any of the metrics (e.g., "3 Pending Deliveries") navigate the GM to a detailed list view (e.g., `/gm/orders` or a specific delivery view), or should the dashboard purely be a single-page overview with no drill-down navigation for V1?

> [!TIP]
> Do you have a preference for the visual theme of the GM Command Center? We can make it a sleek "Dark Mode" specialized view to distinguish it from the operational (cashier/waiter) screens, or stick to the existing clean light theme.

## Verification Plan
1. Authenticate as GM (`gm` / `123456`).
2. Verify all metric blocks accurately reflect the seeded/existing Redux state without errors.
3. Perform operational tasks in a Cashier/Waiter session (e.g., complete an order), manually refresh the GM Dashboard, and verify the Today's Revenue and Active Order counts update correctly.
