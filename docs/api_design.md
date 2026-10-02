# FocusDesk Production-Ready REST API Design

This document details the RESTful API contract for **FocusDesk**. The endpoints follow industry standards: clean hierarchical structures, stateless JWT-based authentication, proper HTTP status codes, structured JSON responses, and role-based access control (RBAC).

---

## 🛡️ Global Security & Best Practices

1. **Authentication Layer**: All protected endpoints require a Bearer token in the request header: `Authorization: Bearer <JWT_TOKEN>`.
2. **Rate Limiting**: To prevent brute force and denial of service, configure:
   - Auth endpoints (`/api/auth/*`): Max 10 requests per 15 minutes.
   - Standard APIs: Max 100 requests per 15 minutes.
3. **NoSQL Injection Prevention**: Sanitize all incoming fields in `req.body`, `req.params`, and `req.query` using middleware (e.g., `express-mongo-sanitize`) to block operator injection like `{"email": {"$ne": null}}`.
4. **Data Validation**: Use validation schemas (e.g., `Joi` or `Zod`) to enforce strict payload requirements before hitting controller handlers.
5. **Standard Error Payload**:
   ```json
   {
     "status": "error",
     "statusCode": 400,
     "message": "Validation failed: Email format is invalid"
   }
   ```

---

## 1. Authentication APIs

### Register User
* **Endpoint**: `POST /api/auth/register`
* **Method**: `POST`
* **Auth Requirement**: Public
* **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "student@focusdesk.com",
    "password": "SecurePassword123!",
    "role": "student",
    "phoneNumber": "+14155559812"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "66731cf10fa24e0b503ad21e",
        "fullName": "Jane Doe",
        "email": "student@focusdesk.com",
        "role": "student",
        "isVerified": false,
        "createdAt": "2026-06-19T12:00:00.000Z"
      }
    }
  }
  ```
* **Middleware**: Validation middleware (checks name length, email regex, password strength, role enum).
* **Security Considerations**: Hash passwords with bcrypt (minimum cost factor of 10) before storage.

---

### Login User
* **Endpoint**: `POST /api/auth/login`
* **Method**: `POST`
* **Auth Requirement**: Public
* **Request Body**:
  ```json
  {
    "email": "student@focusdesk.com",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "66731cf10fa24e0b503ad21e",
        "fullName": "Jane Doe",
        "email": "student@focusdesk.com",
        "role": "student"
      }
    }
  }
  ```
* **Middleware**: Login validation middleware.
* **Security Considerations**: Generate short-lived JWT access tokens (e.g. 1 hour) and secure HTTP-Only cookies for refresh tokens.

---

## 2. Library & Search APIs

### Discover & Search Libraries
* **Endpoint**: `GET /api/libraries`
* **Method**: `GET`
* **Auth Requirement**: Public
* **Query Parameters**:
  - `lat` / `lng`: Latitude and Longitude for proximity searches.
  - `radius`: Proximity radius in meters (defaults to 5000 / 5km).
  - `facilities`: Comma-separated facilities filter (e.g. `wifi,ac`).
  - `maxRate`: Upper hourly rate price limit.
  - `page` / `limit`: Pagination parameters.
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "results": 1,
    "page": 1,
    "data": {
      "libraries": [
        {
          "id": "66731cf10fa24e0b503ad22b",
          "name": "MindSpace Premium Library",
          "address": {
            "street": "404 Coding Lane",
            "city": "Silicon Valley",
            "state": "CA",
            "zipCode": "94025"
          },
          "distance": 420.5,
          "facilities": ["High-Speed Wi-Fi", "Air Conditioning", "Power Outlets"],
          "hourlyRate": 5.00,
          "operationalHours": {
            "open": "08:00",
            "close": "22:00"
          }
        }
      ]
    }
  }
  ```
* **Middleware**: Query parsing middleware (sanitizes pagination and floats).
* **Security Considerations**: Protect against query-level Denial of Service by enforcing a strict maximum value on the pagination `limit` parameter (e.g., max 50 items).

---

### Add New Library
* **Endpoint**: `POST /api/libraries`
* **Method**: `POST`
* **Auth Requirement**: Protected (`authenticateToken` + `authorizeRoles('owner')`)
* **Request Body**:
  ```json
  {
    "name": "Quiet Haven Workspace",
    "address": {
      "street": "77 Reading St",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02115"
    },
    "location": {
      "type": "Point",
      "coordinates": [-71.0589, 42.3601]
    },
    "facilities": ["Silent Zone", "Power Outlets"],
    "hourlyRate": 4.50,
    "operationalHours": {
      "open": "07:00",
      "close": "21:00"
    }
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "data": {
      "library": {
        "id": "66731cf10fa24e0b503ad30f",
        "ownerId": "66731cf10fa24e0b503ad100",
        "name": "Quiet Haven Workspace",
        "address": { ... },
        "facilities": ["Silent Zone", "Power Outlets"],
        "hourlyRate": 4.50,
        "seats": []
      }
    }
  }
  ```
* **Middleware**: `authenticateToken`, `authorizeRoles('owner')`, validation middleware.

---

### Get Real-Time Library Seats Layout
* **Endpoint**: `GET /api/libraries/:id/seats`
* **Method**: `GET`
* **Auth Requirement**: Protected (`authenticateToken`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "seats": [
        { "id": "66731cf10fa24e0b503ad31a", "seatNumber": "A1", "seatType": "cubicle", "status": "available" },
        { "id": "66731cf10fa24e0b503ad31b", "seatNumber": "A2", "seatType": "standard", "status": "occupied" }
      ]
    }
  }
  ```
* **Middleware**: `authenticateToken`, parameter sanitizer.

---

## 3. Booking APIs

### Create Seat Booking
* **Endpoint**: `POST /api/bookings`
* **Method**: `POST`
* **Auth Requirement**: Protected (`authenticateToken` + `authorizeRoles('student')`)
* **Request Body**:
  ```json
  {
    "libraryId": "66731cf10fa24e0b503ad22b",
    "seatId": "66731cf10fa24e0b503ad31a",
    "startTime": "2026-06-20T14:00:00.000Z",
    "endTime": "2026-06-20T18:00:00.000Z"
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "data": {
      "booking": {
        "id": "66731cf10fa24e0b503ad55c",
        "studentId": "66731cf10fa24e0b503ad21e",
        "libraryId": "66731cf10fa24e0b503ad22b",
        "seatNumber": "A1",
        "startTime": "2026-06-20T14:00:00.000Z",
        "endTime": "2026-06-20T18:00:00.000Z",
        "totalFee": 20.00,
        "status": "pending"
      }
    }
  }
  ```
* **Middleware**: `authenticateToken`, `authorizeRoles('student')`, body validation.
* **Security & Concurrency Considerations**:
  - The handler must verify that the seat is active and not already occupied during the requested slot (query overlapping ranges).
  - Use a database transaction or conditional updates (`findAndModify`) to prevent race conditions where two threads attempt to book the same seat at the same time.

---

### Update Booking Status (Approve/Cancel/Complete)
* **Endpoint**: `PATCH /api/bookings/:id/status`
* **Method**: `PATCH`
* **Auth Requirement**: Protected (`authenticateToken`)
* **Request Body**:
  ```json
  {
    "status": "cancelled"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "booking": {
        "id": "66731cf10fa24e0b503ad55c",
        "status": "cancelled"
      }
    }
  }
  ```
* **Middleware**: `authenticateToken`, verification middleware.
* **Security & Authorization Rules**:
  - If user is a **student**, they can only set status to `cancelled` and only for *their own* bookings.
  - If user is an **owner**, they can set status to `confirmed` or `completed` for bookings belonging to *their library*.
  - Strict resource owner authorization validation must occur in the controller.

---

## 4. Notification APIs

### Fetch User Notifications
* **Endpoint**: `GET /api/notifications`
* **Method**: `GET`
* **Auth Requirement**: Protected (`authenticateToken`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "results": 1,
    "data": {
      "notifications": [
        {
          "id": "66731cf10fa24e0b503ad88f",
          "type": "booking_alert",
          "message": "Your booking for seat A3 has been confirmed!",
          "isRead": false,
          "createdAt": "2026-06-19T12:00:00.000Z"
        }
      ]
    }
  }
  ```
* **Middleware**: `authenticateToken`.
* **Security Considerations**: Ensure query filters by `userId = req.user.id` to prevent user A from reading user B's notifications.

---

### Mark Notification as Read
* **Endpoint**: `PATCH /api/notifications/:id/read`
* **Method**: `PATCH`
* **Auth Requirement**: Protected (`authenticateToken`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Notification marked as read"
  }
  ```
* **Middleware**: `authenticateToken`.
* **Security Considerations**: Validate that the notification belongs to the authenticated user before executing the update.
