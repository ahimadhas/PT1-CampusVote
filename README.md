# CampusPortal — Student Polling & Election Management System

A full-stack web application built on the MERN stack for university student elections and campus polling.

---

## Features

- Create and manage **Student Council**, **Class Representative**, **Club**, and **General Opinion** polls
- **Candidates are real registered accounts** — an admin builds a poll by selecting from registered candidate users, not by typing free-text names
- Secure, authenticated voting — **one student = exactly one verified vote**
- **Database-level unique compound index** on `{ pollId, userId }` prevents duplicate votes even under race conditions
- **Results strictly hidden** while a poll is active — backend API returns 403, not just CSS hiding
- **MongoDB aggregation pipeline** computes vote tallies once a poll is closed
- Percentage breakdowns, winner callouts, and full result publication
- Admin poll management: create, edit, close, and delete polls
- Admin user management: view, change role, and remove accounts

### Security & Authorization
- **JWT authentication** with `Authorization: Bearer <token>` header
- **bcrypt password hashing** (never stored as plaintext)
- **Role-based access control**: `admin`, `student`, `candidate` — chosen at registration. Note: public self-registration as `admin` is intentionally enabled for this deployment (a deliberate trade-off for ease of setup); anyone visiting the site can create an administrator account. If you deploy this publicly, you likely want to close that off again.
- Backend middleware (`authorizeRoles`) guards every sensitive endpoint
- Protected React routes redirect unauthenticated users to login

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (v3) |
| Icons | Lucide React |
| Routing | React Router v7 |
| HTTP Client | Axios (with JWT interceptor) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| In-memory DB | mongodb-memory-server (auto-fallback for dev) |

---

## Project Structure

```
student-platform/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, ProtectedRoute, PollCard, EmptyState, LoadingSpinner, Modal
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── pages/            # Login, Register, Dashboard, Polls, Results, AdminUsers, NotFound
│   │   ├── services/         # api.js (centralized Axios)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── config/
│   │   ├── db.js             # MongoDB connection + in-memory fallback
│   │   └── jwt.js            # JWT secret resolution (fails fast if unset)
│   ├── controllers/          # authController, pollController, voteController, adminController
│   ├── middleware/           # authMiddleware, roleMiddleware, errorMiddleware
│   ├── models/                # Mongoose models (User, Poll, Vote)
│   ├── routes/                # Express route definitions
│   ├── scripts/
│   │   └── createAdmin.js    # One-time CLI to provision the first real admin account
│   ├── tests/
│   │   └── api.test.js       # Automated test assertions
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Installation & Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd campus-vote

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### 2. Configure Environment Variables

```bash
# Copy the example env file to backend
cp .env.example backend/.env
```

Edit `backend/.env` with your settings:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/campus_vote   # Leave blank for auto-embedded MongoDB
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
```

> **Note:** `JWT_SECRET` is required — the server will refuse to start without it. If `MONGO_URI` is left blank or the MongoDB server is unreachable, the backend will **automatically spin up an embedded in-memory MongoDB instance** using `mongodb-memory-server`. This is convenient for a quick local run, but its data does not persist between restarts — configure a real, persistent `MONGO_URI` if you want accounts and polls to survive a server restart.

### 3. Create Your Accounts

There is no seed data. Register directly from the app — the Register page lets you pick an account type (**Student**, **Candidate**, or **Administrator**):

- Register as **Administrator** to manage polls and users.
- Register as **Candidate** if you want the account to be selectable when an admin builds a poll.
- Register as **Student** to vote.

Alternatively, `backend/scripts/createAdmin.js` is still available as a non-web way to provision an admin from real credentials you supply:

```bash
cd backend
npm run create-admin -- --name "Your Name" --email "admin@yourdomain.edu" --password "a-real-password"
```

Additional accounts can be promoted or changed later from the Admin → User Management screen.

### 4. Run Development Servers

```bash
# Terminal 1 - Backend (port 5000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser. The database starts completely empty — register your accounts from the app to get started.

---

## API Endpoints

### Authentication
```
POST /api/auth/register     Register new account (role: admin | student | candidate)
POST /api/auth/login        Login, receive JWT
GET  /api/auth/me           Get current user profile
```

### Polls
```
GET    /api/polls            List polls (optional ?status=active|closed)
GET    /api/polls/:id        Get single poll
POST   /api/polls            Create poll [Admin only] — options: [{ candidateId, description }]
PUT    /api/polls/:id        Update poll metadata (title/description/category) [Admin only]
PATCH  /api/polls/:id/close  Close poll & reveal results [Admin only]
DELETE /api/polls/:id        Delete poll + votes [Admin only]
GET    /api/polls/:id/results    Aggregated results (403 if active)
POST   /api/polls/:id/vote   Cast vote [Any authenticated user]
GET    /api/polls/:id/my-vote   Check if user has voted
```

Poll options always reference a real, registered `candidate` account (`candidateId`) — the admin picks from `GET /api/admin/users?role=candidate` when building a poll. The API resolves and returns each option's `name` from the referenced candidate automatically.

### Admin
```
GET    /api/admin/stats        Dashboard KPI statistics
GET    /api/admin/users        All registered users (filterable)
PATCH  /api/admin/users/:id/role  Change user role
DELETE /api/admin/users/:id    Delete user + cleanup
```

---

## Running Tests

The automated test suite covers all critical business rules:

```bash
cd backend
npm test
```

**Tests included:**
- ✅ bcrypt password hashing & verification
- ✅ Password stripped from JSON responses
- ✅ Email uniqueness constraint
- ✅ Poll creation and status, with options referencing real candidate accounts
- ✅ One vote per user (first vote succeeds)
- ✅ MongoDB unique compound index rejects duplicate votes
- ✅ Active poll results are restricted
- ✅ Poll closure and result aggregation (MongoDB `$group` pipeline)

---

## Security Implementation

| Security Feature | Implementation |
|-----------------|----------------|
| Password Storage | bcryptjs with salt rounds of 10 |
| Authentication | JWT (7-day expiry), Bearer token |
| Authorization | Server-side `authorizeRoles()` middleware |
| Poll Options | Always reference a real registered `candidate` account, validated server-side on poll creation |
| Vote Integrity | Unique compound index `{ pollId, userId }` in MongoDB |
| Result Privacy | Backend returns 403 for active poll results |
| Input Validation | Mongoose schema validators + Express request validation |
| CORS | Configured to allow only `CLIENT_URL` |
| Error Messages | Generic user-friendly messages (no stack traces in production) |

---

## Environment Variables Reference

| Variable | Required | Description |
|---------|----------|-------------|
| `PORT` | No | Express server port (default: 5000) |
| `MONGO_URI` | No | MongoDB connection string (auto-fallback if empty) |
| `JWT_SECRET` | **Yes** | Secret key for JWT signing — server refuses to start without it |
| `CLIENT_URL` | No | Frontend URL for CORS (default: *) |
| `NODE_ENV` | No | `development` or `production` |

---

## License

Educational/demonstration purposes. Not for production use without proper security audit.
