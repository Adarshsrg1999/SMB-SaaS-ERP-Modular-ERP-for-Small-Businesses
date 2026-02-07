# Notification Quick Reference

This is a quick reference guide for all 16 notification types in the SMB SaaS ERP system.

---

## Notification Types Overview

| Category | Notification Type | Trigger Event | Configurable |
|----------|------------------|---------------|--------------|
| **Security** | LOGIN_SUCCESS | User logs in successfully | No |
| **Security** | LOGIN_FAILED | Failed login attempt | No |
| **Security** | USER_CREATED | New user account created | No |
| **Security** | USER_UPDATED | User role changed | No |
| **Security** | USER_DELETED | User account deleted | No |
| **Security** | DATABASE_RESET | Database reset performed | No |
| **Inventory** | PRODUCT_ADDED | New product added to inventory | No |
| **Inventory** | LOW_STOCK | Stock below minimum level | No |
| **Inventory** | OUT_OF_STOCK | Stock reaches zero | No |
| **Inventory** | LARGE_STOCK_ADJUSTMENT | Stock adjustment above threshold | Yes* |
| **Sales** | SALE_CREATED | New quotation/order/invoice created | No |
| **Sales** | LARGE_ORDER | Order amount above threshold | Yes* |
| **Sales** | ORDER_CONVERTED | Quotation converted to order | No |
| **Sales** | ORDER_CANCELLED | Order/invoice cancelled | No |
| **CRM** | CUSTOMER_ADDED | New customer added | No |
| **CRM** | CUSTOMER_DELETED | Customer deleted | No |

*Configurable via environment variables

---

## Configuration

### Environment Variables

```env
# Enable/Disable all notifications
ENABLE_NOTIFICATIONS=true

# Thresholds
LARGE_ORDER_THRESHOLD=100000              # in rupees
LARGE_STOCK_ADJUSTMENT_THRESHOLD=50       # in units
```

### Test Mode

Notifications are automatically disabled when `NODE_ENV=test`

---

## Notification Details

### Security Notifications

#### LOGIN_SUCCESS
- **When:** User successfully logs in
- **Data:** Username, email, IP address, timestamp
- **Action Required:** None (informational)

#### LOGIN_FAILED
- **When:** Login attempt fails (wrong password or user not found)
- **Data:** Email, IP address, reason, timestamp
- **Action Required:** Monitor for suspicious activity

#### USER_CREATED
- **When:** New user account is created
- **Data:** Name, email, role, created by, timestamp
- **Action Required:** None (informational)

#### USER_UPDATED
- **When:** User role is changed
- **Data:** Name, email, old role, new role, changed by, timestamp
- **Action Required:** None (informational)

#### USER_DELETED
- **When:** User account is deleted
- **Data:** Name, email, role, deleted by, timestamp
- **Action Required:** None (informational)

#### DATABASE_RESET
- **When:** Database reset is performed (all data cleared)
- **Data:** Performed by, timestamp
- **Action Required:** Critical alert - verify this was intentional

---

### Inventory Notifications

#### PRODUCT_ADDED
- **When:** New product is added to inventory
- **Data:** Name, SKU, price, initial stock, added by, timestamp
- **Action Required:** None (informational)

#### LOW_STOCK
- **When:** Product stock falls below minimum level
- **Data:** Product name, SKU, current stock, minimum level, timestamp
- **Action Required:** Reorder product soon

#### OUT_OF_STOCK
- **When:** Product stock reaches zero
- **Data:** Product name, SKU, timestamp
- **Action Required:** Urgent - reorder immediately

#### LARGE_STOCK_ADJUSTMENT
- **When:** Stock adjustment exceeds threshold (default: 50 units)
- **Data:** Product name, amount, type (in/out), reason, adjusted by, timestamp
- **Action Required:** Verify large adjustments are correct
- **Configurable:** Set `LARGE_STOCK_ADJUSTMENT_THRESHOLD` in .env

---

### Sales Notifications

#### SALE_CREATED
- **When:** New quotation, order, or invoice is created
- **Data:** Type, document ID, customer, total, item count, created by, timestamp
- **Action Required:** None (informational)

#### LARGE_ORDER
- **When:** Order amount exceeds threshold (default: ₹100,000)
- **Data:** Type, document ID, customer, amount, item count, status, timestamp
- **Action Required:** Review high-value orders
- **Configurable:** Set `LARGE_ORDER_THRESHOLD` in .env

#### ORDER_CONVERTED
- **When:** Quotation is converted to an order
- **Data:** Document ID, customer, amount, converted by, timestamp
- **Action Required:** None (informational)

#### ORDER_CANCELLED
- **When:** Order or invoice is cancelled
- **Data:** Type, document ID, customer, amount, cancelled by, timestamp
- **Action Required:** Verify cancellation reason

---

### CRM Notifications

#### CUSTOMER_ADDED
- **When:** New customer is added to the system
- **Data:** Name, email, phone, address, added by, timestamp
- **Action Required:** None (informational)

#### CUSTOMER_DELETED
- **When:** Customer is deleted from the system
- **Data:** Name, email, deleted by, timestamp
- **Action Required:** None (informational)

---

## Troubleshooting

### No Notifications Received

1. **Check environment variables:**
   ```bash
   # In server directory
   cat .env | grep TELEGRAM
   ```

2. **Check server logs:**
   - Look for "Telegram notification sent successfully"
   - Look for error messages

3. **Verify bot setup:**
   - Bot token is correct
   - Chat ID is correct
   - You've started a chat with the bot

4. **Check notification toggle:**
   ```env
   ENABLE_NOTIFICATIONS=true  # Make sure this is set
   ```

### Notifications Not Working in Tests

This is expected! Notifications are automatically disabled when `NODE_ENV=test`.

### Only Some Notifications Working

Check the specific route file for the notification type:
- Security: `server/routes/auth.js`, `server/routes/users.js`, `server/routes/dashboard.js`
- Inventory: `server/routes/inventory.js`
- Sales: `server/routes/sales.js`
- CRM: `server/routes/customers.js`

---

## Implementation Files

### Core Files
- `server/services/telegramService.js` - Main notification service
- `server/services/notificationTemplates.js` - All 16 message templates

### Route Files (where notifications are triggered)
- `server/routes/auth.js` - LOGIN_SUCCESS, LOGIN_FAILED, USER_CREATED (registration)
- `server/routes/users.js` - USER_CREATED, USER_UPDATED, USER_DELETED
- `server/routes/inventory.js` - PRODUCT_ADDED, LOW_STOCK, OUT_OF_STOCK, LARGE_STOCK_ADJUSTMENT
- `server/routes/sales.js` - SALE_CREATED, LARGE_ORDER, ORDER_CONVERTED, ORDER_CANCELLED
- `server/routes/customers.js` - CUSTOMER_ADDED, CUSTOMER_DELETED
- `server/routes/dashboard.js` - DATABASE_RESET

---

## Testing Notifications

### Manual Testing

1. **Login Notifications:**
   ```bash
   # Successful login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@erp.com","password":"admin123"}'
   
   # Failed login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@erp.com","password":"wrong"}'
   ```

2. **User Management:**
   - Create user via Admin panel
   - Update user role
   - Delete user

3. **Inventory:**
   - Add new product
   - Adjust stock to trigger LOW_STOCK or OUT_OF_STOCK
   - Make large stock adjustment (>50 units)

4. **Sales:**
   - Create quotation/order/invoice
   - Create large order (>₹100,000)
   - Convert quotation to order
   - Cancel an order

5. **CRM:**
   - Add new customer
   - Delete customer

6. **System:**
   - Reset database (Admin panel)

### Automated Testing

All tests automatically skip notifications (NODE_ENV=test).

---

## Best Practices

1. **Monitor Critical Alerts:**
   - DATABASE_RESET
   - LOGIN_FAILED (multiple attempts)
   - OUT_OF_STOCK

2. **Review High-Value Transactions:**
   - LARGE_ORDER
   - LARGE_STOCK_ADJUSTMENT

3. **Audit Trail:**
   - All notifications include "performed by" information
   - Use for security auditing

4. **Threshold Tuning:**
   - Adjust `LARGE_ORDER_THRESHOLD` based on your business
   - Adjust `LARGE_STOCK_ADJUSTMENT_THRESHOLD` based on inventory patterns

5. **Group Notifications:**
   - Consider using a Telegram group for team notifications
   - Add multiple team members to the group

---

## See Also

- [03-Telegram-Setup-Guide.md](03-Telegram-Setup-Guide.md) - Complete setup guide
- [05-Notification-Implementation-Summary.md](05-Notification-Implementation-Summary.md) - Implementation details
- [04-API-Documentation.md](04-API-Documentation.md) - API reference
