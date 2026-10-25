# 🎟️ EventHub – Ticket Booking System

**ITUE301 – Advanced Web Development Frameworks · Set F · Roll No: 24IT065**

A full-stack event ticketing platform built with React, Node.js, Express, and MongoDB.

---

## 📋 Project Overview

EventHub allows attendees to browse events, book tickets, and manage their bookings.
Organisers can create and manage events through a protected dashboard.
All authentication uses JWT tokens; passwords are hashed with bcrypt.

---

## 🛠️ Technology Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
| Frontend  | React 18 + Vite + React Router v6        |
| Backend   | Node.js + Express.js                     |
| Database  | MongoDB + Mongoose                       |
| Auth      | JSON Web Tokens (JWT) + bcryptjs         |
| HTTP      | Fetch API (native browser / Node 18+)   |
| Testing   | Node.js built-in test runner             |
| VCS       | Git + GitHub                             |

---

## 📁 Folder Structure

```
itue301-exam--24it065---c1-/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.jsx        # Reusable event display card
│   │   │   ├── Navbar.jsx           # Navigation with React Router Links
│   │   │   ├── BookingForm.jsx      # Ticket booking modal
│   │   │   └── ProtectedRoute.jsx   # Route guard (token + role)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Authentication entry point
│   │   │   ├── EventsPage.jsx       # Event listing with search
│   │   │   ├── MyTicketsPage.jsx    # Personal ticket history
│   │   │   ├── OrganizerPanel.jsx   # CRUD dashboard (lazy-loaded)
│   │   │   └── NotFoundPage.jsx     # 404 fallback
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state {attendee, token, role}
│   │   ├── services/
│   │   │   └── api.js               # Centralised fetch-based API layer
│   │   ├── App.jsx                  # Router + lazy loading config
│   │   ├── main.jsx                 # Vite entry point
│   │   └── index.css                # Full design system (dark premium)
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── models/
│   │   ├── Attendee.js              # User schema (name, email, role, passwordHash)
│   │   ├── Event.js                 # Event schema (title, date, venue, inventory)
│   │   └── Ticket.js                # Ticket schema (refs, quantity, status enum)
│   ├── middleware/
│   │   ├── authGuard.js             # Bearer JWT validation + requireRole()
│   │   ├── requestLogger.js         # [METHOD] [PATH] [TIMESTAMP] logger
│   │   └── errorHandler.js          # Global error handler (no stack leakage)
│   ├── routes/
│   │   ├── authRoutes.js            # POST /api/v1/auth/login
│   │   ├── eventRoutes.js           # GET/POST/PUT/DELETE /api/v1/events
│   │   └── ticketRoutes.js          # GET my / POST / PATCH :id/status
│   ├── scripts/
│   │   └── seed.js                  # Idempotent seed (upsert) with demo data
│   ├── tests/
│   │   └── api.test.js              # Automated API tests (Node built-in fetch)
│   ├── server.js                    # Express app + DB connection
│   ├── .env.example
│   └── package.json
├── screenshots/                     # Place exam screenshots here
├── README.md
└── .gitignore
```

---

## ✅ Prerequisites

- Node.js v18 or later
- MongoDB Community Server (local) **or** MongoDB Atlas URI
- Git

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Dhruv5594/EventHub_Ticket_Booking_System.git
cd EventHub_Ticket_Booking_System
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
# Verify VITE_API_BASE_URL points to your backend
```

---

## 🔧 Environment Configuration

### backend/.env

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/eventhub
JWT_SECRET=replace_with_a_long_random_secret_min_32_chars
CLIENT_URL=http://localhost:5173
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

> ⚠️ **Never commit `.env` files.** They are excluded by `.gitignore`.

---

## 🍃 MongoDB Setup

### Local MongoDB

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community)
2. Start service: `mongod` (or via Services panel on Windows)
3. Default URI: `mongodb://127.0.0.1:27017/eventhub`

### MongoDB Atlas (cloud)

1. Create cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Whitelist your IP, create a DB user
3. Copy the connection string to `MONGO_URI` in `backend/.env`

> **Transactions note:** MongoDB transactions require a replica set.
> On a single standalone `mongod`, the booking code safely falls back to
> a non-transactional atomic `findOneAndUpdate` with `$gte` check,
> which is race-condition safe for a single-process server.

---

## 🌱 Seed Data

```bash
cd backend
npm run seed
```

This uses **idempotent upserts** – safe to run multiple times.

### Demo Accounts

| Name            | Email           | Password  | Role      |
|-----------------|-----------------|-----------|-----------|
| Alice Attendee  | alice@demo.com  | Alice@123 | attendee  |
| Bob Organizer   | bob@demo.com    | Bob@1234  | organizer |
| Admin User      | admin@demo.com  | Admin@123 | admin     |

---

## 🚀 Running the Application

### Start Backend

```bash
cd backend
node server.js
# or for development with auto-reload:
npm run dev
```

Server: http://localhost:5000

### Start Frontend

```bash
cd frontend
npm run dev
```

App: http://localhost:5173

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint                     | Auth       | Description                        | Status |
|--------|------------------------------|------------|------------------------------------|--------|
| GET    | `/health`                    | None       | Server health check                | 200    |
| POST   | `/auth/login`                | None       | Login → JWT token                  | 200    |
| GET    | `/events`                    | None       | List all events                    | 200    |
| GET    | `/events/:id`                | None       | Single event                       | 200    |
| POST   | `/events`                    | organizer  | Create event                       | 201    |
| PUT    | `/events/:id`                | organizer  | Update event                       | 200    |
| DELETE | `/events/:id`                | organizer  | Delete event                       | 200    |
| GET    | `/tickets/my`                | attendee   | My tickets (populated)             | 200    |
| POST   | `/tickets`                   | attendee   | Book ticket (atomic)               | 201    |
| GET    | `/tickets/:id`               | attendee   | Single ticket (own only)           | 200    |
| PATCH  | `/tickets/:id/status`        | attendee   | Update status (cancel/used)        | 200    |

### Example Payloads

**POST /api/v1/auth/login**
```json
{ "email": "alice@demo.com", "password": "Alice@123" }
```
Response `200`:
```json
{ "success": true, "token": "<jwt>", "attendee": { "id": "...", "name": "Alice Attendee", "email": "alice@demo.com", "role": "attendee" } }
```

**POST /api/v1/tickets**
```json
{ "eventId": "<mongoId>", "quantity": 2 }
```
Response `201`:
```json
{ "success": true, "message": "Ticket booked successfully.", "data": { "_id": "...", "status": "booked", "quantity": 2 } }
```

**PATCH /api/v1/tickets/:id/status**
```json
{ "status": "cancelled" }
```

**Error responses:** `400`, `401`, `403`, `404`, `500` — all return `{ "success": false, "message": "..." }`.

---

## 🧪 Testing

### Automated Node.js Tests

```bash
# Ensure backend is running first
cd backend
npm test
```

Tests cover:
- Health check
- Public events listing
- Login validation (missing body, wrong password, success)
- Protected route enforcement (no token, invalid token)
- Ticket booking (invalid quantity, success, exceed inventory)
- My tickets with populated fields
- Ticket cancellation
- Invalid status rejection

### Postman / Thunder Client

Import collection manually or use the endpoint table above. Set `Authorization: Bearer <token>` header for protected routes.

---

## 🖥️ Demo Login Flow

1. Open http://localhost:5173
2. Click one of the demo credential cards (auto-fills the form)
3. Click **Sign In**
4. Browse events, book tickets, view My Tickets
5. Login as `bob@demo.com` to access the Organizer dashboard

---

## 📷 Screenshot Checklist

| # | Screenshot                          | File                          |
|---|-------------------------------------|-------------------------------|
| 1 | EventsPage showing event cards      | screenshots/events_page.png   |
| 2 | Postman/Thunder: POST /tickets 201  | screenshots/ticket_201.png    |
| 3 | MongoDB Compass – saved document    | screenshots/mongodb_doc.png   |

> Place screenshots in the `screenshots/` folder before submission.

---

## 📤 GitHub Submission

```bash
git add -A
git status   # verify .env is NOT listed
git commit -m "feat: complete EventHub Ticket Booking System – ITUE301 Set F 24IT065"
git push origin main
```

Repository: https://github.com/Dhruv5594/EventHub_Ticket_Booking_System

---

## 📚 Viva Preparation

### Components & Props
- **EventCard** receives `title, category, date, venue, ticketsAvailable` as props.
- Props flow one-way from parent (EventsPage) → child (EventCard). Never hardcoded in the child.

### Hooks
- `useState` – manages local state (events, loading, error, search query, selected event, quantity).
- `useEffect` – runs API call on mount; dependency array `[token]` ensures re-fetch on auth change.
- `useContext` / `useAuth` – reads global auth state without prop drilling.
- `useNavigate` / `useLocation` – programmatic navigation and active link detection.

### Context
- `AuthContext` holds `{ attendee, token, role }`.
- `AuthProvider` wraps the entire app; any component can call `useAuth()`.

### Protected Routes
- `ProtectedRoute` checks `token` – missing → `/` (login).
- `requiredRole` checks `role` – mismatch → `/events` (not logged out).
- Organizer panel uses `React.lazy` + `Suspense` for code splitting.

### Middleware
- `requestLogger` – applied globally before routes; logs `[METHOD] [PATH] [TIMESTAMP]`.
- `authGuard` – validates Bearer JWT; attaches `req.user` decoded payload.
- `requireRole` – factory that returns middleware checking `req.user.role`.
- `errorHandler` – registered last; catches all `next(err)` calls; never exposes stack traces.

### REST API Design
- Resources: `/auth`, `/events`, `/tickets`.
- HTTP verbs match intent: GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE.
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorised, 403 Forbidden, 404 Not Found, 500 Internal Server Error.

### Mongoose Validation
- `required`, `unique`, `enum`, `min`, `default` declared in schema.
- Validation errors caught by global error handler → structured `400` response.

### References & Populate
- `Ticket.attendeeId` and `Ticket.eventId` are `ObjectId` refs.
- `.populate('attendeeId', 'name email')` replaces the ID with the full Attendee sub-document.

### Inventory Safety
- `findOneAndUpdate({ _id, ticketsAvailable: { $gte: qty } }, { $inc: { ticketsAvailable: -qty } })` – atomic; impossible to oversell even with concurrent requests.
- Cancellation restores inventory only when previous status was `booked`.
- Used tickets cannot be re-used or re-booked.

---

## 📄 Exam Report

Filename: `24it065_SetF_Report.pdf` (confirm with faculty if different).

---

*Prepared by: 24IT065 | CHARUSAT University | ITUE301 Advanced Web Development Frameworks | Set F*
