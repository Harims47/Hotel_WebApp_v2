# Test Strategy Specification

This document defines the quality assurance framework and testing pyramid for **Restaurant OS**, focusing on verification of tenant isolation, transaction reliability, and security policies.

---

## 1. Testing Pyramid Layers

```
             [Production Smoke Tests]               ← Health checks & deployment sanity
            [Performance & Load Tests]             ← API latency under load (Locust/k6)
           [Security Penetration Tests]            ← OWASP ZAP scanners & CVE checks
          [End-to-End Workflow Tests]             ← Playwright browser actions
         [Integration Database Tests]             ← Database transaction & rollbacks
        [API Schema & Endpoint Tests]             ← Request/response matching (pytest + httpx)
       [Service Logic & Calculation Tests]         ← Tax, inventory & ledger equations
      [Unit Helpers & Utility Function Tests]      ← Currency formatting, string parses
```

### Layer Scopes & Objectives

- **Unit Tests:** Verify helper functions (e.g., date formats, rounding methods). Executed locally via Vitest/pytest.
- **Service Tests:** Validate business rules (e.g., stock calculations, tax snapshotting).
- **API Tests:** Ensure schema compliance and validation checks (FastAPI endpoint verification).
- **Integration Tests:** Validate database transactions, checking that database transactions roll back if a query fails.
- **E2E Tests:** Execute browser scenarios (Dine-in ordering, preparing food, KOT, and payment).
- **Performance Tests:** Verify response times under load, targeting p95 latency < 200ms.

---

## 2. Multi-Tenant Test Data Strategy

To verify data isolation, all test environments must be initialized with a multi-tenant data seed:

```
  Platform
    ├── Restaurant A (Tenant R001)
    │     ├── Location A1 (Coimbatore Main)
    │     │     ├── Waiter A1 (usr-waiter-a1)
    │     │     ├── Cashier A1 (usr-cashier-a1)
    │     │     └── Table T01
    │     └── Location A2 (Coimbatore Kitchen)
    │           └── Table T01
    └── Restaurant B (Tenant R002)
          └── Location B1 (Erode Main)
                └── Table T01
```

### Core Assertions
- Waiter A1 can create an order at Location A1, Table T01.
- Waiter A1 cannot view, retrieve, or modify orders at Location A2, Table T01 (cross-location check).
- Waiter A1 cannot view, retrieve, or modify orders at Restaurant B, Location B1, Table T01 (cross-tenant check).
- Attempting to query cross-tenant resources using direct UUID calls must return HTTP 404.

---

## 3. Database Transaction & RLS Validation

- **RLS Test Suites:** Automated tests execute database statements using a pool connection after setting:
  `SET LOCAL app.current_tenant_id = 'R002';`
  Verify that queries trying to select orders belonging to Tenant `R001` return empty rows.
- **Rollback Tests:** Service tests intentionally trigger errors halfway through a stock transfer transaction. Verify that both the source location deduction and destination location increment are rolled back, leaving stock quantities unchanged.
- **Ledger Verification:** Every stock mutation test checks that the cached stock quantity matches the conceptual stock movement ledger invariant:
  $$\text{Current Stock} = \text{Opening Balance} + \sum \text{STOCK\_IN} - \sum \text{STOCK\_OUT}$$
  *(Note: Opening balance is explicitly represented by the initial stock-count/adjustment record stored in the ledger).*
- **Payment Immutability:** Verify that sending a `POST` request to update or delete a bill marked as `PAID` returns HTTP 403 Forbidden or 409 Conflict.
