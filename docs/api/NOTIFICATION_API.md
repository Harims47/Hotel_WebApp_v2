# Notification API Specification

This document details the WebSocket real-time notification stream and notification database management.

---

## 1. WebSocket Connection Lifecycle

```
[Web Client]
   ↓
[WSS Request: /api/v1/notifications/ws]
   ↓
[Fastify: Extracts session cookie from headers]
   ↓
[Authentication Middleware: Validates user session]
   ↓
[Context Resolver: Matches active tenant_id and location_id]
   ↓
[WebSocket Accepted & Mapped to Connection Pool]
   ↓
[Connection listens on Redis Pub/Sub channels:
  - tenant:{tenant_id}:location:{location_id}
  - user:{user_id}
  - role:{role_name}]
```

*Note: Redis Pub/Sub manages the horizontal distribution of event payloads across multi-instance server deployments. It is not used for client authorization; Fastify filters and validates all socket events before broadcasting them.*

---

## 2. Event Payloads

### Notification Event Schema
```json
{
  "event": "notification.created",
  "data": {
    "id": "notif-uuid-1",
    "type": "NEW_KOT",
    "title": "New KOT Received",
    "message": "KOT #101 received for Table T05",
    "priority": "INFO",
    "entity_type": "KOT",
    "entity_id": "kot-uuid-1",
    "action_url": "/kot/orders"
  }
}
```

---

## 3. REST API Endpoints

### A. GET /notifications
- **Purpose:** Retrieve historical notifications for the active user session.
- **Permission:** `authenticated`
- **Request Parameters:**
  - `limit` (Query string, default: 20)
  - `unread_only` (Query string, default: false)
- **Response (200 OK):** List of notifications matching the user's role and location filters.
- **Enforcement:** RLS limits context to active tenant and location.

### B. PATCH /notifications/{id}/read
- **Purpose:** Mark a notification as read, clearing badges.
- **Permission:** `authenticated`
- **Response (200 OK):** Updates `is_read = true`.

### C. PATCH /notifications/{id}/actioned
- **Purpose:** Mark a notification as actioned (e.g. snooze button checked).
- **Permission:** `authenticated`
- **Response (200 OK):** Updates action state.
