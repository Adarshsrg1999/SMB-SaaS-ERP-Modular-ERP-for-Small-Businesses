# SMB SaaS ERP

A modular Enterprise Resource Planning (ERP) system designed for small businesses. This full-stack application helps manage customers, inventory, and sales workflows (Quotations, Orders, Invoices) with real-time Telegram notifications.

## Features

*   **Role-Based Access Control (RBAC)**: Secure login for Admins and Staff.
*   **Telegram Notifications**: Real-time alerts for logins, sales, inventory, and system events (16 notification types).
*   **Analytics Dashboard**: Profit margin tracking, sales trends, and business performance metrics.
*   **Staff Operations**: Task management, notification inbox, and personal sales targets.
*   **Inventory & Warehouse**: Multi-warehouse support, product categories/tags, and fulfillment status tracking.
*   **Sales Workflow**: Create Quotations, convert to Orders, and generate Invoices with automated profit calculation.
*   **Data Export**: Comprehensive data export to CSV, Excel, and PDF formats.
*   **Admin Console**: (Beta) Dedicated administration tab with system maintenance tools.

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
*   Notifications: Telegram Bot API (native HTTPS)
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

### 2. Configure Environment Variables (Optional)
For Telegram notifications, copy `.env.example` to `server/.env` and add your credentials:
```bash
cp .env.example server/.env
```

Edit `server/.env` and add:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
ENABLE_NOTIFICATIONS=true
```

See [03-Telegram-Setup-Guide.md](Documentation/03-Telegram-Setup-Guide.md) for detailed setup instructions.

### 3. Run Tests
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

### 4. Run the Application
Start both the backend and frontend concurrently from the root directory:
```bash
npm run dev
```

*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend**: [http://localhost:5000](http://localhost:5000)

### 5. Default Login
*   **Email**: `admin@erp.com`
*   **Password**: `admin123`

## Project Structure

*   **`client/`**: React frontend with a Dashboard layout and module pages.
*   **`server/`**: Express API with modular routes (`routes/`) and SQLite database.
*   **`server/services/`**: Business logic services including Telegram notifications.
*   **`server/erp.db`**: Local SQLite database file (Automatically created on first run, ignored by Git).

## Data and Metrics
The **Dashboard** displays live data from the database, including:
- **Total Customers**
- **Sales Today & This Week**
- **Total Products**
- **Low Stock Alerts**: Automatically lists items where stock <= minimum level.

## Notifications

The system sends real-time Telegram notifications for:
- **Security**: Login success/failure, user management, database resets
- **Inventory**: Low stock, out of stock, product additions, large adjustments
- **Sales**: New orders, large orders, quote conversions, cancellations
- **CRM**: Customer additions and deletions

See [05-Notification-Implementation-Summary.md](Documentation/05-Notification-Implementation-Summary.md) for complete details.

## Documentation

All project documentation is organized in the [`Documentation/`](Documentation/) folder:

- [📖 Documentation Index](Documentation/00-INDEX.md) - Start here for complete documentation guide
- [📘 Project Overview](Documentation/02-Project-Overview.md) - Comprehensive project details
- [🔧 API Documentation](Documentation/04-API-Documentation.md) - Complete API reference
- [📱 Telegram Setup Guide](Documentation/03-Telegram-Setup-Guide.md) - Notification setup
- [🔔 Notification Implementation](Documentation/05-Notification-Implementation-Summary.md) - Complete notification details
- [⚡ Notification Quick Reference](Documentation/06-Notification-Quick-Reference.md) - Quick lookup guide

