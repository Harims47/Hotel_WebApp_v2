# Security Architecture & Threat Model

This document outlines the security architecture, threat model, and mitigation strategies for **Restaurant OS**. It covers defenses against the OWASP Top 10 (2025) and the OWASP API Security Top 10.

---

## 1. Authentication Threats & Mitigations

### A. Brute Force & Credential Stuffing
- **Threat:** Automated scripts attempt password login attempts on `/api/v1/auth/login`.
- **Risk:** High (Unauthorized account takeover).
- **Mitigation:**
  - Enforce rate limiting: max 5 attempts per username/IP within 15 minutes.
  - Implement progressive delays (exponential backoff) on failed login responses.
- **Verification:** Security scanning tools verify rate-limiting headers and rejection on the 6th failed request.

### B. Session Fixation & Hijacking
- **Threat:** Attackers steal or fixate session identifiers.
- **Risk:** High (Impersonation of users).
- **Mitigation:**
  - Regenerate session ID upon successful credential validation.
  - Enforce HttpOnly, Secure, SameSite=Strict, and Path=/api attributes on the session cookie.
  - Enforce hard session timeouts (12 hours) and idle timeouts (2 hours).

---

## 2. Multi-Tenant Authorization Threats (IDOR / BOLA)

### A. Horizontal & Vertical Privilege Escalation
- **Threat:** User from Restaurant A attempts to read or modify resources belonging to Restaurant B, or a low-privileged role tries to access admin routes.
- **Risk:** Critical (Cross-tenant data exposure and manipulation).
- **Mitigation:**
  - **Context-Scoped Middleware:** Every request resolves tenant and location boundaries from the server-side session cache, setting:
    `SET LOCAL app.current_tenant_id = ...`
    `SET LOCAL app.current_location_id = ...`
  - **PostgreSQL Row Level Security (RLS):** Policies automatically restrict database query results to matching tenant IDs.
  - **RBAC Verification:** Route dependencies verify user privileges against role-permission mappings.

---

## 3. Input & File Security

### A. SQL Injection (SQLi)
- **Mitigation:** Parameterized SQL query execution enforced by the `pg` driver. Raw string queries are forbidden.

### B. Upload Exploits
- **Threat:** Uploading malicious executables disguised as image/PDF receipts.
- **Mitigation:**
  - Magic-number validation checks MIME type. Extension matching is not trusted.
  - Uploaded files are renamed to random UUIDs and saved on non-executable external storage (S3/MinIO) with strict content disposition headers.

---

## 4. Business Logic Security

### A. Duplicate Payments & GRN Confirmation Replays
- **Threat:** Concurrent clicks or API replays trigger double payment allocations or duplicate inventory GRN confirmations.
- **Risk:** High (Financial ledger corruption).
- **Mitigation:**
  - Enforce a strict database unique constraint on transaction reference numbers.
  - Require an `Idempotency-Key` header for mutations.
  - Execute mutations inside transactional blocks with isolation levels set to `SERIALIZABLE` to prevent concurrent write race conditions.

---

## 5. Security Header Configurations
- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Content Security Policy (CSP):** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; connect-src 'self' wss:`
- **CORS:** Restrict origin headers specifically to the registered production UI client domain.
