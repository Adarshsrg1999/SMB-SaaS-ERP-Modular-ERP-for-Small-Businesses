# Development Guide - SMB SaaS ERP

Complete guide for developers working on the ERP system.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- Git
- SQLite3 (included with Node.js)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SMB-SaaS-ERP
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd ../client
   npm install
   ```

3. **Environment configuration**
   ```bash
   # Copy example env file
   cp server/.env.example server/.env
   
   # Edit .env with your settings
   ```

4. **Start development servers**
   
   Terminal 1 - Backend:
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 - Frontend:
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

---

## 📁 Project Structure

```
SMB-SaaS-ERP/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ui/          # UI primitives (Button, Input, etc.)
│   │   │   └── ...          # Feature components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── index.css        # Global styles
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js       # Vite configuration
│
├── server/                   # Node.js backend
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic services
│   ├── middleware/          # Express middleware
│   ├── database.js          # Database initialization
│   ├── server.js            # Express app entry
│   └── package.json
│
├── Documentation/           # Project documentation
├── README.md
└── package.json            # Root package.json
```

---

## 🔧 Development Workflow

### Adding a New Feature

1. **Plan the feature**
   - Define database schema changes
   - Design API endpoints
   - Sketch UI components

2. **Backend implementation**
   ```bash
   # Create route file
   touch server/routes/feature.js
   
   # Update database.js if needed
   # Register routes in server.js
   ```

3. **Frontend implementation**
   ```bash
   # Create page component
   touch client/src/pages/Feature.jsx
   
   # Add route in App.jsx
   # Update navigation in DashboardLayout.jsx
   ```

4. **Testing**
   ```bash
   # Test backend
   cd server
   npm test
   
   # Test frontend
   cd client
   npm test
   ```

5. **Documentation**
   - Update API reference
   - Update database schema docs
   - Add to README if needed

### Code Style

**JavaScript/React**
- Use functional components with hooks
- Prefer `const` over `let`
- Use arrow functions
- Destructure props
- Keep components small and focused

**Example Component:**
```jsx
import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';

export default function MyComponent({ initialValue }) {
    const [value, setValue] = useState(initialValue);
    
    useEffect(() => {
        // Effect logic
    }, [value]);
    
    const handleClick = () => {
        setValue(prev => prev + 1);
    };
    
    return (
        <div>
            <p>Value: {value}</p>
            <Button onClick={handleClick}>Increment</Button>
        </div>
    );
}
```

**Backend API Route:**
```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', checkPermission('module', 'read'), (req, res) => {
    db.all('SELECT * FROM table', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
```

---

## 🗄️ Database Development

### Making Schema Changes

1. **Update database.js**
   ```javascript
   db.run(`CREATE TABLE IF NOT EXISTS new_table (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   )`);
   ```

2. **Test with fresh database**
   ```bash
   # Delete existing database
   rm server/erp.db
   
   # Restart server (will recreate database)
   npm run dev
   ```

3. **Update documentation**
   - Add table to Database Schema docs
   - Document relationships

### Database Migrations

For production, consider:
- Backup before schema changes
- Use ALTER TABLE for existing databases
- Test migrations on copy of production data

---

## 🎨 Frontend Development

### Creating New Pages

1. **Create page component**
   ```jsx
   // client/src/pages/MyPage.jsx
   export default function MyPage() {
       return (
           <div className="fade-in">
               <h3>My Page</h3>
               {/* Content */}
           </div>
       );
   }
   ```

2. **Add route**
   ```jsx
   // client/src/App.jsx
   import MyPage from './pages/MyPage';
   
   <Route path="/my-page" element={
       <ProtectedRoute user={user}>
           <DashboardLayout user={user} onLogout={onLogout}>
               <MyPage />
           </DashboardLayout>
       </ProtectedRoute>
   } />
   ```

3. **Add to navigation**
   ```jsx
   // client/src/components/DashboardLayout.jsx
   const menuItems = [
       // ...
       { path: '/my-page', label: 'My Page', icon: '📄' },
   ];
   ```

### Styling Guidelines

- Use CSS variables for theming
- Follow existing class naming conventions
- Use `fade-in` and `animate-slide-up` for animations
- Ensure responsive design (mobile-first)

**CSS Variables:**
```css
:root {
    --primary: #3b82f6;
    --text: #1f2937;
    --text-light: #6b7280;
    --background: #ffffff;
    --surface: #f9fafb;
    --border: #e5e7eb;
    --hover: #f3f4f6;
    --radius: 8px;
}
```

---

## 🔌 API Development

### Creating New Endpoints

1. **Create route file**
   ```javascript
   // server/routes/myroute.js
   const express = require('express');
   const router = express.Router();
   const db = require('../database');
   const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
   
   router.use(authenticateToken);
   
   router.get('/', checkPermission('module', 'read'), (req, res) => {
       // Implementation
   });
   
   module.exports = router;
   ```

2. **Register in server.js**
   ```javascript
   const myRoutes = require('./routes/myroute');
   app.use('/api/myroute', myRoutes);
   ```

3. **Test endpoint**
   ```bash
   curl -X GET http://localhost:3000/api/myroute \
     -H "Authorization: Bearer <token>"
   ```

### Authentication & Authorization

All routes should:
1. Use `authenticateToken` middleware
2. Use `checkPermission` for RBAC
3. Validate user ownership of resources

```javascript
router.get('/:id', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM table WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Not found' });
            res.json(row);
        }
    );
});
```

---

## 🧪 Testing

### Running Tests

```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test

# With coverage
npm run test:coverage
```

### Writing Tests

**Backend Test Example:**
```javascript
describe('GET /api/customers', () => {
    it('should return all customers', async () => {
        const res = await request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
```

---

## 🐛 Debugging

### Backend Debugging

1. **Console logging**
   ```javascript
   console.log('Debug:', variable);
   ```

2. **Database queries**
   ```javascript
   db.all(query, params, (err, rows) => {
       console.log('Query:', query);
       console.log('Params:', params);
       console.log('Results:', rows);
   });
   ```

### Frontend Debugging

1. **React DevTools** - Install browser extension
2. **Console logging**
   ```javascript
   console.log('State:', state);
   ```

3. **Network tab** - Check API requests/responses

---

## 📦 Dependencies

### Adding New Dependencies

**Backend:**
```bash
cd server
npm install package-name
```

**Frontend:**
```bash
cd client
npm install package-name
```

### Common Dependencies

**Backend:**
- `express` - Web framework
- `sqlite3` - Database
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT auth
- `cors` - CORS middleware

**Frontend:**
- `react` - UI library
- `react-router-dom` - Routing
- `recharts` - Charts

---

## 🚀 Building for Production

```bash
# Build frontend
cd client
npm run build

# The build output will be in client/dist/
```

---

## 💡 Best Practices

1. **Always use authentication middleware**
2. **Validate user input**
3. **Log important actions to audit_logs**
4. **Use transactions for multi-step operations**
5. **Handle errors gracefully**
6. **Write meaningful commit messages**
7. **Keep components small and reusable**
8. **Document complex logic**
9. **Test before committing**
10. **Follow existing code patterns**

---

**Last Updated**: February 16, 2026
