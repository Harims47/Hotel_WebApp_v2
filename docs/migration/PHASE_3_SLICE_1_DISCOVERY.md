# Phase 3 Slice 1: Master Data — Discovery & Gap Analysis

## 1. Executive Summary
This document analyzes the gap between the existing Redux/`localStorage` implementation and the required PostgreSQL/Node.js backend for Phase 3, Slice 1 (Master Data). The scope includes **Customers**, **Suppliers**, **Inventory UOMs**, and **Inventory Categories**. 
Currently, the PostgreSQL database contains none of these tables. The frontend relies heavily on local state and synchronous Redux actions.

**SLICE 1 READINESS: NOT READY**
- Backend schemas and APIs must be implemented before the frontend can be migrated.
- Discrepancies exist between the current `DATABASE_DESIGN.md` schema and the actual frontend data models (e.g., Suppliers have a many-to-many relationship with Categories in the UI, which is missing from the DB design).

---

## 2. Current Frontend Architecture
- **State Management:** Slices defined in `inventorySlices.js` (`invCategories`, `invUom`, `invSuppliers`) and `customersSlice.js`.
- **Pages:**
  - `SuppliersMaster.jsx`: Manages suppliers and their mapped categories.
  - `UomMaster.jsx`: Manages Units of Measure.
  - `CategoriesMaster.jsx`: Manages Inventory Categories.
  - *Note:* There is no dedicated `CustomersMaster.jsx`. Customers are currently created ad-hoc or mapped via IDs in Delivery/Orders.
- **Dependencies:** Other domains (Orders, Deliveries, Purchase Orders, Items) rely on these slices for foreign-key-like lookups.

## 3. Current localStorage Usage
- `saveState` / `loadState` in `localStorage.js` handles all persistence.
- Slices: `invCategories.data`, `invUom.data`, `invSuppliers.data`, `customers.data` are loaded fully into memory on app start.

## 4. Existing Database State
- **Current Tables:** `restaurants`, `users`, `locations`, `restaurant_configurations`, `location_configurations`, `restaurant_memberships`, `user_roles`, `user_sessions`, `tables`, `audit_logs`.
- **Missing Slice 1 Tables:** `customers`, `suppliers`, `inventory_uoms`, `inventory_categories`, `supplier_inventory_categories`.

---

## 5. Entity-by-Entity Analysis & 6. Tenancy Scope Matrix

### A. Customers
- **Scope:** `RESTAURANT-SCOPED`
- **Frontend Model:** `{ id, name, phone }`
- **Required DB Model:** `customers` (`id`, `restaurant_id`, `name`, `phone`, `email`, `created_at`, `updated_at`, `deleted_at`)
- **Missing from DB Docs:** The table is referenced in migration docs but missing from the DDL specs.

### B. Inventory Categories
- **Scope:** `RESTAURANT-SCOPED`
- **Frontend Model:** `{ id, code, name, description, status }`
- **Required DB Model:** `inventory_categories` (`id`, `restaurant_id`, `code`, `name`, `description`, `status`, `created_at`, `updated_at`, `deleted_at`)
- **Missing from DB Docs:** `code` and `status` columns were not specified in the initial design but are actively used in the UI.

### C. Inventory UOMs
- **Scope:** `RESTAURANT-SCOPED` (Crucial change: The DB docs did not include `restaurant_id` for UOMs, but the UI allows users to create and edit them. They must be tenant-isolated to prevent cross-contamination).
- **Frontend Model:** `{ id, code, name, type, status }`
- **Required DB Model:** `inventory_uoms` (`id`, `restaurant_id`, `code`, `name`, `type`, `status`, `created_at`, `updated_at`, `deleted_at`)

### D. Suppliers
- **Scope:** `RESTAURANT-SCOPED`
- **Frontend Model:** `{ id, code, name, contactPerson, phone, email, address, gstNumber, suppliedCategoryIds, status }`
- **Required DB Model:** 
  - `suppliers` (`id`, `restaurant_id`, `code`, `name`, `contact_person`, `phone`, `email`, `address`, `gst_number`, `status`, `created_at`, `updated_at`, `deleted_at`)
  - `supplier_inventory_categories` (`supplier_id`, `category_id`)
- **Missing from DB Docs:** `code`, `gst_number`, `status`, and the many-to-many relationship (`supplier_inventory_categories`) were completely missing from the DDL specification.

---

## 7. Proposed API Contract

### Customers
- `GET /api/v1/customers` (LIST)
- `GET /api/v1/customers/:id` (GET)
- `POST /api/v1/customers` (CREATE) - Body: `{ name, phone, email }`
- `PUT /api/v1/customers/:id` (UPDATE)

### Inventory Categories
- `GET /api/v1/inventory/categories`
- `POST /api/v1/inventory/categories` - Body: `{ code, name, description }`
- `PUT /api/v1/inventory/categories/:id`
- `PATCH /api/v1/inventory/categories/:id/status` - Body: `{ status: 'ACTIVE' | 'INACTIVE' }`

### Inventory UOMs
- `GET /api/v1/inventory/uoms`
- `POST /api/v1/inventory/uoms` - Body: `{ code, name, type }`
- `PUT /api/v1/inventory/uoms/:id`
- `PATCH /api/v1/inventory/uoms/:id/status`

### Suppliers
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers` - Body: `{ code, name, contactPerson, phone, email, address, gstNumber, suppliedCategoryIds }`
- `PUT /api/v1/suppliers/:id`
- `PATCH /api/v1/suppliers/:id/status`

---

## 8. Permission Matrix & 9. RLS Requirements

| Entity | Create/Update | Read | RLS Policy Requirement |
| :--- | :--- | :--- | :--- |
| **Customers** | CASHIER, WAITER, GM | ALL | `restaurant_id = current_tenant_id` |
| **Categories** | INVENTORY_MANAGER, GM | ALL | `restaurant_id = current_tenant_id` |
| **UOMs** | INVENTORY_MANAGER, GM | ALL | `restaurant_id = current_tenant_id` |
| **Suppliers** | INVENTORY_MANAGER, GM | ALL | `restaurant_id = current_tenant_id` |

*(Note: The current UI prevents GM from editing Categories/UOMs/Suppliers. The backend API should enforce standard RBAC, but we can preserve UI behavior if desired).*

---

## 10. Backend Implementation Requirements
1. **Migrations:** Create `backend/migrations/002_master_data.js` to create the 5 tables with proper foreign keys to `restaurants`.
2. **Routes & Controllers:** Implement the 16 endpoints defined in the API contract.
3. **Zod Schemas:** Define strict validation (e.g., unique constraints on `code` per restaurant).
4. **Transactions:** The `POST /api/v1/suppliers` endpoint must use an ACID transaction to insert the supplier and its mapped categories simultaneously.

## 11. Frontend Migration Requirements
1. Create `frontend/src/features/customers/customersThunks.js` (and similarly for inventory).
2. Update `inventorySlices.js` to handle async API states (`loading`, `error`).
3. Refactor `SuppliersMaster.jsx`, `UomMaster.jsx`, and `CategoriesMaster.jsx` to dispatch thunks instead of synchronous CRUD actions.
4. Remove `customers`, `invCategories`, `invUom`, and `invSuppliers` from `INITIAL_STATE` in local storage mapping.

## 12. Data Migration Risks
- **Seed Data IDs:** The UI currently relies on hardcoded string IDs like `ic-1`, `uom-1`, `sup-1`. PostgreSQL requires real UUIDs. When the frontend switches to the API, existing `localStorage` data mapping to these entities (like `invItems` referencing `categoryId: 'ic-1'`) will break if we don't handle the ID translation or seed the DB with specific UUIDs.

## 13. Security Test Matrix
Every endpoint must pass Jest tests validating:
- Authentication failure (401)
- RBAC unauthorized (403)
- Tenant isolation (Tenant A cannot see/edit Tenant B's UOMs)
- Invalid UUID format (400)
- Duplicate `code` within the same restaurant (409 or 422)
- Valid state transitions (`ACTIVE` / `INACTIVE` only)
- SQL Injection prevention (via parameterized `pg` queries)

## 14. E2E Test Scenarios
- Log in as Inventory Manager -> Create new Category -> Verify it appears in the list.
- Create new Supplier mapping to the new Category -> Verify it appears.
- Log in as GM -> Verify cannot edit (if UI rule kept) but can view the Supplier.
- Verify unique code constraints trigger UI toasts.

## 15. Manual QA Scenarios
- Test creating a UOM with type `WEIGHT`.
- Test editing a Supplier to add/remove supplied categories.
- Test deactivating a Category and ensure it reflects via the status badge.

## 16. Definition of Done
- Database schema applied successfully.
- APIs implemented and passing 100% of security/unit tests.
- Frontend components refactored to use APIs.
- LocalStorage references for Slice 1 removed.
- E2E tests for Master Data passing.

## 17. Open Questions
1. Should the `customers` table include an `address` field even though it's currently only used for Delivery (which stores address on the `deliveries` table directly)?
2. The UI explicitly blocks the `GM` role from editing UOMs, Categories, and Suppliers (`if (isGM) return;`). Should the backend API strictly block the GM role from these `POST`/`PUT` endpoints, or is this just a UI-level restriction?

---
**STATUS: NOT READY** (Awaiting implementation of Backend Schema and APIs).
