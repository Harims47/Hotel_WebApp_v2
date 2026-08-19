# Billing & Payments API Specification

This document outlines the API contracts for invoice generation, discounting, tax calculations, and payment settlements.

---

## 1. Endpoints & Schema Specifications

### A. POST /bills (Request Bill Generation)
- **Purpose:** Freeze order items and calculate totals.
- **Permission:** `bill:create` (Waiters, Cashiers, GMs)
- **Request Payload:**
```json
{
  "order_id": "ord-uuid-1"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "bill-uuid-1",
    "bill_number": "BILL-1001",
    "subtotal": 440.00,
    "tax_rate": 5.00,
    "tax_amount": 22.00,
    "discount_amount": 0.00,
    "grand_total": 462.00,
    "status": "REQUESTED"
  },
  "message": "Bill generated successfully",
  "meta": null
}
```
- **Business Validation:**
  - Verify that the order status is `IN_PROGRESS`.
  - Check that no other active bill exists for this order.
- **Transaction Boundary:**
  - Creates parent `bills` and populates child `bill_items` by taking snapshots of active order items.
  - Updates order status to `BILL_REQUESTED`.
- **Notification Event:** Dispatches `BILL_REQUESTED` notification to cashiers.
- **Idempotency:** Replayed requests return the existing bill record.

### B. PATCH /bills/{id}/adjustments (Apply Discount/Overrides)
- **Purpose:** Apply discounts and override rates.
- **Permission:** `bill:update` (Restricted to `CASHIER` and `GM` roles)
- **Request Payload:**
```json
{
  "discount_percentage": 10.00,
  "discount_reason": "Regular Customer",
  "items": [
    {
      "bill_item_id": "bi-uuid-1",
      "bill_rate": 200.00
    }
  ]
}
```
- **Response (200 OK):** Recalculated bill totals.
- **Business Validation:**
  - Bill status must not be `PAID`.
  - Disallows discounts exceeding 100% or driving totals negative.
- **Audit Event:** Logs `BILL_DISCOUNT_APPLIED` and `BILL_ITEM_RATE_CHANGED` along with the reason.

### C. POST /bills/{id}/print
- **Purpose:** Update status to printed for auditing.
- **Permission:** `bill:update` (Cashiers, Waiters)
- **Response (200 OK):** Updates bill status to `PRINTED`.
- **Audit Event:** Logs `BILL_PRINTED`.

### D. POST /bills/{id}/payments
- **Purpose:** Record payment and close the transaction.
- **Permission:** `payment:create` (Restricted to `CASHIER` role)
- **Request Payload:**
```json
{
  "payment_method": "UPI",
  "amount_paid": 462.00,
  "payment_reference": "TXN987654321"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payment_id": "pay-uuid-1",
    "payment_number": "PAY-1001",
    "status": "PAID"
  },
  "message": "Payment recorded; order closed",
  "meta": null
}
```
- **Business Validation:**
  - Verify that the bill status is `REQUESTED` or `PRINTED` (never `PAID` or `CANCELLED`).
  - Verify that `amount_paid` matches the bill's outstanding balance:
    $$\text{amount\_paid} = \text{grand\_total} - \sum \text{previous\_payments}$$
- **Transaction Boundary:**
  - Creates the `payments` record.
  - Updates the `bills` status to `PAID`.
  - Updates the associated `orders` status to `CLOSED`.
  - Releases the dine-in table status to `AVAILABLE`.
- **Audit Event:** Logs `PAYMENT_RECEIVED` and `ORDER_CLOSED`.
- **Idempotency Strategy:**
  - **HTTP Request Protection:** Client must supply an `Idempotency-Key` header. If a network retry occurs with the same key, the server returns the cached payment response without executing a new transaction.
  - **Business Transaction Protection:** The database enforces a `UNIQUE` constraint on the `payment_reference` field. If a cashier attempts to record a different payment request carrying an already-settled transaction reference, the database raises an integrity violation and rejects the request with HTTP 409 Conflict.
