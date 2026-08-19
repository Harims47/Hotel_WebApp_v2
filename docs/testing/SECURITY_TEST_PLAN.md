# Security Test Plan

This document details the test cases and methodologies to validate the security controls of **Restaurant OS** against common application vulnerabilities.

---

## 1. Authentication & Session Management

| Test ID | Vulnerability / Threat | Test Procedure | Expected Result |
| :--- | :--- | :--- | :--- |
| **SEC-ATH-01**| Brute Force | Send 10 consecutive invalid login requests to `/api/v1/auth/login`. | The 6th request is blocked with HTTP 429. |
| **SEC-ATH-02**| Session Fixation | Capture session cookie before login. Log in successfully. Check cookie value. | The post-login session cookie value has changed. |
| **SEC-ATH-03**| Session Hijacking (XSS) | Execute client-side JavaScript: `document.cookie` in the browser console. | The session cookie is not returned (HttpOnly flag active). |
| **SEC-ATH-04**| Logout Invalidation | Log out. Resend the invalidated session cookie to a protected endpoint. | Server returns HTTP 401 Unauthorized. |

---

## 2. Multi-Tenancy & Authorization (IDOR / BOLA)

To verify tenant isolation, resource queries are tested using manipulated identifiers:

### A. IDOR Evaluation Matrix
Every resource endpoint (e.g. `GET /api/v1/orders/{id}`) must be tested against the following ID types:

1. **Valid Own ID:** Resource belongs to the caller's tenant and location. (Expected: `200 OK`).
2. **Valid Other-Location ID:** Resource belongs to the caller's tenant but a different location (no user role access). (Expected: `404 Not Found`).
3. **Valid Other-Tenant ID:** Resource belongs to another restaurant tenant entirely. (Expected: `404 Not Found`).
4. **Random UUID:** A dynamically generated UUID that does not exist in any database table. (Expected: `404 Not Found`).
5. **Deleted UUID:** A UUID of a soft-deleted resource. (Expected: `404 Not Found`).

---

## 3. Input & File Security

### A. SQL Injection (SQLi)
- **Method:** Send payload: `'; DROP TABLE orders; --` in request query strings and body parameters.
- **Expected Result:** The query is executed safely as a parameterized variable. Verify that no SQL compilation errors are returned in the HTTP response.

### B. File Upload Sanitization
- **MIME Validation:** Attempt to upload a text file renamed with a `.pdf` extension containing script tags.
- **Expected Result:** The upload is rejected with HTTP 400 Bad Request because magic number inspection identifies it as plain text.
- **Path Traversal:** Attempt to upload a file with name `../../../../etc/passwd`.
- **Expected Result:** The filename is sanitized to remove path navigation characters, and the file is stored under a randomly generated UUID name.

---

## 4. Rate Limiting

- **Endpoints Targeted:** `/api/v1/auth/login`, `/api/v1/reports/sales-summary/export`, `/api/v1/notifications/ws`.
- **Method:** Use `k6` to send 100 requests per second to the export endpoint.
- **Expected Result:** Subsequent requests beyond the rate limit threshold (e.g. 5 exports per minute) are throttled, returning HTTP 429 Too Many Requests.
