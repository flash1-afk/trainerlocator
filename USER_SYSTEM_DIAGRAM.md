# 🎨 Visual Diagram of User System

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Frontend)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Dashboard.jsx (What User Sees)                    │  │
│  │                                                           │  │
│  │  • Shows trainer list                                    │  │
│  │  • Search and filter trainers                            │  │
│  │  • Book sessions                                         │  │
│  │  • View map                                              │  │
│  │  • User profile management                               │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│                          │ Makes HTTP Requests                   │
│                          │ (axios.get, axios.post)              │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (Backend)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              server.js (Main Server)                      │  │
│  │                                                           │  │
│  │  • Listens for requests                                  │  │
│  │  • Routes requests to correct file                       │  │
│  │  • Connects to database                                  │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Middleware: auth.js (Security Guard)              │  │
│  │                                                           │  │
│  │  ✓ Checks if user has token                              │  │
│  │  ✓ Verifies token is valid                               │  │
│  │  ✓ Adds user info to request                             │  │
│  │  ✗ Blocks request if no/invalid token                    │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Routes: users.js (Request Handler)                │  │
│  │                                                           │  │
│  │  GET    /api/users        → Get all users (admin)        │  │
│  │  GET    /api/users/:id    → Get one user                 │  │
│  │  PUT    /api/users/:id    → Update user                  │  │
│  │  DELETE /api/users/:id    → Delete user                  │  │
│  │  PUT    /api/users/:id/role → Change user role (admin)   │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Model: User.js (Data Structure)                   │  │
│  │                                                           │  │
│  │  Defines:                                                 │  │
│  │  • name (required)                                       │  │
│  │  • email (required, unique)                              │  │
│  │  • password (required)                                   │  │
│  │  • role (user/trainer/admin)                             │  │
│  │  • bio, phone, location, etc.                            │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Users Collection                       │  │
│  │                                                           │  │
│  │  {                                                        │  │
│  │    _id: "123",                                           │  │
│  │    name: "John Doe",                                     │  │
│  │    email: "john@email.com",                              │  │
│  │    password: "hashed_password",                          │  │
│  │    role: "user",                                         │  │
│  │    ...                                                   │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow Diagram

### Example 1: User Views Their Profile

```
┌─────────────┐
│   Browser   │
│ Dashboard.jsx│
└──────┬──────┘
       │
       │ 1. User clicks "My Profile"
       │    handleViewProfile() runs
       │
       │ 2. axios.get('/api/users/123')
       │    Headers: { 'x-auth-token': 'abc123' }
       │
       ▼
┌─────────────────────────────────────┐
│         HTTP Request                 │
│  GET /api/users/123                  │
│  Header: x-auth-token: abc123        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      server.js receives request      │
│  Routes to: /api/users/:id           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      auth.js middleware              │
│  ✓ Token exists? Yes                 │
│  ✓ Token valid? Yes                  │
│  ✓ Decoded: { user: { id: "123" } } │
│  → req.user = { id: "123" }          │
│  → next() (continue)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      users.js route handler          │
│  router.get('/:id', ...)             │
│                                      │
│  Check: req.user.id === "123"        │
│         req.params.id === "123"      │
│  ✓ Permission granted                │
│                                      │
│  User.findById("123")                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      MongoDB Database                │
│  Find user with _id: "123"           │
│                                      │
│  Returns:                            │
│  {                                   │
│    _id: "123",                       │
│    name: "John Doe",                 │
│    email: "john@email.com",          │
│    password: "hashed...",            │
│    role: "user"                      │
│  }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      users.js route handler          │
│  .select('-password')                │
│  Removes password from response      │
│                                      │
│  res.json({                          │
│    success: true,                    │
│    user: {                           │
│      _id: "123",                     │
│      name: "John Doe",               │
│      email: "john@email.com",        │
│      role: "user"                    │
│      // NO PASSWORD!                 │
│    }                                 │
│  })                                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      HTTP Response                   │
│  Status: 200 OK                      │
│  Body: { success: true, user: {...} }│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Dashboard.jsx                   │
│  response.data.user received         │
│  setUserProfile(response.data.user)  │
│  Screen updates automatically!       │
└─────────────────────────────────────┘
```

### Example 2: User Books a Session

```
┌─────────────┐
│   Browser   │
│ Dashboard.jsx│
└──────┬──────┘
       │
       │ 1. User clicks "Book Session"
       │    handleBookSession(trainerId)
       │
       │ 2. Modal opens, user fills form
       │
       │ 3. User clicks "Submit"
       │    handleBookingSubmit() runs
       │
       │ 4. axios.post('/api/bookings', {
       │      trainerId: "456",
       │      sessions: [...],
       │      userId: "123"
       │    })
       │
       ▼
┌─────────────────────────────────────┐
│      server.js                       │
│  Routes to: /api/bookings            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      auth.js middleware              │
│  ✓ Token valid? Yes                  │
│  → req.user = { id: "123" }          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      bookings.js route handler       │
│  Validation:                         │
│  ✓ Date valid? Yes                   │
│  ✓ Time valid? Yes                   │
│  ✓ Trainer exists? Yes               │
│                                      │
│  Create booking in database          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      MongoDB Database                │
│  Booking.create({ ... })             │
│  Saves booking                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      HTTP Response                   │
│  { success: true, booking: {...} }   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Dashboard.jsx                   │
│  alert('Booking created!')           │
│  Close modal                         │
└─────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
┌─────────────┐
│   User      │
│  Logs In    │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { email: "...", password: "..." }
       │
       ▼
┌─────────────────────────────────────┐
│      Server validates credentials    │
│  ✓ Email exists?                     │
│  ✓ Password correct?                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Server creates JWT token        │
│  jwt.sign({                          │
│    user: { id: "123", role: "user" } │
│  }, SECRET_KEY)                      │
│                                      │
│  Returns: "eyJhbGciOiJIUzI1NiIs..."  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Browser stores token            │
│  localStorage.setItem('token', ...)  │
└─────────────────────────────────────┘

       ┌───────────────────────────┐
       │   For every request:       │
       │                            │
       │   1. Get token from        │
       │      localStorage          │
       │                            │
       │   2. Add to request header │
       │      'x-auth-token': token │
       │                            │
       │   3. Server verifies token │
       │                            │
       │   4. If valid: Allow       │
       │   5. If invalid: Block     │
       └───────────────────────────┘
```

## 📁 File Relationships

```
Dashboard.jsx (Frontend)
    │
    │ Uses axios to make requests
    │
    ├───► GET /api/trainers
    │         │
    │         └───► trainers.js (routes)
    │                   │
    │                   └───► Trainer.js (model)
    │                             │
    │                             └───► MongoDB
    │
    ├───► GET /api/users/:id
    │         │
    │         └───► users.js (routes)
    │                   │
    │                   ├───► auth.js (middleware) ──┐
    │                   │                             │
    │                   └───► User.js (model)        │
    │                             │                  │
    │                             └───► MongoDB      │
    │                                              │
    └───► POST /api/bookings                       │
              │                                    │
              └───► bookings.js (routes)          │
                        │                          │
                        ├───► auth.js (middleware)─┘
                        │    (checks token)
                        │
                        └───► Booking.js (model)
                                  │
                                  └───► MongoDB
```

## 🎯 Key Points

1. **Frontend (Dashboard.jsx)** makes requests
2. **Middleware (auth.js)** checks security FIRST
3. **Routes (users.js)** handle the request
4. **Model (User.js)** defines data structure
5. **Database (MongoDB)** stores the data

**Every request follows this path:**
```
Browser → Server → Middleware → Route → Model → Database
                ← Response ←───────────────←───────────
```

## 🛡️ Security Layers

```
Layer 1: Browser
  └─── Token stored in localStorage
       (Only accessible by same origin)

Layer 2: HTTPS
  └─── Encrypted connection
       (Data can't be intercepted)

Layer 3: Auth Middleware
  └─── Checks token on every request
       (Blocks unauthorized access)

Layer 4: Route Permissions
  └─── Checks if user can do action
       (Owner or admin only)

Layer 5: Database
  └─── Password never sent back
       (Hashed and secure)
```

## 📊 Data Flow Summary

```
CREATE USER:
Frontend → POST /api/auth/register
         → Server creates user
         → Database saves user
         → Server sends token
         → Frontend stores token

VIEW PROFILE:
Frontend → GET /api/users/:id (with token)
         → Auth checks token
         → Route gets user from database
         → Server sends user (no password)
         → Frontend displays user

UPDATE PROFILE:
Frontend → PUT /api/users/:id (with token + data)
         → Auth checks token
         → Route validates data
         → Route updates user in database
         → Server sends updated user
         → Frontend updates display

BOOK SESSION:
Frontend → POST /api/bookings (with token + booking data)
         → Auth checks token
         → Route validates booking
         → Route creates booking in database
         → Server sends confirmation
         → Frontend shows success message
```

