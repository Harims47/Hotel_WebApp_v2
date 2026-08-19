# Production Readiness Checklist

This document details the final tasks and checks required to transition the **Restaurant Management System** from a local-storage demo to a production-ready system.

---

## 1. Functional Integrity
- [ ] **Auth Flow:** Users can log in, receive a secure session cookie, retrieve their user profile, and log out cleanly.
- [ ] **Operations Flow:** Waiters can select tables, submit items to KOT, update order items, generate bills, and process payments.
- [ ] **Kitchen Terminal:** Kitchen users receive real-time notifications for new KOT tickets and can transition items through states (`PREPARING` -> `READY`).
- [ ] **Delivery Lifecycle:** Delivery drivers receive assigned tasks and can update delivery statuses in real-time.
- [ ] **Inventory & Purchasing:** Inventory managers can generate POs, confirm GRNs, process stock transfers, and declare adjustments. Verify that `stock_ledger` entries match stock mutations.
- [ ] **GM Operations Command Center:** GMs can view metrics, review live audit logs, and approve pending reimbursements.

---

## 2. Security Validation
- [ ] **Authentication Checks:** Password storage uses Argon2id. Password reset flows are secured with short-lived tokens.
- [ ] **Authorization & Tenant Isolation:** Every API endpoint verifies user permissions. Confirm that modifying parameter IDs (e.g., table ID, order ID) to another location returns HTTP 404 or 403.
- [ ] **Secure Session Cookie Configuration:** Cookies are configured with `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/api`.
- [ ] **Input Validation:** API inputs are validated using Pydantic schemas. Special characters are parameterized, and request body size is capped at 2MB at the reverse proxy (Nginx).
- [ ] **Upload Controls:** Supporting documents for reimbursements are validated for MIME type using magic number checks and stored on non-executable external storage.
- [ ] **Rate Limiting:** API endpoints (especially login and password reset) are rate-limited.

---

## 3. Database & Migrations
- [ ] **Schema Migrations:** Alembic migrations run and succeed on a clean PostgreSQL instance.
- [ ] **Constraint Verification:** Check constraints (e.g., `quantity >= 0`, `amount >= 0`, `grand_total >= 0`) are active.
- [ ] **Indexes:** Indexes are configured for search columns (`location_id`, `created_at`, `username`, `status`).
- [ ] **Backups:** Automated daily database backups are configured, encrypted, and sent to secure storage.
- [ ] **Restore Validation:** A test database restore from an automated backup has been performed and verified.

---

## 4. Observability & Monitoring
- [ ] **Structured Logging:** Application logs are formatted in JSON and routed to a centralized log aggregator.
- [ ] **Audit Trail:** Immutable audit logs are generated for all business-critical operations.
- [ ] **Error Tracking:** Sentry is integrated and verified to capture unhandled backend exceptions.
- [ ] **Metrics & Dashboards:** Prometheus endpoints are active, tracking database connection pool statistics, request rates, and response latencies.
- [ ] **Health Checks:** A `/healthz` API endpoint is active, returning status checks for both the database and redis.

---

## 5. Deployment & Configuration
- [ ] **HTTPS Enforced:** TLS 1.3 is configured, and HTTP requests are automatically redirected to HTTPS.
- [ ] **CORS Settings:** CORS headers are restricted to the production frontend domain.
- [ ] **Environment Variables:** Secrets (database credentials, session keys, API tokens) are loaded from env files and not committed to source control.
- [ ] **Nginx Reverse Proxy:** Nginx is configured to route traffic to the Vite static server and FastAPI backend.
