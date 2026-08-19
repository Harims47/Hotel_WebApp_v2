# API Contract & Audit Matrix

This document defines versioning standards, idempotency mechanisms, UI-to-API mappings, and the master API Audit Matrix.

---

## 1. API Versioning Strategy

- **Default Path:** All endpoints are prefixed with `/api/v1`.
- **Versioning Policy:**
  - Minor enhancements (e.g. adding new optional fields to a JSON response) do not increment versions.
  - Breaking changes (e.g. renaming required fields, dropping endpoints) trigger a version increment to `/api/v2`.
  - The backend maintains concurrent route tables for `/v1` and `/v2` to support backward compatibility.

---

## 2. Idempotency Key Mechanism

To prevent duplicate mutations from network retries or double form clicks:
1. **Client Action:** Client generates a unique UUIDv4 string (`Idempotency-Key` header) and sends it with the request payload.
2. **Server Check:** The backend checks the `idempotency_keys` table or cache.
   - If the key exists: Returns the cached response payload immediately.
   - If the key is new: Locks the key, processes the request, caches the result, and returns the response.
3. **Expiry:** Keys expire after 24 hours.

---

## 3. UI-to-API Operation Translations

| Client UI Action (Redux / Workflow) | API Request (REST / WS) | Backend Execution Flow |
| :--- | :--- | :--- |
| Waiter selects Table and seats. | `POST /api/v1/orders` | Checks table availability -> updates table to `OCCUPIED` -> creates order. |
| Waiter adds items and clicks "Submit KOT". | `POST /api/v1/orders/{id}/submit` | Validates active order -> generates KOT & KOT items in `NEW` status -> pushes WS KOT event to kitchen. |
| Kitchen starts preparing food. | `PATCH /api/v1/kots/{id}/items/{item_id}/preparing` | KOT item and order item status transition to `PREPARING`. |
| Kitchen marks item ready. | `PATCH /api/v1/kots/{id}/items/{item_id}/ready` | KOT and order item status transition to `READY` -> dispatches pickup notification. |
| Waiter serves ready food. | `PATCH /api/v1/kots/{id}/items/{item_id}/serve` | KOT and order item status transition to `SERVED/COMPLETED` -> closes KOT. |
| Waiter clicks "Request Bill". | `POST /api/v1/bills` | Snapshots prices -> calculates subtotal, taxes, discount -> updates order status to `BILL_REQUESTED`. |
| Cashier records payment. | `POST /api/v1/bills/{id}/payments` | Creates payment -> updates bill to `PAID` -> closes order -> table set to `AVAILABLE`. |
| Inventory Manager confirms GRN. | `POST /api/v1/goods-receipts/{id}/confirm` | Confirms GRN -> updates physical stock -> inserts stock ledger -> updates PO receipt. |

---

## 4. Master API Audit Matrix

This matrix is the master backend implementation checklist for all routes.

| Endpoint | Method | Authentication | Role | Permission | Tenant Scope | Location Scope | Transaction | Audit Event | Notification Event | Idempotency | Expected Success | Expected Failure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | POST | None | Guest | None | None | None | No | `LOGIN` | None | None | 200 (Cookie set) | 401 (Invalid creds) |
| `/auth/logout` | POST | Session Cookie | Staff | None | None | None | No | `LOGOUT` | None | None | 204 (Cookie cleared)| 401 (Invalid session)|
| `/auth/me` | GET | Session Cookie | Staff | None | None | None | No | None | None | None | 200 (JSON Profile) | 401 (Invalid session)|
| `/orders` | GET | Session Cookie | Staff | `order:read` | Yes | Yes | No | None | None | None | 200 (Active orders) | 401, 403 |
| `/orders/{id}` | GET | Session Cookie | Staff | `order:read` | Yes | Yes | No | None | None | None | 200 (Order details) | 401, 403, 404 (Hidden) |
| `/orders` | POST | Session Cookie | Waiter/GM | `order:create` | Yes | Yes | Yes | `ORDER_CREATED` | None | Idempotency-Key | 201 (Order record) | 401, 403, 409 (Occupied)|
| `/orders/{id}/items` | POST | Session Cookie | Waiter/GM | `order:update` | Yes | Yes | Yes | None | None | None | 200 (Items appended) | 401, 403, 409 (Closed) |
| `/orders/{id}/submit` | POST | Session Cookie | Waiter/GM | `order:update` | Yes | Yes | Yes | `ORDER_SENT_TO_KOT` | `NEW_KOT` | Idempotency-Key | 201 (KOT generated) | 401, 403, 409 (Duplicate)|
| `/orders/{id}/cancel` | POST | Session Cookie | Waiter/GM | `order:cancel` | Yes | Yes | Yes | `ORDER_CANCELLED` | `ORDER_CANCELLED` | Idempotency-Key | 200 (Cancelled) | 401, 403, 409 (Served) |
| `/kots` | GET | Session Cookie | Kitchen/Staff| `kot:read` | Yes | Yes | No | None | None | None | 200 (KOT list) | 401, 403 |
| `/kots/{id}/items/{item_id}/preparing` | PATCH | Session Cookie | Kitchen | `kot:update` | Yes | Yes | Yes | None | None | None | 200 (State updated) | 401, 403, 409 (Conflict) |
| `/kots/{id}/items/{item_id}/ready` | PATCH | Session Cookie | Kitchen | `kot:update` | Yes | Yes | Yes | `ITEM_READY` | `PICKUP_REMINDER` | None | 200 (State updated) | 401, 403, 409 (Conflict) |
| `/kots/{id}/items/{item_id}/serve` | PATCH | Session Cookie | Waiter/GM | `kot:update` | Yes | Yes | Yes | `ITEM_SERVED` | None | None | 200 (State updated) | 401, 403, 409 (Conflict) |
| `/bills` | POST | Session Cookie | Waiter/Cashier| `bill:create` | Yes | Yes | Yes | `BILL_REQUESTED` | `BILL_REQUESTED` | Idempotency-Key | 201 (Bill created) | 401, 403, 409 (Duplicate)|
| `/bills/{id}/adjustments`| PATCH | Session Cookie | Cashier/GM | `bill:update` | Yes | Yes | Yes | `BILL_DISCOUNT_APPLIED`| None | None | 200 (Recalculated) | 401, 403, 409 (Paid) |
| `/bills/{id}/print` | POST | Session Cookie | Cashier/Staff| `bill:update` | Yes | Yes | No | `BILL_PRINTED` | None | None | 200 (Printed state) | 401, 403, 409 (Paid) |
| `/bills/{id}/payments` | POST | Session Cookie | Cashier | `payment:create` | Yes | Yes | Yes | `PAYMENT_RECEIVED` | `PAYMENT_RECEIVED`| Idempotency-Key / Unique Ref | 200 (Order closed) | 401, 403, 409 (Double) |
| `/inventory/purchase-orders`| POST | Session Cookie | Inv Manager | `purchase_order:create`| Yes | Yes | Yes | None | None | None | 201 (PO Draft) | 401, 403 |
| `/inventory/goods-receipts`| POST | Session Cookie | Inv Manager | `goods_receipt:create` | Yes | Yes | Yes | None | None | None | 201 (GRN Pending) | 401, 403 |
| `/goods-receipts/{id}/confirm`| POST | Session Cookie | Inv Manager | `goods_receipt:confirm`| Yes | Yes | Yes | `GRN_CONFIRMED` | `GRN_CONFIRMED` | Idempotency-Key | 200 (Stock updated) | 401, 403, 409 (Confirmed)|
| `/inventory/transfers` | POST | Session Cookie | Inv Manager | `stock:transfer` | Yes | Yes | Yes | `STOCK_TRANSFERRED`| None | Idempotency-Key | 200 (Transferred) | 401, 403, 409 (Insuffic)|
| `/inventory/adjustments` | POST | Session Cookie | Inv Manager | `stock:adjust` | Yes | Yes | Yes | `STOCK_ADJUSTED` | None | None | 200 (Adjusted) | 401, 403 |
| `/deliveries/{id}/assign`| POST | Session Cookie | Cashier/GM | `delivery:assign` | Yes | Yes | Yes | None | `DELIVERY_ASSIGNED`| None | 200 (Driver bound) | 401, 403 |
| `/deliveries/{id}/status`| PATCH | Session Cookie | Driver/GM | `delivery:update` | Yes | Yes | Yes | `DELIVERY_STATUS_CHANGED`| `DELIVERY_STATUS_CHANGED`| None | 200 (State updated) | 401, 403, 409 (Hijack) |
| `/notifications` | GET | Session Cookie | Staff | None | Yes | Yes | No | None | None | None | 200 (Notification list)| 401 |
| `/notifications/{id}/read`| PATCH | Session Cookie | Staff | None | Yes | Yes | No | None | None | None | 200 (Marked read) | 401 |
| `/notifications/{id}/actioned`| PATCH | Session Cookie | Staff | None | Yes | Yes | No | None | None | None | 200 (Marked actioned)| 401 |
| `/reports/sales-summary`| GET | Session Cookie | GM | `report:view` | Yes | Yes | No | None | None | None | 200 (Sales summary) | 401, 403 |
| `/reports/inventory-valuation`| GET | Session Cookie | Inv Manager | `report:view` | Yes | Yes | No | None | None | None | 200 (Valuation summary)| 401, 403 |
| `/reports/sales-summary/export`| GET | Session Cookie | GM | `report:export` | Yes | Yes | No | None | None | None | 200 (XLSX stream) | 401, 403 |
