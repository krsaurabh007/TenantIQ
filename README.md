# TenantIQ — Multi-Tenant SaaS Platform

A full-stack multi-tenant SaaS platform where businesses can manage projects, track team performance, and view analytics — with complete data isolation between companies using PostgreSQL schema-based multi-tenancy.

## 🔗 Live Demo

| | URL |
|---|---|
| **Frontend** | https://tenantiq-frontend.vercel.app |
| **Backend** | https://tenantiq-backend.onrender.com |

> Note: Backend is on Render free tier. First request may take 50 seconds to wake up.

---

## Architecture

React Frontend (Vercel)
↓
Express Backend (Render)
↓
PostgreSQL (Supabase)

### Multi-Tenancy Architecture
Each company gets their own PostgreSQL schema on registration:
tenantiq database
│
├── public schema (shared)
│   ├── tenants      → registry of all companies
│   └── users        → registry of all admin users
│
├── tenant_company_a (Company A's private data)
│   ├── users
│   ├── projects
│   ├── tasks
│   ├── invites
│   └── project_members
│
└── tenant_company_b (Company B's private data)
├── users
├── projects
├── tasks
├── invites
└── project_members

---

## Features

### Authentication
- Company registration with auto schema creation
- JWT access token (15 min) + refresh token (7 days)
- Refresh token stored in httpOnly cookie
- Role based access control (Admin, Manager, Viewer)

### Team Management
- Invite members by email
- Role assignment (Manager / Viewer)
- Accept invite flow with auto login
- Remove members

### Project Management
- Create and manage projects
- Kanban board with drag and drop
- Task priority (Low / Medium / High)
- Task assignment to team members

### Analytics Dashboard
- Stat cards (projects, tasks, members)
- Tasks completed over time (line chart)
- Top performers (bar chart)
- Project progress bars

### Multi-Tenancy
- Schema per tenant isolation
- Zero cross-tenant data leakage
- Auto schema creation on registration
- Complete data isolation at database level

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Zustand | Global state management |
| React Query | Server state + caching |
| React Router v6 | Client side routing |
| Recharts | Analytics charts |
| @hello-pangea/dnd | Drag and drop Kanban |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| PostgreSQL + Sequelize | Database + ORM |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| express-validator | Request validation |
| cookie-parser | httpOnly cookie handling |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Supabase | PostgreSQL cloud database |
| GitHub Actions | CI/CD pipeline |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL installed locally
- Git

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/krsaurabh007/TenantIQ.git
cd TenantIQ/tenantiq-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your local PostgreSQL credentials

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd TenantIQ/tenantiq-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

### Backend
tenantiq-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize connection
│   ├── middleware/
│   │   ├── auth.js              # JWT authenticate + authorize
│   │   ├── errorHandler.js      # Global error handler
│   │   └── tenantContext.js     # Schema injector
│   ├── modules/
│   │   ├── auth/                # Register, login, refresh, logout
│   │   ├── team/                # Members, invites, roles
│   │   ├── projects/            # Projects + tasks + Kanban
│   │   └── analytics/           # Dashboard stats + charts
│   └── utils/
│       └── schemaManager.js     # Multi-tenancy core logic
└── server.js                    # Entry point


### Frontend
tenantiq-frontend/
├── src/
│   ├── api/
│   │   └── axios.ts             # Axios instance + interceptors
│   ├── components/
│   │   ├── Layout.tsx           # Sidebar + navbar
│   │   └── ProtectedRoute.tsx   # Route guard
│   ├── hooks/
│   │   ├── useAnalytics.ts      # Analytics data hooks
│   │   ├── useProjects.ts       # Projects + tasks hooks
│   │   └── useTeam.ts           # Team management hooks
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx        # Analytics dashboard
│   │   ├── Projects.tsx         # Projects list
│   │   ├── ProjectDetail.tsx    # Kanban board
│   │   ├── Team.tsx             # Team management
│   │   └── AcceptInvite.tsx     # Invite acceptance
│   ├── store/
│   │   └── authStore.ts         # Zustand auth store
│   └── types/
│       └── index.ts             # TypeScript interfaces
└── vercel.json                  # Vercel rewrite rules


## Author

**Saurabh Kumar**
- GitHub: [@krsaurabh007](https://github.com/krsaurabh007)
- LinkedIn: [saurabh-kumar](https://linkedin.com/in/saurabh-kumar-99009b24a)
- Email: saurabhkumar4040@gmail.com