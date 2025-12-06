# ERP Frontend Client

React application for the SMB SaaS ERP, built with Vite.

## Setup

```bash
cd client
npm install
npm run dev
```

## Features

*   **Dashboard Layout**: Persistent sidebar navigation.
*   **Protected Routes**: Requires login to access ERP modules.
*   **Modules**:
    *   **Dashboard**: Real-time sales metrics, customer counts, and low-stock alerts.
    *   **Customers**: Manage client database.
    *   **Inventory**: Track stock and products.
    *   **Sales**: Create and manage orders.
    *   **Users**: Admin-only user management (RBAC).

## Project Structure

*   `src/components/DashboardLayout.jsx`: Main layout wrapper.
*   `src/pages/`: Individual module pages (Dashboard, Customers, etc.).
*   `src/api/`: Centralized API service functions.

## Testing

Run unit tests with Vitest:

```bash
npm test
# Coverage
npm run test:coverage
```
