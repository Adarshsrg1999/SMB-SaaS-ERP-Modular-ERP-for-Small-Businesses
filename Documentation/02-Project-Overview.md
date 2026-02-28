# SMB SaaS ERP
## Comprehensive Business Management Solution

### Overview
**SMB SaaS ERP** is a modern, modular Enterprise Resource Planning system designed specifically for small and medium businesses. It unifies your core business processes—customer management, inventory tracking, and sales workflows—into a single, easy-to-use platform with real-time notifications and comprehensive security.

Stop juggling spreadsheets and disconnected tools. Gain real-time visibility into your business performance, receive instant alerts, and streamline your daily operations.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Features in Detail](#features-in-detail)
6. [API Documentation](#api-documentation)
7. [Security](#security)
8. [Testing](#testing)
9. [Recent Updates](#recent-updates)
10. [Contributing](#contributing)

---

## Key Features

### 📊 Real-Time Dashboard
Get a bird's-eye view of your business immediately upon login.
*   **Live Metrics**: See total sales for the day and week instantly.
*   **Customer Growth**: Track your total active customer base.
*   **Inventory Overview**: Monitor total products in your catalog.
*   **Smart Alerts**: Automatically flags products that are running low on stock so you never miss a sale.
*   **Performance Analytics**: Visual insights into business trends.

### 👥 Customer Relationship Management (CRM)
Centralize your customer data to build better relationships.
*   **Digital Rolodex**: Store names, emails, phones, and addresses in one secure place.
*   **Searchable Database**: Quickly find customer details when on a call or drafting an order.
*   **GST/Tax Info**: Manage tax identifiers for compliant invoicing.
*   **CRUD Operations**: Create, Read, Update, and Delete customer records.
*   **Sorting & Filtering**: Organize customers alphabetically for easy access.

### 📦 Smart Inventory Management
Take control of your stock and eliminate guesswork.
*   **Product Catalog**: Maintain detailed records of all your products, including SKUs and pricing.
*   **Stock Tracking**: Real-time updates to stock levels as you buy and sell.
*   **Inventory Logs**: Complete audit trail of all stock movements (in/out).
*   **Low Stock Warnings**: The system proactively notifies you when items dip below your defined minimum levels.
*   **Stock Adjustments**: Easy interface for adding or removing stock with reasons.

### 💰 Sales Automation Workflow
Streamline your path from "Interested" to "Paid".
*   **Quotations**: Create professional price quotes for potential clients.
*   **Order Conversion**: Convert approved quotes into active orders with a single click.
*   **Invoicing**: Generate final invoices for payment, ensuring accurate financial records.
*   **Multi-Item Support**: Add multiple products to a single document.
*   **Automatic Calculations**: Total amounts calculated automatically.
*   **Status Tracking**: Monitor document status (pending, confirmed, cancelled).

### 🔔 Telegram Notifications (NEW!)
Stay informed with real-time alerts delivered to your Telegram.
*   **Login Alerts**: Receive instant notifications when users log in to the system.
*   **Rich Information**: Notifications include username, email, timestamp (IST), and IP address.
*   **Security Monitoring**: Track login activity for security purposes.
*   **Fire-and-Forget**: Non-blocking notifications that never disrupt user experience.
*   **Graceful Degradation**: System works perfectly even if Telegram is unavailable.

### 🔒 Enterprise-Grade Security
Built with security and hierarchy in mind.
*   **Granular Role Management**: Define access precisely for your entire ecosystem.
    *   **Admins**: Full control over system settings, user management (Staff, Customers, Vendors), and all modules.
    *   **Staff**: Focused access to core operations like sales and inventory.
    *   **Customers**: Dedicated accounts for customer portal access.
    *   **Vendors**: Dedicated accounts for vendor management.
*   **JWT Authentication**: Industry-standard token-based authentication.
*   **Password Encryption**: Bcrypt hashing for secure password storage.
*   **Role-Based Access Control (RBAC)**: Middleware-enforced permissions.
*   **Session Management**: 24-hour token expiry for security.

---

## Technology Stack

### Frontend
*   **React 18** - Modern UI library with hooks
*   **React Router v6** - Client-side routing
*   **Vite** - Lightning-fast build tool and dev server
*   **Vitest** - Unit testing framework
*   **Testing Library** - Component testing utilities
*   **CSS3** - Custom styling with animations

### Backend
*   **Node.js** - JavaScript runtime
*   **Express 5** - Web application framework
*   **SQLite3** - Embedded relational database
*   **JWT (jsonwebtoken)** - Authentication tokens
*   **Bcrypt** - Password hashing
*   **dotenv** - Environment variable management
*   **CORS** - Cross-origin resource sharing

### Development Tools
*   **ESLint** - Code linting
*   **Husky** - Git hooks
*   **Jest** - Backend testing framework
*   **Supertest** - HTTP assertion library
*   **Nodemon** - Auto-restart dev server

### External Services
*   **Telegram Bot API** - Real-time notifications

---

## Project Structure

```
SMB-SaaS-ERP/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # React Context providers
│   │   ├── pages/              # Page components
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── public/                 # Static assets
│   ├── tests/                  # Frontend tests
│   └── package.json
│
├── server/                      # Backend Node.js application
│   ├── routes/                 # API route handlers
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── customers.js        # Customer CRUD
│   │   ├── inventory.js        # Product & stock management
│   │   ├── sales.js            # Sales documents
│   │   ├── users.js            # User management (admin)
│   │   └── dashboard.js        # Dashboard metrics
│   ├── services/               # Business logic services
│   │   └── telegramService.js  # Telegram notifications
│   ├── middleware/             # Express middleware
│   │   └── authMiddleware.js   # JWT verification & RBAC
│   ├── tests/                  # Backend tests
│   ├── database.js             # Database initialization
│   ├── server.js               # Express app setup
│   └── package.json
│
├── .env.example                # Environment variables template
├── 04-API-Documentation.md      # Complete API reference
├── 03-Telegram-Setup-Guide.md  # Telegram bot setup guide
├── 01-README.md                # Project readme
└── package.json                # Root package.json
```

---

## Getting Started

### Prerequisites
*   Node.js 16+ and npm
*   Git
*   (Optional) Telegram account for notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SMB-SaaS-ERP.git
   cd SMB-SaaS-ERP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example file
   cp .env.example server/.env
   
   # Edit server/.env and add your credentials
   # Required: SECRET_KEY
   # Optional: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
   ```

4. **Start the development servers**
   
   **Option 1: Start both servers together (from root)**
   ```bash
   npm run dev
   ```
   
   **Option 2: Start servers separately**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

5. **Access the application**
   *   Frontend: http://localhost:5173
   *   Backend API: http://localhost:5000

### First-Time Setup

1. **Create an admin account**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Admin User",
       "email": "admin@erp.com",
       "password": "admin123",
       "role": "admin"
     }'
   ```

2. **Login to the application**
   *   Navigate to http://localhost:5173
   *   Use the credentials you just created
   *   You'll receive a Telegram notification if configured!

3. **(Optional) Set up Telegram notifications**
   *   Follow the guide in [03-Telegram-Setup-Guide.md](03-Telegram-Setup-Guide.md)

---

## Features in Detail

### Authentication & Authorization

**Login Flow:**
1. User submits email and password
2. Server validates credentials
3. JWT token generated (24h expiry)
4. Telegram notification sent (if configured)
5. Token returned to client
6. Client stores token and redirects to dashboard

**Protected Routes:**
*   All API endpoints except `/api/auth/register` and `/api/auth/login` require authentication
*   Admin-only endpoints: `/api/users/*`, `/api/dashboard/reset`
*   Token must be included in `Authorization: Bearer <token>` header

### User Management (Admin Only)

Admins can:
*   View all users
*   Create new users with any role
*   Update user details (name, email, role, password)
*   Delete users (except themselves)
*   Assign roles: admin, staff, customer, vendor

### Customer Management

**Features:**
*   Add new customers with complete contact information
*   Update customer details
*   Delete customers
*   Search and filter customers
*   Store GST/tax information
*   View customer history

**Data Fields:**
*   Name, Email, Phone, Address, GST Number

### Inventory Management

**Product Management:**
*   Add products with SKU, price, description
*   Set minimum stock levels
*   Track current stock quantity
*   Update product details

**Stock Adjustments:**
*   Stock In: Purchases, returns, adjustments
*   Stock Out: Sales, damage, theft
*   Automatic logging of all transactions
*   Reason tracking for audit trail

**Low Stock Alerts:**
*   Dashboard shows products below minimum level
*   Proactive warnings prevent stockouts

### Sales Documents

**Document Types:**
1. **Quotation** - Price quote for customer (status: pending)
2. **Order** - Confirmed order (status: confirmed)
3. **Invoice** - Final invoice for payment (status: confirmed)

**Workflow:**
1. Create quotation for customer
2. Convert to order when approved
3. Generate invoice for payment
4. Track status throughout lifecycle

**Features:**
*   Multi-line items per document
*   Automatic total calculation
*   Customer association
*   Status tracking
*   Filter by document type

### Dashboard Analytics

**Metrics Displayed:**
*   Total Customers
*   Total Products
*   Sales Today (confirmed orders/invoices)
*   Sales This Week (last 7 days)
*   Low Stock Items (detailed list)

**Admin Tools:**
*   Database Reset (clears all data except admin accounts)
*   System health monitoring

### Telegram Notifications

**Setup:**
1. Create bot via @BotFather
2. Get Chat ID from @userinfobot
3. Configure in `.env` file
4. Restart server

**Notification Format:**
```
🔐 Login Alert

👤 User: John Doe
📧 Email: john@example.com
🕒 Time: 7 Feb 2026, 9:31:36 pm
🌐 IP Address: 192.168.1.100
```

**Technical Details:**
*   Uses native Node.js `https` module
*   No additional dependencies
*   Fire-and-forget async pattern
*   Comprehensive error handling
*   Never blocks login flow

---

## API Documentation

Complete API documentation is available in [04-API-Documentation.md](04-API-Documentation.md).

### Quick Reference

**Authentication:**
*   `POST /api/auth/register` - Register new user
*   `POST /api/auth/login` - Login and get token

**Users (Admin Only):**
*   `GET /api/users` - List all users
*   `POST /api/users` - Create user
*   `PUT /api/users/:id` - Update user
*   `DELETE /api/users/:id` - Delete user

**Customers:**
*   `GET /api/customers` - List all customers
*   `POST /api/customers` - Add customer
*   `PUT /api/customers/:id` - Update customer
*   `DELETE /api/customers/:id` - Delete customer

**Inventory:**
*   `GET /api/inventory` - List all products
*   `POST /api/inventory` - Add product
*   `POST /api/inventory/:id/stock` - Adjust stock

**Sales:**
*   `GET /api/sales` - List all documents
*   `POST /api/sales` - Create document
*   `PATCH /api/sales/:id/status` - Update status

**Dashboard:**
*   `GET /api/dashboard/metrics` - Get metrics
*   `POST /api/dashboard/reset` - Reset database (admin)

---

## Security

### Best Practices Implemented

1. **Password Security**
   *   Bcrypt hashing with salt rounds
   *   Never stored in plain text
   *   Never returned in API responses

2. **Token Security**
   *   JWT with secret key
   *   24-hour expiration
   *   Signed and verified on every request

3. **Environment Variables**
   *   Sensitive data in `.env` file
   *   `.env` excluded from Git
   *   `.env.example` for documentation

4. **Role-Based Access Control**
   *   Middleware enforcement
   *   Granular permissions
   *   Admin-only endpoints protected

5. **Input Validation**
   *   Required field checks
   *   Email uniqueness validation
   *   SQL injection prevention (parameterized queries)

6. **CORS Configuration**
   *   Controlled cross-origin access
   *   Configurable allowed origins

### Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT tokens with expiration
- [x] Environment variables for secrets
- [x] Role-based access control
- [x] Parameterized SQL queries
- [x] CORS enabled
- [x] HTTPS ready (production)
- [x] No sensitive data in logs
- [x] No credentials in Git

---

## Testing

### Backend Tests

**Coverage:**
*   Function Coverage: 95.08%
*   Test Suites: 4
*   Total Tests: 33

**Run Tests:**
```bash
cd server
npm test
```

**Run with Coverage:**
```bash
npm run test:coverage
```

**Test Files:**
*   `tests/api.test.js` - Basic API tests
*   `tests/users.test.js` - User management tests
*   `tests/dashboard.test.js` - Dashboard metrics tests
*   `tests/full_coverage.test.js` - Comprehensive coverage tests

### Frontend Tests

**Coverage:**
*   Coverage: 32%
*   Focus: API integration tests

**Run Tests:**
```bash
cd client
npm test
```

**Run with Coverage:**
```bash
npm run test:coverage
```

### Manual Testing

Use the complete testing workflow in [04-API-Documentation.md](04-API-Documentation.md) for manual testing with curl or Postman.

---

## Recent Updates

### v1.4 - Analytics & Staff Efficiency (Latest - Feb 2026)
*   **Analytics Engine**:
    *   Automated profit margin calculations on all sales.
    *   Interactive analytics dashboard with sales trends and performance indicators.
*   **Data Portability**:
    *   Bulk data export functionality to CSV, Excel, and PDF.
    *   Standardized report generation for accounting.
*   **Staff Operations**:
    *   Universal Task Management system for daily operations.
    *   In-app Notification Inbox for system alerts.
    *   Individual Sales Target setting and tracking.
*   **Supply Chain 2.0**:
    *   Multi-warehouse support with per-location stock levels.
    *   Product categorization and tagging system.
    *   Full fulfillment workflow (Packed → Shipped → Delivered).

### v1.2 - Beta Features
*   **Advanced Administration**:
    *   Admin Dashboard with system maintenance tools
    *   Database Reset functionality (preserves admin accounts)
*   **Bulk Enhancements**:
    *   Bulk User Delete with multi-select
*   **Visual Polish**:
    *   Fixed Dark Mode text contrast issues
    *   Improved Light Mode button visibility
    *   Corrected dashboard layout alignment
*   **Quality Assurance**:
    *   Server Test Coverage: 95.08%
    *   Client Test Coverage: 32%

### v1.1 - UI/UX Overhaul
*   **Enhanced User Management**: Edit and Delete users from dashboard
*   **UI/UX Improvements**:
    *   Smooth animations for tables, cards, and forms
    *   Skeleton loading states
    *   Staggered list animations
*   **Developer Experience**: Husky git hooks for automated linting and testing

### v1.0 - Initial Release
*   Core ERP functionality
*   Customer management
*   Inventory tracking
*   Sales workflow
*   Role-based access control
*   Dashboard analytics

---

## Roadmap

### Planned Features

**v1.4 - Enhanced Notifications**
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Configurable notification preferences
- [ ] Notification history

**v1.5 - Reporting**
- [ ] Sales reports (daily, weekly, monthly)
- [ ] Inventory reports
- [ ] Customer analytics
- [ ] Export to PDF/Excel

**v1.6 - Multi-tenancy**
- [ ] Organization support
- [ ] Multi-company management
- [ ] Tenant isolation
- [ ] Subscription management

**Future Considerations**
- [ ] Mobile app (React Native)
- [ ] Barcode scanning
- [ ] Payment gateway integration
- [ ] Advanced analytics with charts
- [ ] Automated backup system
- [ ] API webhooks

---

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit with descriptive message**
   ```bash
   git commit -m "Add feature: your feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Style

*   Follow ESLint configuration
*   Use meaningful variable names
*   Add comments for complex logic
*   Write tests for new features
*   Update documentation

### Git Hooks

Pre-commit hooks automatically run:
*   ESLint on all changed files
*   Tests on backend and frontend

---

## Support & Documentation

### Documentation Files
*   [04-API-Documentation.md](04-API-Documentation.md) - Complete API reference
*   [03-Telegram-Setup-Guide.md](03-Telegram-Setup-Guide.md) - Telegram bot setup guide
*   [01-README.md](01-README.md) - Project overview

### Getting Help
*   Check documentation first
*   Review existing issues on GitHub
*   Create a new issue with detailed description
*   Include error logs and steps to reproduce

---

## License

This project is licensed under the ISC License.

---

## Acknowledgments

*   Built with modern web technologies
*   Inspired by real-world SMB needs
*   Community-driven development

---

**Ready to transform your business operations? Get started today!**

For detailed API testing, see [04-API-Documentation.md](04-API-Documentation.md)  
For Telegram setup, see [03-Telegram-Setup-Guide.md](03-Telegram-Setup-Guide.md)
