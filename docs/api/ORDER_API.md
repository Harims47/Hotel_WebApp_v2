# Orders API Specification

This document details the API contracts for Order management, supporting Dine-In and Takeaway operations.

---

## 1. Endpoints & Schema Specifications

### A. GET /orders
- **Purpose:** List active orders in the resolved location.
- **Permission:** `order:read`
- **Location Scope:** Active location context. GMs query restaurant-wide orders.
- **Request Parameters:**
  - `status` (Optional Query string: `IN_PROGRESS`, `BILL_REQUESTED`, `CLOSED`, `CANCELLED`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ord-uuid-1",
      "order_number": "ORD-1001",
      "order_type": "DINE_IN",
      "table_id": "tbl-uuid-1",
      "waiter_id": "usr-uuid-3",
      "status": "IN_PROGRESS",
      "created_at": "2026-08-19T10:00:00Z"
    }
  ],
  "message": "Orders retrieved",
  "meta": {
    "total_count": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### B. POST /orders
- **Purpose:** Seat customers and initialize an order record.
- **Permission:** `order:create`
- **Location Scope:** Bound to active location context.
- **Request Payload:**
```json
{
  "order_type": "DINE_IN",
  "table_id": "tbl-uuid-1",
  "customer_name": "John Doe",
  "customer_phone": "9876543210"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ord-uuid-1",
    "order_number": "ORD-1001",
    "status": "IN_PROGRESS"
  },
  "message": "Order created",
  "meta": null
}
```
- **Business Validation:** 
  - Verify that the target table's status is `AVAILABLE` and `config_status` is `ACTIVE`.
- **Transaction Boundary:** Database transaction creates the `orders` entry and updates table status to `OCCUPIED`.
- **Audit Event:** Logs `ORDER_CREATED` with the order ID.
- **Idempotency:** A client-side generated UUID (`Idempotency-Key` header) is validated to prevent seating duplicate orders at the same table simultaneously.

### C. POST /orders/{id}/items
- **Purpose:** Append food items to an order.
- **Permission:** `order:update`
- **Request Payload:**
```json
{
  "items": [
    {
      "menu_item_id": "menu-uuid-1",
      "quantity": 2,
      "notes": "Spicy"
    }
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_id": "ord-uuid-1",
    "added_items": [
      {
        "id": "oi-uuid-1",
        "menu_item_id": "menu-uuid-1",
        "quantity": 2,
        "unit_price": 220.00,
        "status": "ORDERED"
      }
    ]
  },
  "message": "Items added to order",
  "meta": null
}
```
- **Business Validation:**
  - Verify that the order status is `IN_PROGRESS`.
  - Fetch item pricing from `menu_item_location_overrides` (falling back to `menu_items.base_price` if no override exists).
- **Transaction Boundary:** Creates `order_items` records and snapshot rates.

### D. POST /orders/{id}/submit (Dispatch to Kitchen)
- **Purpose:** Commit added items and trigger KOT creation.
- **Permission:** `order:update`
- **Request Payload:** None.
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "kot_id": "kot-uuid-1",
    "kot_number": "KOT-101",
    "items_dispatched": 1
  },
  "message": "Order items submitted to kitchen",
  "meta": null
}
```
- **Transaction Boundary:** Atomic transaction executing:
  1. Generates parent `kots` in `NEW` status and child `kot_items` tickets in `ORDERED` status.
  2. Leaves `order_items` status as `ORDERED`.
- **Notification Event:** Dispatches `NEW_KOT` event to the kitchen socket stream.
- **Audit Event:** Logs `ORDER_SENT_TO_KOT`.
- **Idempotency:** Uses `Idempotency-Key` to block duplicate KOT dispatches of the same items.

### E. POST /orders/{id}/cancel
- **Purpose:** Cancel an active order.
- **Permission:** `order:cancel`
- **Request Payload:**
```json
{
  "reason": "Customer left"
}
```
- **Response (200 OK):** Success confirmation.
- **Business Validation:**
  - Order status must not be `CLOSED` or `PAID`.
  - No items in the order can be in `SERVED` or `PICKED_UP` status.
- **Transaction Boundary:** Updates order status to `CANCELLED`, cancels related active KOT tickets, and releases the table status to `AVAILABLE`.
- **Audit Event:** Logs `ORDER_CANCELLED` with the reason.
