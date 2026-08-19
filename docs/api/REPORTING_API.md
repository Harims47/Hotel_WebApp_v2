# Reporting API Specification

This document outlines the API contracts for analytics dashboards, financial reporting, and inventory valuation metrics.

---

## 1. Query Execution Tiers

To balance performance and data accuracy, reporting queries are routed through three distinct execution tiers:

- **Tier 1: Live Queries (Dine-in/Operational)**
  - Dynamic execution directly on active table indices. Used for operational views (e.g. table maps).
- **Tier 2: Real-Time Aggregates (Sales/Cash Drawer)**
  - Aggregations executed on indexes (e.g. daily sales totals). Updates instantly as transactions close.
- **Tier 3: Materialized Views (GM/Inventory Audits)**
  - Views updated overnight or on a schedule (e.g., product velocities). Used for historical charts.

---

## 2. API Endpoints

### A. GET /reports/sales-summary
- **Purpose:** Retrieve aggregate sales metrics for the GM dashboard.
- **Permission:** `report:view` (Restricted to `GM` and `SUPER_ADMIN` roles)
- **Request Parameters:**
  - `start_date` (Query string, format: YYYY-MM-DD)
  - `end_date` (Query string, format: YYYY-MM-DD)
  - `location_id` (Optional Query string; if omitted, aggregates all locations authorized by the user's membership)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subtotal": 124500.00,
    "discount_amount": 4500.00,
    "tax_amount": 6000.00,
    "grand_total": 126000.00,
    "payment_methods": {
      "CASH": 40000.00,
      "UPI": 70000.00,
      "CARD": 16000.00
    }
  },
  "message": "Sales summary calculated",
  "meta": null
}
```
- **Security Validation:**
  - The context resolver checks that the requested `location_id` matches the user's `user_roles.location_id` boundaries.
  - If a user attempts to send a query for a location belonging to another tenant or a location they lack permission to access, the request returns HTTP 403 Forbidden.

### B. GET /reports/inventory-valuation
- **Purpose:** Fetch current values of stock across locations.
- **Status:** INTERNAL REPORTING ONLY (Provides backend calculations for management audits; removed from client-facing V1 UI dashboard screens).
- **Permission:** `report:view` (Restricted to `INVENTORY_MANAGER` and `GM` roles)
- **Request Parameters:**
  - `location_id` (Query string)
- **Response (200 OK):** Returns sum of `quantity * rate` for all stock records matching the location.

### C. GET /reports/sales-summary/export
- **Purpose:** Export sales summaries as spreadsheets.
- **Permission:** `report:export` (Restricted to `GM` and `SUPER_ADMIN` roles)
- **Response (200 OK):** Streams an Excel file (`.xlsx`) generated using `xlsx` or standard libraries.
- **Security Validation:**
  - Executes the identical authentication, context resolution, and RLS checks as the standard JSON endpoint. Filters are applied at the database level before generation.
