# Test & Security Strategy

This document defines the testing pyramid, tools, and pass criteria for the **Restaurant Management System (Restaurant OS)**, ensuring security, correctness, and reliability of the codebase.

---

## 1. Testing Pyramid Layers

| Layer | Purpose | Scope | Preferred Tool | Run Frequency | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Unit Tests** | Verify correctness of individual functions (e.g. currency formatting, date parsing, utility helpers). | Pure JS/TS functions, isolated components. | Jest | Commit & PR | 100% pass rate, >90% coverage |
| **2. Service Tests** | Validate complex business calculations (taxes, stock ledger deltas, stock variances). | Service modules, mock databases. | Jest | Commit & PR | 100% pass rate |
| **3. API Tests** | Validate request parsing, schema compliance, validation failures, and response structure. | Fastify routing endpoints, auth middleware. | Jest + Supertest | Commit & PR | 100% pass rate |
| **4. Integration Tests** | Validate database transaction execution and rollback on failures. | Backend + PostgreSQL test database container. | Jest + Testcontainers | PR & Nightly | 100% pass rate |
| **5. E2E Tests** | Validate complete user workflows from user click to database write. | Frontend + Backend API + DB. | Playwright | Nightly & Release | No console warnings or failures |
| **6. Security Tests** | Check for API resource exhaustion, validation injection, and dependency CVEs. | Running app APIs. | OWASP ZAP, safety, npm audit | Weekly & Release | No High/Medium vulnerability |
| **7. Performance Tests** | Test response times under load (e.g., 50 waiters writing KOTs simultaneously). | Order placement and billing APIs. | Locust / k6 | Release | p95 latency < 200ms |
| **8. Regression Tests**| Verify new changes do not break existing configurations or billing histories. | Automated billing suites. | Jest | PR & Release | 100% pass rate |
| **9. Visual UI Tests** | Validate layout alignment, premium aesthetics, alerts, and charts. | UI Pages. | Playwright Screenshots | Release | Zero component mismatches |
| **10. Smoke Tests** | Verify live server health check and network connectivity. | Staging / Production environment. | curl / light scripts | Post-Deployment | 200 OK responses |

---

## 2. Critical End-to-End Business Flow Scenarios

### Flow A: INVENTORY LIFE CYCLE
1. **Purchase Order (PO):** Inventory Manager creates a PO (`DRAFT` -> `SENT`).
2. **Goods Receipt Note (GRN):** Supplier delivers goods; GRN is created in `PENDING` status.
3. **Receipt Confirmation:** Items are checked, accepted quantities recorded, and the GRN is marked as `CONFIRMED`.
4. **Stock Update:** The system increases cached quantities in the `stock` table.
5. **Ledger Registry:** An immutable `STOCK_IN` record is written to `stock_ledger` detailing quantities, rates, and values.
6. **Analytics Refresh:** The GM dashboard recalculates Today's Purchases and updates inventory charts.

### Flow B: STOCK ADJUSTMENT
1. **Physical Audit:** Inventory Manager conducts a physical count of ingredients.
2. **Stock Count Entry:** Manager records physical quantities (`stock_counts` table).
3. **Variance Evaluation:** The system computes the variance:
   $$\text{Variance} = \text{Physical Qty} - \text{System Qty}$$
4. **Approval Request:** If the variance exceeds 5% or a set amount, a GM approval request is generated.
5. **Transaction Execution:** GM confirms the adjustment. The system updates the cached stock quantity, registers a `STOCK_IN` or `STOCK_OUT` entry in `stock_ledger`, and updates reports.

### Flow C: RESTAURANT OPERATIONS & BILLING
1. **Order Initiation:** Waiter seats customers at Table 05, creating an order (`IN_PROGRESS`). Table 05 status transitions to `OCCUPIED`.
2. **KOT Generation:** Waiter sends ordered items to KOT. The kitchen screen receives a sound notification and renders a new ticket.
3. **Preparation & Completion:** Kitchen transitions items (`NEW` -> `PREPARING` -> `READY`).
4. **Fulfillment Confirmation:** Waiter picks up food and marks it as `SERVED`.
5. **Bill Generation:** Waiter requests the bill. The system creates a bill, calculates subtotal, tax amount, and total, and changes the order status to `BILL_REQUESTED`.
6. **Payment Settlement:** Cashier receives UPI payment, records payment details, marks the bill as `PAID`, order as `CLOSED`, and Table 05 transitions back to `AVAILABLE`.

### Flow D: TAKEAWAY & DELIVERY fulfillments
1. **Takeaway Placement:** Cashier records customer takeaway order and marks payment preference.
2. **Delivery Driver Assignment:** Cashier flags the order for delivery and assigns it to a Delivery Person.
3. **Fulfillment Cycle:** Delivery Person receives a push notification, picks up the order, marks it as `OUT_FOR_DELIVERY`, and subsequently `DELIVERED` upon completion.
