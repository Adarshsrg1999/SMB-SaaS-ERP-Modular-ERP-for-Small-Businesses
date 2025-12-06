# SMB SaaS ERP

A modular Enterprise Resource Planning (ERP) system designed for small businesses. This full-stack application helps manage customers, inventory, and sales workflows (Quotations, Orders, Invoices).

## Features

*   **Role-Based Access Control (RBAC)**: Secure login for Admins and Staff.
*   **Admin Console**: (Beta) Dedicated administration tab with database reset and system maintenance tools.
*   **Dashboard**: Real-time overview of sales, customers, and stock alerts.
*   **User Management**: create, edit, and **bulk delete** (Beta) users with visual role badges.
*   **Customer Management**: CRM module to track client details.
*   **Inventory Management**: Product catalog with stock tracking and low-stock alerts.
*   **Sales Workflow**: Create Quotations, convert to Orders, and generate Invoices.

## Tech Stack

### **Frontend (/client)**
*   Framework: React 19
*   Build Tool: Vite
*   Routing: React Router DOM
*   Testing: Vitest, React Testing Library
*   Language: JavaScript (ES Modules)

### **Backend (/server)**
*   Runtime: Node.js
*   Framework: Express.js
*   Database: SQLite (sqlite3)
*   Authentication: JWT (jsonwebtoken) & Bcrypt
*   Testing: Jest & Supertest

### **Root / DevOps**
*   Orchestration: concurrently (runs client and server simultaneously)
*   Package Manager: npm

## Quick Start

### 1. Install Dependencies
Run this command in the root directory to install dependencies for both client and server:
```bash
npm install
```

### 2. Run Tests
To run tests with code coverage reports:
```bash
# Client Coverage (32%)
cd client
npm run test:coverage

# Server Coverage (95%+ functions)
cd server
npm run test:coverage
```

**Current Test Coverage:**
- Server: 95.08% function coverage, 90.78% line coverage
- Client: 32% coverage

### 3. Run the Application
Start both the backend and frontend concurrently from the root directory:
```bash
npm run dev
```

*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend**: [http://localhost:5000](http://localhost:5000)

### 4. Default Login
*   **Email**: `admin@erp.com`
*   **Password**: `admin123`

## Project Structure

*   **`client/`**: React frontend with a Dashboard layout and module pages.
*   **`server/`**: Express API with modular routes (`routes/`) and SQLite database.
*   **`server/erp.db`**: Local SQLite database file (Automatically created on first run, ignored by Git).

## Data and Metrics
The **Dashboard** displays live data from the database, including:
- **Total Customers**
- **Sales Today & This Week**
- **Total Products**
- **Low Stock Alerts**: Automatically lists items where stock <= minimum level.
