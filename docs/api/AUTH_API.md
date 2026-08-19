# Authentication API Specification

This document details the authentication and session endpoints for **Restaurant OS**. The authentication system relies on server-side session IDs stored in secure cookies.

---

## 1. Session Cookie Requirements

To mitigate session hijacking and Cross-Site Scripting (XSS), the session cookie returned by the server on login must carry the following attributes:
- `HttpOnly`: Block access by client-side Javascript.
- `Secure`: Transmit strictly over encrypted HTTPS connections.
- `SameSite=Strict`: Protect against Cross-Site Request Forgery (CSRF).
- `Path=/api`: Limit cookie exposure to API endpoints.
- `Max-Age=43200`: Absolute session duration of 12 hours.

---

## 2. API Endpoints

### A. POST /auth/login
- **Purpose:** Validate user credentials and issue session cookie.
- **Rate Limiting:** Maximum 5 attempts per username/IP per 15 minutes.
- **Request Payload:**
```json
{
  "username": "waiter1",
  "password": "hashed_or_plain_string"
}
```
- **Response (200 OK):**
  *(Note: The actual session ID is not returned in the JSON body; it is set in the secure `Set-Cookie` header).*
```json
{
  "success": true,
  "data": {
    "expires_at": "2026-08-20T03:00:00Z"
  },
  "message": "Login successful",
  "meta": null
}
```
- **Errors:**
  - `401 Unauthorized`: Invalid username or password (generic message to prevent account discovery).
  - `403 Forbidden`: User account status is `INACTIVE`.
  - `429 Too Many Requests`: Rate limit reached.

### B. POST /auth/logout
- **Purpose:** Invalidate the active session on both client and server.
- **Request Payload:** None.
- **Response (204 No Content):** Cookie cleared (expiry date set to past).

### C. GET /auth/me
- **Purpose:** Retrieve the active user's authorization profile, active membership context, and permission lists for frontend UI building.
- **Request Headers:** Session cookie must be present.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr-uuid-1",
      "name": "Rahul",
      "username": "waiter1",
      "phone": "9000000003"
    },
    "active_context": {
      "restaurant_id": "rest-uuid-1",
      "restaurant_name": "NS Resto Cafe",
      "location_id": "loc-uuid-1",
      "location_name": "Coimbatore Main"
    },
    "memberships": [
      {
        "restaurant_id": "rest-uuid-1",
        "restaurant_name": "NS Resto Cafe",
        "roles": ["WAITER"],
        "permissions": ["order:create", "order:read", "order:update", "kot:read", "table:read", "table:update_status"],
        "locations": [
          {
            "location_id": "loc-uuid-1",
            "name": "Coimbatore Main"
          }
        ]
      }
    ]
  },
  "message": "Profile retrieved successfully",
  "meta": null
}
```

---

## 3. Session Invalidation & Hashing
- **Hashing:** Backend checks passwords against the database `password_hash` column using the **Argon2id** algorithm.
- **Session Expiration:** Idle sessions are automatically deleted from the cache database after 2 hours of inactivity.
