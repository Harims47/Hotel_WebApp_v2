# Role & Permission Matrix

This document defines the Role-Based Access Control (RBAC) rules for the **Restaurant Management System (Restaurant OS)**. Permissions are enforced both in the frontend UI (for view routing and component rendering) and strictly verified on the backend (to prevent horizontal and vertical privilege escalation).

---

## 1. System Roles

1. **SUPER ADMIN:** System administrator with complete control over restaurant profile, users, taxes, global configurations, and raw database parameters.
2. **GENERAL MANAGER (GM):** Has read-only operational visibility across all segments (orders, stock, cash drawer) and controls reimbursement approvals, audit reports, and escalation management.
3. **INVENTORY MANAGER:** Handles suppliers, purchasing, stock counts, adjustments, transfers, and issues.
4. **CASHIER:** Manages billing modifications, discounts, printing bills, receiving payments, takeaway orders, and delivery assignments.
5. **WAITER:** Creates dine-in orders, assigns tables, adds items to orders, requests bills, and manages item serve confirmations.
6. **KOT / KITCHEN:** View-only terminal for active food prep orders. Confirms items as preparing or ready.
7. **DELIVERY PERSON:** View-only terminal for delivery orders. Updates delivery statuses.

---

## 2. Resource Permission Matrix

| Resource | SUPER ADMIN | GENERAL MANAGER | INVENTORY MANAGER | CASHIER | WAITER | KOT/KITCHEN | DELIVERY PERSON |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Users** | C, R, U, D | R | - | - | - | - | - |
| **Restaurant Profile** | C, R, U | R | - | - | - | - | - |
| **Menu Configuration**| C, R, U, D | R | - | - | - | - | - |
| **Dine-in Tables** | C, R, U, D | R | - | - | R, U (Status) | - | - |
| **Orders** | R | R | - | C, R, U, CANCEL | C, R, U, CANCEL | R | - |
| **KOT Tickets** | R | R | - | C, R | C, R | R, U (Prep) | - |
| **Bills** | R | R | - | C, R, U, PRINT | R, PRINT | - | - |
| **Payments** | R | R | - | C, R | - | - | - |
| **Purchase Orders** | R | R | C, R, U, CANCEL | - | - | - | - |
| **Goods Receipts** | R | R | C, R, CONFIRM | - | - | - | - |
| **Stock Records** | R | R | C, R, U, D | - | - | - | - |
| **Stock Adjustments** | R | R | C, R, U, CONFIRM | - | - | - | - |
| **Reimbursements** | R | R, APPROVE, PAY | C, R, CREATE | - | - | - | - |
| **Audit Logs** | R | R | - | - | - | - | - |
| **Deliveries** | R | R | - | R, ASSIGN | - | - | R, U (Status) |

- **C:** Create | **R:** Read | **U:** Update | **D:** Delete | **CONFIRM:** Finalize transaction | **CANCEL:** Void transaction | **APPROVE/PAY:** Sign off reimbursement request.

---

## 3. Object-Level & Multi-Tenant Authorization Rules

Backend route dependencies must perform the following context-validation logic:

### A. Location & Tenant Data Isolation (Multi-Tenant Isolation)
- **Rule:** A user can *only* query, write, or update objects where `location_id` matches the `location_id` linked to their active session user profile.
- **Exception:** SUPER ADMIN has a wildcard parameter allowing query expansion across multiple locations.
- **Enforcement:**
  `SELECT * FROM orders WHERE location_id = :session_user_location_id AND id = :order_id;`
  If a query returns no rows due to a mismatched location, the server returns HTTP 404 Not Found to prevent data exposure.

### B. Waiter-Level Isolation
- **Rule:** Waiters can view all tables in their location, but can only modify or update order items for orders they created, or tables they are assigned to.
- **Enforcement:** Backend checks: `order.waiter_id == current_user.id`.

### C. Cashier Restrictions
- **Rule:** Cashiers can modify bill rates or apply discounts, but they **cannot** delete bill records or bypass tax rules unless authorized by a GM bypass key.
- **Rule:** Cashiers cannot modify the `price` of menu items (only Super Admins can alter master menu prices).

### D. Inventory Manager Constraints
- **Rule:** Inventory Managers can record stock issues or write off stock waste, but they **cannot** access Super Admin configuration panels, modify user roles, or delete user profiles.

### E. Delivery Person Constraints
- **Rule:** Delivery drivers can read assigned deliveries, but can **only** transition the status of deliveries assigned to their user ID.
- **Enforcement:** `delivery.assigned_delivery_user_id == current_user.id` is checked before updating status to `PICKED_UP`, `OUT_FOR_DELIVERY`, or `DELIVERED`.

---

## 4. Frontend Visibility vs. Backend Enforcement

- **Frontend Visibility (UX only):**
  - Sidebar links are dynamically filtered using `currentUser.role` flags. Waiters do not see the "Inventory" sidebar; Cashiers do not see the "Admin Configuration" tab.
  - Buttons (e.g. "Approve Reimbursement") are conditionally rendered or disabled depending on permissions.
- **Backend Authorization (Security Enforcement):**
  - All endpoint handlers contain route dependencies verifying user roles and object ownership.
  - If a waiter crafts a direct API call to POST `/api/v1/admin/users`, the backend rejects the request with HTTP 403 Forbidden, regardless of any frontend styling or page configurations.
