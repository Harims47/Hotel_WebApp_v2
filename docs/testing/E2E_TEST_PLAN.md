# End-to-End (E2E) Test Plan & Performance Targets

This document outlines the end-to-end integration test scenarios and performance load targets for **Restaurant OS**.

---

## 1. End-to-End Test Scenarios

These tests run against a fully integrated environment (Frontend + Backend + PostgreSQL Database) using Playwright.

### Scenario A: Dine-In Order-to-Payment Lifecycle
1. **Login:** Waiter A1 logs in. Verify active location is Coimbatore Main.
2. **Select Table:** Waiter selects Table T05. Table status transitions to `OCCUPIED`.
3. **Create Order:** Waiter adds 2x Chicken Biryani, adds note "no mayo", and clicks "Send to Kitchen".
4. **Kitchen Receipt:** Kitchen display receives a sound notification. KOT #101 appears on the board.
5. **Kitchen Start:** Kitchen user clicks start. KOT item status transitions to `PREPARING` and order items status remains `ORDERED`.
6. **Food Ready:** Kitchen user marks items as ready. KOT and order item status transitions to `READY`. Waiter receives a pickup notification.
7. **Serve Food:** Waiter confirms pickup and serves Table T05. KOT and order item status transitions to `SERVED/COMPLETED`.
8. **Billing:** Waiter requests the bill. Bill #1001 is generated with 5% tax. Order status changes to `BILL_REQUESTED`.
9. **Settlement:** Cashier receives payment via UPI, inputs transaction reference, and clicks "Pay".
10. **Close Order:** Bill transitions to `PAID`, Order transitions to `CLOSED`, and Table T05 transitions to `AVAILABLE`.

### Scenario B: Takeaway & Delivery Flow
1. **Placement:** Cashier records a Takeaway order marked for `DELIVERY` fulfillment.
2. **KOT Dispatch:** KOT is dispatched. Kitchen prepares the food and marks it `READY`.
3. **Driver Assignment:** Cashier assigns the order to Delivery Driver D1. Delivery status transitions to `ASSIGNED`.
4. **Transit:** Driver D1 logs in, sees the delivery, and marks it as `PICKED_UP`, then `OUT_FOR_DELIVERY`.
5. **Drop Off:** Driver marks delivery as `DELIVERED`.
   - **Prepaid Delivery Flow:** If the order has been prepaid, the order status changes to `CLOSED`.
   - **Cash on Delivery (COD) Flow:** The order remains open with delivery status `DELIVERED`. The order transitions to `CLOSED` only after payment is recorded by the driver or cashier.

### Scenario C: Inventory Lifecycle
1. **Purchasing:** Inventory Manager creates PO #1001 (`DRAFT` -> `SENT`).
2. **Receipt:** Supplier delivers. Manager generates GRN #1001 in `PENDING` status.
3. **Confirmation:** Manager confirms GRN. The system increments physical `stock` quantities and inserts a `STOCK_IN` record in `stock_ledger` (Immutable Stock Movement Ledger).
4. **Stock Issue:** Manager issues 5kg of flour. System checks quantity, decrements stock, and inserts a `STOCK_OUT` ledger entry.

### Scenario D: Multi-Tenant Boundary Verification
1. **Login:** Waiter A1 (Restaurant A) logs in.
2. **Bypass Attempt:** Waiter A1 tries to directly fetch a bill belonging to Restaurant B (`GET /api/v1/bills/bill-resto-b`).
3. **Assertion:** The server returns `404 Not Found` (hiding the resource).

---

## 2. PROVISIONAL PERFORMANCE TARGETS

The following parameters serve as target benchmarks. The product pipeline will establish final SLAs using a continuous cycle of:
$$\text{Baseline} \rightarrow \text{Load Test} \rightarrow \text{Measure} \rightarrow \text{Optimize} \rightarrow \text{Final SLA}$$

| Endpoint / Operation | Concurrent Users | Target Response Time (p95) | Target Response Time (p99) |
| :--- | :--- | :--- | :--- |
| **POST /auth/login** | 50 | `< 150ms` | `< 300ms` |
| **POST /api/v1/orders** | 100 | `< 100ms` | `< 250ms` |
| **PATCH /api/v1/kots/...**| 100 | `< 80ms` | `< 200ms` |
| **POST /api/v1/bills** | 50 | `< 120ms` | `< 280ms` |
| **POST /api/v1/payments** | 50 | `< 150ms` | `< 350ms` |
| **POST /api/v1/inventory/...**| 20 | `< 180ms` | `< 400ms` |
| **GET /api/v1/reports/...** | 10 | `< 200ms` (dynamic data) | `< 500ms` |
| **WebSocket Broadcast** | 500 connections | `< 50ms` latency | `< 150ms` |

- `[PERFORMANCE TARGET TO CONFIRM]`: **Materialized View Refresh Intervals:** Determine if GMs require real-time reporting metrics or if view refreshes scheduled every 4 hours are acceptable.
- **Connection Pool Policy:** Database connections are pooled using SQLAlchemy `QueuePool` (limit 20 connections, max overflow 10).
- **Index Strategy:** Every filter key used in multi-tenant queries (`restaurant_id`, `location_id`, `created_at`) carries an index.
