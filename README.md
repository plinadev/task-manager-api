# Task Manager API

A RESTful API for managing tasks, labels, and user accounts — built with [NestJS](https://nestjs.com/), TypeORM, and PostgreSQL.

## Features

* User registration and login with JWT authentication
* Role-based authorization (Admin & User)
* CRUD operations for tasks and task labels
* Support for multiple labels per task
* Task filtering, pagination, and status updates
* Fully tested with E2E and unit tests
* Modular and scalable project structure

---

## Tech Stack

* **Framework:** [NestJS](https://nestjs.com/)
* **Database:** PostgreSQL (via TypeORM)
* **Auth:** JWT 
* **Validation:** `class-validator`, `Joi` schemas
* **Testing:** Jest + Supertest
* **Environment Config:** `@nestjs/config`

---

## Installation

```bash
git clone https://github.com/plinadev/task-manager-api.git
cd task-manager-api
npm install
```

---

## Environment Variables

Create a `.env` file in the root and configure:

```env
# App
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_DATABASE=task_manager

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=3600s
```

---

## Running the App

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

## Running Tests

### Unit & E2E tests:

```bash
# Unit
npm run test

# E2E
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📁 Project Structure

```
src/
├── auth/               # Auth & JWT logic
├── config/             # App configuration modules
├── tasks/              # Tasks, Labels, DTOs
├── users/              # Users, roles, services
├── common/             # Guards, decorators, pipes, exceptions
├── main.ts             # Entry point
└── app.module.ts       # Root module
```

---

## Authentication & Authorization

* **JWT Authentication** via `Bearer` tokens.
* **Role-based access control (RBAC)** using custom guards.
* Admin-only endpoints are protected via `@Roles(Role.ADMIN)` decorator.

---

## API Endpoints

Sample endpoints:

| Method | Endpoint         | Auth     | Description                  |
| ------ | ---------------- | -------- | ---------------------------- |
| POST   | `/auth/register` | ❌ Public | Register new user            |
| POST   | `/auth/login`    | ❌ Public | Login and receive JWT token  |
| GET    | `/auth/profile`  | ✅ User   | Get logged-in user info      |
| GET    | `/auth/admin`    | ✅ Admin  | Admin-only example endpoint  |
| GET    | `/tasks`         | ✅ User   | Get all tasks (with filters) |
| POST   | `/tasks`         | ✅ User   | Create new task              |
| PATCH  | `/tasks/:id`     | ✅ User   | Update task status/labels    |
| DELETE | `/tasks/:id`     | ✅ User   | Delete task                  |

---

