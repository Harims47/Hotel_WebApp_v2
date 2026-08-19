# Delivery API Specification

This document details the API endpoints for order delivery management.

---

## 1. Delivery Workflow States

Deliveries progress linearly through the following operational states:
$$\text{PENDING} \xrightarrow{\text{Assign Driver}} \text{ASSIGNED} \xrightarrow{\text{Kitchen Handover}} \text{PICKED\_UP} \xrightarrow{\text{Transit}} \text{OUT\_FOR\_DELIVERY} \xrightarrow{\text{Drop Off}} \text{DELIVERED}$$

---

## 2. API Endpoints

### A. POST /deliveries/{id}/assign
- **Purpose:** Assign a delivery driver to a pending delivery order.
- **Permission:** `delivery:assign` (Restricted to `CASHIER` and `GM` roles)
- **Request Payload:**
```json
{
  "assigned_delivery_user_id": "usr-uuid-7"
}
```
- **Response (200 OK):** Updates status to `ASSIGNED`.
- **Transaction Boundary:** Creates status history entry.
- **Notification Event:** Dispatches `DELIVERY_ASSIGNED` event to the driver.

### B. PATCH /deliveries/{id}/status (Update Delivery State)
- **Purpose:** Transition delivery through stages (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED).
- **Permission:** `delivery:update` (Restricted to the assigned `DELIVERY_BOY` or `GM` roles)
- **Request Payload:**
```json
{
  "status": "OUT_FOR_DELIVERY",
  "remarks": "Leaving branch"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "delivery_id": "del-uuid-1",
    "status": "OUT_FOR_DELIVERY",
    "updated_at": "2026-08-19T10:20:00Z"
  },
  "message": "Delivery status updated",
  "meta": null
}
```
- **Business Validation:**
  - Verify that the requesting user's ID matches the delivery record's `assigned_delivery_user_id` (preventing drivers from hijacking each other's deliveries).
  - Verify that the target status is a valid next state in the state progression.
- **Transaction Boundary:**
  - Updates the `status` in the `deliveries` table.
  - Appends a status tracking entry to the `delivery_status_history` table.
  - If status transitions to `DELIVERED`:
    - **Prepaid Flow:** If the associated bill is already `PAID`, updates the `orders.status` to `CLOSED`.
    - **Cash on Delivery (COD) Flow:** The order remains open with delivery status `DELIVERED`. The order is only updated to `CLOSED` after the delivery payment is explicitly settled and recorded via the payment API.
- **Audit Event:** Logs `DELIVERY_STATUS_CHANGED`.
- **Idempotency:** Replayed requests check if the target status matches the current status and return success immediately if they match.
