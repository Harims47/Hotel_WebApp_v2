# Business Rules & Invariants

This document specifies the critical business logic constraints and invariants that must be enforced by the backend database constraints and service layers of the **Restaurant Management System**. These rules are absolute and must never be bypassed by any operational workflow.

---

## 1. Inventory & Stock Ledger Invariants

### Rule 1: Prevent Negative Stock Balance
- **Invariant:** Physical stock quantities in the `stock` table must never fall below zero (`quantity >= 0.0`).
- **Enforcement:**
  - Database table constraint: `ALTER TABLE stock ADD CONSTRAINT chk_stock_qty_non_negative CHECK (quantity >= 0.0);`
  - In addition, the service layer must perform lock-backed checks before deducting quantities.

### Rule 2: Stock Transfer Balance
- **Invariant:** A stock transfer between locations must balance out completely.
- **Equation:**
  $$\text{Source Stock}_{\text{new}} = \text{Source Stock}_{\text{old}} - Qty$$
  $$\text{Destination Stock}_{\text{new}} = \text{Destination Stock}_{\text{old}} + Qty$$
- **Enforcement:** Executed within a single SQL transaction block. If either the subtraction or addition fails, the entire transfer rolls back.

### Rule 3: Stock Adjustment & Variance Calculations
- **Invariants:**
  - **Difference Equation:**
    $$\text{Difference} = \text{Physical Qty} - \text{System Qty}$$
  - **Variance Value Equation:**
    $$\text{Variance Value} = \text{AbsoluteValue}(\text{Difference}) \times \text{Current Rate}$$
- **Enforcement:** Computed server-side at the time of adjustment confirmation. The `current_rate` is snapshot from the `inventory_items` table at that moment.

---

## 4. Restaurant Operations & KOT Workflows

### Rule 4: Table Status Consistency
- **Invariant:** If a dine-in order is `IN_PROGRESS`, the corresponding table status must be `OCCUPIED`. When the order transitions to `CLOSED` or `CANCELLED`, the table status must transition back to `AVAILABLE`.
- **Enforcement:** Service layer automatically handles table state changes within the order state mutation transactions.

### Rule 5: Immutable KOT Records
- **Invariant:** Once a KOT is dispatched, its contents (items and quantities) are fixed. Any addition of items generates a new KOT with a distinct ticket number linked to the same order.
- **Cancellation Rule:** If an item is cancelled after being dispatched, its status in the KOT is marked as `CANCELLED` (it is never deleted from the table).

---

## 5. Billing & Payment Invariants

### Rule 6: No Overpayments
- **Invariant:** The sum of all successful payments associated with a bill must not exceed the bill's grand total.
- **Equation:**
  $$\sum \text{Payment Amount} \le \text{Bill Grand Total}$$
- **Enforcement:** Checked in the database/service layer before committing payments to the ledger.

### Rule 7: Immutability of Closed Bills
- **Invariant:** Once a bill has status `PAID`, no modifications (rate changes, items added, discounts applied) can be made.
- **Enforcement:** Checked via API route policies and database triggers on the `bills` and `bill_items` tables.

---

## 6. Notification De-duplication

### Rule 8: Event Key Constraints
- **Invariant:** Operational events must not trigger multiple duplicate notifications.
- **Enforcement:** Each notification carries a unique `event_key` calculated as:
  $$\text{event\_key} = \text{EventName} + ":" + \text{ResourceId} + ":" + \text{TargetRole}$$
  The `event_key` column is backed by a database-level `UNIQUE` index constraint, raising integrity errors on duplicates.

---

## 7. Observed UI/Demo Contradictions & Recommendations

During our codebase inspection, we identified the following UI/Demo logic assumptions that conflict with production integrity:

1. **Tax Rates in Billing:** In `cashierWorkflow.js`, the tax calculation reads from the current settings slice. If the tax rate changes, the historical bills stored in localstorage are not updated because they were snapshotted. This is correct behavior, but the backend must ensure that the tax rate is explicitly stored as a static field `tax_rate` on the `bills` table to prevent future report desynchronizations.
2. **Stock Adjustments Autoconfirmation:** The frontend prototype allows instant stock counts and adjustments. In a production environment, stock counts and adjustments should go through a "Review -> Confirm/Approve" pipeline to prevent unauthorized changes to inventory.
3. **Local calculations:** The client computes subtotal, tax amount, and grand total. In production, the client should send item IDs and quantities, and the backend must compute all financial totals to ensure correctness.
