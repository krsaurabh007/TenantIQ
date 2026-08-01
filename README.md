# 🚀 TenantIQ — Multi-Tenant SaaS Platform

A production-ready **full-stack multi-tenant SaaS application** that enables organizations to manage projects, collaborate with teams, and monitor performance while ensuring **complete tenant isolation** using **PostgreSQL Schema-Based Multi-Tenancy**.

> Built with **React • Node.js • Express • PostgreSQL • Sequelize • TypeScript**

---

## 🌐 Live Demo

| Service | Link |
|---------|------|
| **Frontend** | https://tenantiq-frontend.vercel.app |
| **Backend API** | https://tenantiq-backend.onrender.com |

> **Note:** The backend is hosted on Render's free tier and may take **30–50 seconds** to wake up on the first request.

---

# 🔑 Demo Account

Instead of creating a new company, use the demo account below.

| Field | Value |
|------|------|
| Company | NovaTech Solutions |
| Email | admin@novatech.com |
| Password | 123456 |

> Or register your own company to experience automatic PostgreSQL schema creation and tenant isolation.

---

# ✨ Features

## 🔐 Authentication & Authorization

- Company registration with automatic tenant schema creation
- JWT Authentication
- Access Token + Refresh Token
- Refresh token stored in HttpOnly Cookies
- Role-Based Access Control
- Secure authentication middleware

---

## 👥 Team Management

- Invite members via email
- Manager & Viewer roles
- Accept invitation workflow
- Member management

---

## 📁 Project Management

- Create projects
- Kanban board
- Drag & Drop tasks
- Task priorities
- Due dates
- Task assignment

---

## 📊 Analytics Dashboard

- Project statistics
- Task completion trends
- Top performers
- Project progress visualization

---

## 🏢 Multi-Tenant Architecture

- PostgreSQL Schema-Based Multi-Tenancy
- Automatic schema provisioning
- Shared public schema
- Complete tenant data isolation
- Zero cross-tenant data leakage

---

# 🏗 System Architecture

```text
                 React + TypeScript
                        │
                    Axios API
                        │
                Express.js Backend
                        │
        Tenant Context Middleware
                        │
          Sequelize ORM + PostgreSQL
                        │
        Schema-Based Multi-Tenancy
```

---

# 🗄 Database Architecture

```text
tenantiq
│
├── public
│   ├── tenants
│   └── users
│
├── tenant_novatech
│   ├── users
│   ├── projects
│   ├── tasks
│   ├── invites
│   └── project_members
│
├── tenant_company_b
│   ├── users
│   ├── projects
│   ├── tasks
│   ├── invites
│   └── project_members
```

Each organization receives its **own PostgreSQL schema**, ensuring complete isolation of application data while sharing a common application instance.

---

# 🛠 Tech Stack

## Frontend

| Technology | Purpose |
|------------|----------|
| React 18 | UI Framework |
| TypeScript | Static Typing |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Zustand | Global State |
| React Query | Server State Management |
| React Router v6 | Routing |
| Recharts | Analytics Charts |
| @hello-pangea/dnd | Kanban Drag & Drop |

---

## Backend

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | REST API |
| PostgreSQL | Database |
| Sequelize | ORM |
| JWT | Authentication |
| bcryptjs | Password Hashing |
| express-validator | Validation |
| cookie-parser | Cookie Management |

---

## Infrastructure

| Service | Purpose |
|---------|----------|
| Vercel | Frontend Hosting |
| Render | Backend Hosting |
| Supabase | PostgreSQL Database |
| GitHub Actions | CI/CD |

---

# 📸 Application Screenshots

> Screenshots will be added here.

- Login
- Dashboard
- Projects
- Kanban Board
- Team Management
- Analytics

---

# 🚀 Running Locally

## Prerequisites

- Node.js 18+
- PostgreSQL
- Git

---

## Backend

```bash
git clone https://github.com/krsaurabh007/TenantIQ.git

cd TenantIQ/tenantiq-backend

npm install

cp .env.example .env

npm run dev
```

---

## Frontend

```bash
cd TenantIQ/tenantiq-frontend

npm install

npm run dev
```

Open:

```
http://localhost:5173
```

---

# 📁 Project Structure

```text
TenantIQ
│
├── tenantiq-frontend
│
│   ├── src
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── api
│   └── store
│
├── tenantiq-backend
│
│   ├── middleware
│   ├── modules
│   ├── config
│   ├── utils
│   └── server.js
```

---

# 🎯 Future Improvements

- Email notifications
- Activity logs
- Audit history
- File uploads
- WebSocket real-time updates
- Microservices migration
- Kubernetes deployment
- AWS Infrastructure

---

# 👨‍💻 Author

**Saurabh Kumar**

- GitHub: https://github.com/krsaurabh007
- LinkedIn: https://linkedin.com/in/saurabh-kumar-99009b24a
- Email: saurabhkumar4040@gmail.com

---

⭐ If you found this project useful, consider giving it a star.
