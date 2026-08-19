# Inventory API Specification

This document outlines the API contracts for inventory management, stock mutations, purchasing, and stock auditing.

---

## 1. Stock Mutation Execution Pipeline

Every endpoint that modifies stock balances must execute using the following atomic transaction pipeline:

```
[API Inbound Payload]
       ↓
[Validation: Request & Stock Sufficiency]
       ↓
[Authorization: Role & Scoped Permissions]
       ↓
[Begin Database SQL Transaction]
       ↓
[Create Parent Transaction Record (e.g. grn, issue, transfer)]
       ↓
[Update Cache Table: stock (quantity balance)]
       ↓
[Insert Immutable Entry: stock_ledger]
       ↓
[Insert Immutable Entry: audit_logs]
       ↓
[Commit SQL Transaction]
       ↓
[Trigger Real-Time Notifications if Low Stock Threshold Met]
```

---

## 2. API Endpoints

### A. POST /inventory/purchase-orders
- **Purpose:** Create a supplier purchase order.
- **Permission:** `purchase_order:create`
- **Request Payload:**
```json
{
  "supplier_id": "sup-uuid-1",
  "items": [
    {
      "item_id": "item-uuid-1",
      "quantity": 100.00,
      "unit_rate": 45.00
    }
  ]
}
```
- **Response (201 Created):** Returns PO record with status `DRAFT`.

### B. POST /inventory/goods-receipts
- **Purpose:** Record delivery of goods.
- **Permission:** `goods_receipt:create`
- **Request Payload:**
```json
{
  "po_id": "po-uuid-1",
  "invoice_number": "INV-9988",
  "location_id": "loc-uuid-1",
  "items": [
    {
      "item_id": "item-uuid-1",
      "received_quantity": 100.00,
      "accepted_quantity": 98.00,
      "unit_rate": 45.00,
      "uom_id": "uom-uuid-1"
    }
  ]
}
```
- **Response (201 Created):** Returns GRN record with status `PENDING`.

### C. POST /inventory/goods-receipts/{id}/confirm
- **Purpose:** Confirm receipt and adjust physical stock.
- **Permission:** `goods_receipt:confirm` (Restricted to `INVENTORY_MANAGER` and `GM` roles)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "grn_id": "grn-uuid-1",
    "status": "CONFIRMED",
    "confirmed_at": "2026-08-19T10:15:00Z"
  },
  "message": "GRN confirmed; stock and ledger updated",
  "meta": null
}
```
- **Business Validation:**
  - Verify that the GRN status is `PENDING` (cannot confirm twice).
- **Transaction Boundary:**
  1. Updates the `goods_receipts` status to `CONFIRMED`.
  2. Updates corresponding `purchase_orders.items.received_quantity` and sets PO status (`RECEIVED` or `PARTIALLY_RECEIVED`).
  3. Increments the quantity in the `stock` cache table for the target location.
  4. Inserts `STOCK_IN` record in the `stock_ledger` table.
- **Audit Event:** Logs `GRN_CONFIRMED`.
- **Idempotency:** Uses `Idempotency-Key` to prevent duplicate confirmations.

### D. POST /inventory/transfers
- **Purpose:** Transfer stock between branch outlets.
- **Permission:** `stock:transfer` (Restricted to `INVENTORY_MANAGER` and `GM` roles)
- **Request Payload:**
```json
{
  "source_location_id": "inv-loc-uuid-1",
  "destination_location_id": "inv-loc-uuid-2",
  "item_id": "item-uuid-1",
  "quantity": 25.00
}
```
- **Business Validation:**
  - Verify `source_location_id` and `destination_location_id` belong to the same restaurant tenant.
  - Verify `source_location_id != destination_location_id`.
  - Verify the source location has sufficient stock balance (`quantity >= 25.00`).
- **Transaction Boundary:**
  1. Decrements source `stock` quantity cache.
  2. Increments destination `stock` quantity cache.
  3. Inserts `STOCK_OUT` ledger entry for the source location.
  4. Inserts `STOCK_IN` ledger entry for the destination location.
- **Audit Event:** Logs `STOCK_TRANSFERRED`.

### E. POST /inventory/adjustments
- **Purpose:** Adjust system quantities to match physical counts.
- **Permission:** `stock:adjust`
- **Request Payload:**
```json
{
  "inventory_location_id": "inv-loc-uuid-1",
  "item_id": "item-uuid-1",
  "physical_quantity": 80.00
}
```
- **Business Validation:**
  - System pulls `system_quantity` from the `stock` cache.
  - Calculates variance:
    $$\text{Variance} = 80.00 - \text{system\_quantity}$$
- **Transaction Boundary:**
  1. Updates `stock` quantity to `80.00`.
  2. Creates a `stock_ledger` entry for the variance (direction depends on whether the variance is positive or negative).
- **Audit Event:** Logs `STOCK_ADJUSTED`.
