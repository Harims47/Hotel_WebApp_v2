# Kitchen Order Ticket (KOT) API Specification

This document outlines the API contracts for Kitchen Order Tickets (KOT), managing preparation workflows in the kitchen.

---

## 1. Preparation Workflow States

KOT items progress linearly through the following preparation states:
$$\text{ORDER SUBMITTED} \rightarrow \text{KOT NEW} \xrightarrow{\text{KITCHEN START}} \text{PREPARING} \xrightarrow{\text{Kitchen Ready}} \text{READY} \xrightarrow{\text{Waiter Serve}} \text{SERVED/COMPLETED}$$

---

## 2. API Endpoints

### A. GET /kots
- **Purpose:** Fetch active kitchen order tickets for the display board.
- **Permission:** `kot:read` (KOT/Kitchen staff, GMs, Waiters)
- **Request Parameters:**
  - `status` (Query string: `NEW`, `PREPARING`, `READY`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "kot-uuid-1",
      "kot_number": "KOT-101",
      "order_id": "ord-uuid-1",
      "table_number": "T05",
      "status": "NEW",
      "items": [
        {
          "id": "ki-uuid-1",
          "name": "Chicken Biryani",
          "quantity": 2,
          "notes": "No mayonnaise",
          "status": "ORDERED"
        }
      ],
      "created_at": "2026-08-19T10:05:00Z"
    }
  ]
}
```

### B. PATCH /kots/{id}/items/{item_id}/preparing
- **Purpose:** Mark a food item as currently preparing.
- **Permission:** `kot:update` (restricted to `KOT` and `GM` roles)
- **Request Payload:** None.
- **Response (200 OK):** Updates item status to `PREPARING`.
- **Transaction Boundary:** Updates the status of the target `kot_items` record and corresponding `order_items` record.
- **Idempotency:** Replayed requests do nothing.

### C. PATCH /kots/{id}/items/{item_id}/ready
- **Purpose:** Mark food item as prepared and ready for table dispatch.
- **Permission:** `kot:update` (restricted to `KOT` and `GM` roles)
- **Request Payload:** None.
- **Response (200 OK):** Updates item status to `READY`.
- **Transaction Boundary:** 
  - Updates the status of the target `kot_items` and `order_items` records.
  - Registers the timestamp in `ready_at`.
- **Notification Event:** Dispatches a `PICKUP_REMINDER` warning notification to the waiter assigned to the order.
- **Sound Alert:** Triggers the pickup notification sound in the Waiter UI.
- **Audit Event:** Logs `ITEM_READY` with the item code.

### D. PATCH /kots/{id}/items/{item_id}/serve
- **Purpose:** Confirms the waiter has picked up the food item and served it.
- **Permission:** `kot:update` (restricted to `WAITER` and `GM` roles)
- **Request Payload:** None.
- **Response (200 OK):** Updates item status to `SERVED`.
- **Transaction Boundary:** 
  - Updates the status of the target `kot_items` and `order_items` records to `SERVED`.
  - Checks if all items in the KOT are served/completed; if yes, updates the parent `kots.status` to `COMPLETED`.
- **Audit Event:** Logs `ITEM_SERVED`.
