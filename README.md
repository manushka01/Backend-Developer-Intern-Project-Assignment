# ⚡ TaskFlow — Scalable REST API with Auth & RBAC

A production-ready full-stack application demonstrating secure JWT authentication, role-based access control, and CRUD operations with a React frontend.

---

## 🏗 Architecture

```
taskflow/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/       # DB connection, Swagger
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── models/       # Mongoose schemas (User, Task)
│   │   ├── routes/       # Versioned API routes
│   │   └── utils/        # JWT helpers, logger, response
│   └── Dockerfile
├── frontend/             # React.js SPA
│   ├── src/
│   │   ├── components/   # Navbar
│   │   ├── context/      # Auth state (useReducer)
│   │   ├── pages/        # Login, Register, Dashboard, Tasks, Admin
│   │   └── services/     # Axios instance + API modules
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Option A: Docker (Recommended)

```bash
git clone <your-repo-url>
cd taskflow

# Copy env and set secrets
cp backend/.env.example backend/.env

# Start everything (MongoDB + Backend + Frontend)
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api-docs

### Option B: Local Development

**Prerequisites:** Node.js 18+, MongoDB running locally

```bash
# Backend
cd backend
npm install
cp .env.example .env     # Edit MONGODB_URI and JWT secrets
npm run dev              # Runs on :5000

# Frontend (new terminal)
cd frontend
npm install
npm start                # Runs on :3000
```

---

## 🔐 Authentication Flow

```
Register/Login → JWT Access Token (15min) + Refresh Token (7d)
               ↓
Protected routes → Bearer <accessToken> in Authorization header
               ↓
Token expired? → POST /api/v1/auth/refresh with refreshToken
               ↓
Logout → Refresh token invalidated in DB
```

---

## 📋 API Reference

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register new user |
| POST | `/api/v1/auth/login` | ❌ | Login, get tokens |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/v1/auth/logout` | ✅ | Logout (invalidate refresh) |
| GET  | `/api/v1/auth/me` | ✅ | Get own profile |

### Task Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/tasks` | ✅ | any | List tasks (paginated, filterable) |
| POST | `/api/v1/tasks` | ✅ | any | Create task |
| GET | `/api/v1/tasks/:id` | ✅ | any | Get single task |
| PUT | `/api/v1/tasks/:id` | ✅ | any | Update task |
| DELETE | `/api/v1/tasks/:id` | ✅ | any | Delete task |
| PATCH | `/api/v1/tasks/:id/archive` | ✅ | admin | Archive task |
| GET | `/api/v1/tasks/stats` | ✅ | admin | Task statistics |

### User Endpoints (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| GET | `/api/v1/users/:id` | Get user by ID |
| PATCH | `/api/v1/users/:id/role` | Change user role |
| PATCH | `/api/v1/users/:id/deactivate` | Deactivate user |
| PUT | `/api/v1/users/profile` | Update own name |

---

## 🗄 Database Schema

### User
```js
{
  name: String,        // required, 2-50 chars
  email: String,       // unique, lowercase
  password: String,    // bcrypt hashed (select: false)
  role: "user"|"admin", // default: "user"
  isActive: Boolean,
  refreshToken: String, // select: false
  lastLogin: Date,
  createdAt, updatedAt  // auto
}
```

### Task
```js
{
  title: String,       // required, 3-100 chars
  description: String, // optional, max 1000
  status: "todo"|"in_progress"|"done",
  priority: "low"|"medium"|"high",
  dueDate: Date,       // must be future
  tags: [String],      // max 10
  createdBy: ObjectId, // ref: User
  assignedTo: ObjectId,// ref: User (optional)
  isArchived: Boolean,
  createdAt, updatedAt
}
```

---

## 🔒 Security Practices

| Practice | Implementation |
|----------|---------------|
| Password hashing | bcrypt with cost factor 12 |
| JWT tokens | Short-lived access (15m) + rotating refresh (7d) |
| Token storage | Refresh token stored in DB (invalidatable) |
| Rate limiting | 100 req/15min global; 20 req/15min on auth |
| Input validation | express-validator on all inputs |
| HTTP security | helmet (HSTS, XSS, noSniff, etc.) |
| CORS | Whitelist-based origin control |
| Request size | 10kb JSON body limit |
| Role enforcement | Middleware-level, not just frontend |

---

## 📈 Scalability Notes

### Horizontal Scaling
- Stateless JWT auth → multiple API instances can run behind a load balancer (nginx/ALB)
- Shared MongoDB cluster (Atlas M10+ for production)
- Sticky sessions not required

### Caching (Optional Extension)
```
Redis for:
- Token blacklisting on logout
- Response caching for GET /tasks (TTL: 30s)
- Rate limiting counters (replaces in-memory)
```

### Microservices Path
```
Current monolith → split into:
├── auth-service      (register/login/tokens)
├── task-service      (CRUD)
└── notification-svc  (email on task assignment)
Communicate via REST or message queue (RabbitMQ/SQS)
```

### Database Indexes
Defined in schemas for optimal query performance:
- `{ createdBy, status }` — filter user's tasks by status
- `{ status, priority }` — admin dashboards
- `{ createdAt: -1 }` — chronological listing

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover: auth flow, CRUD operations, role-based access enforcement.

---

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | `5000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_ACCESS_SECRET` | Access token secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:3000` |

---

## 👤 Creating an Admin User

After starting the app, register normally then promote via MongoDB:

```js
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

Built with: Node.js · Express · MongoDB · Mongoose · JWT · React · Docker
