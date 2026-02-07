# Telegram Notification Setup Guide

This guide explains how to configure Telegram notifications for the SMB SaaS ERP project so that team members can set it up easily in their own environments.

---

## Purpose

Telegram is used to send notifications when a user logs in to the application.

- One-way communication (Application → Telegram)
- Notifications only
- No webhooks
- No polling

---

## Prerequisites

- A Telegram account
- Access to project environment configuration
- Node.js server running

---

## Step 1: Create a Telegram Bot

1. Open Telegram
2. Search for **@BotFather**
3. Start the chat
4. Run `/newbot`
5. Provide a bot name (e.g., "ERP Login Notifier")
6. Provide a bot username (must end with `bot`, e.g., "erp_login_notifier_bot")

After creation, Telegram generates a **Bot Token**.  
**Example format:** `8130602704:AAHpxHhgZqKtA5dKYKx1N3VYkg4nyyiYMwk`

⚠️ **Store this token securely** - treat it like a password!

---

## Step 2: Get Your Telegram Chat ID

### Personal Chat (Recommended)

1. Search for **@userinfobot** in Telegram
2. Start the chat
3. The bot will display your user information
4. Copy the `Id` value

**Example format:** `6416107710`

This value is used as the Chat ID for notifications.

---

### Group Chat (Optional)

If you want notifications in a group:

1. Create a Telegram group
2. Add your bot to the group (search for it by username)
3. Send any message in the group
4. Add **@RawDataBot** to the group
5. Copy the `chat.id` value from the response

---

## Step 3: Configure Environment Variables

### Option A: Using `.env` file (Recommended for Development)

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp ../.env.example .env
   ```
   
   Or on Windows PowerShell:
   ```powershell
   Copy-Item ..\.env.example .env
   ```

3. Edit the `.env` file and add your credentials:
   ```env
   # Server Configuration
   PORT=5000

   # JWT Secret Key for authentication
   SECRET_KEY=supersecretkey

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

4. Replace `your_bot_token_here` with your actual bot token
5. Replace `your_chat_id_here` with your actual chat ID

### Option B: Using Environment Variables Directly

Set environment variables in your system or deployment platform:

```bash
export TELEGRAM_BOT_TOKEN="8130602704:AAHpxHhgZqKtA5dKYKx1N3VYkg4nyyiYMwk"
export TELEGRAM_CHAT_ID="6416107710"
```

---

## Step 4: Verify Configuration

### Files Modified in This Project

The following files were created/modified to enable Telegram notifications:

1. **`.env.example`** (root directory)
   - Template file showing required environment variables
   - Safe to commit to Git

2. **`.env`** (root directory)
   - Contains actual credentials
   - **Never commit this file** (already in `.gitignore`)

3. **`server/.env`** (server directory)
   - Copy of `.env` for the server to read
   - Server runs from `server/` directory, so it needs the file here

4. **`server/services/telegramService.js`** (NEW)
   - Service module that handles Telegram API communication
   - Sends formatted login notifications
   - Includes error handling

5. **`server/routes/auth.js`** (MODIFIED)
   - Login route now calls `sendLoginNotification()` after successful authentication
   - Extracts IP address from request
   - Fire-and-forget pattern (doesn't block login)

### Test the Setup

1. Start the development server:
   ```bash
   cd server
   npm run dev
   ```

2. Look for this log message:
   ```
   [dotenv@17.2.3] injecting env (4) from .env
   Server running on http://localhost:5000
   ```
   
   ✅ If it says "injecting env (4)" - your `.env` file is loaded correctly
   
   ❌ If it says "injecting env (0)" - your `.env` file is not in the right location

3. Test a login request:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@erp.com","password":"test123"}'
   ```
   
   Or using PowerShell:
   ```powershell
   Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
     -Method POST `
     -Headers @{"Content-Type"="application/json"} `
     -Body '{"email":"testuser@erp.com","password":"test123"}'
   ```

4. Check the server logs for:
   ```
   Telegram notification sent successfully
   ```

5. Check your Telegram chat for a notification message!

---

## How It Works

```
User logs in successfully
↓
Application validates credentials
↓
JWT token is generated
↓
Backend calls sendLoginNotification()
↓
HTTPS request sent to Telegram Bot API
↓
Notification delivered to your Telegram chat
```

**Technical Flow:**
1. User submits login credentials to `/api/auth/login`
2. Server validates email and password
3. If valid, generates JWT token
4. Extracts IP address from request headers
5. Calls `sendLoginNotification(username, email, ipAddress)`
6. Service sends HTTPS POST to `https://api.telegram.org/bot{token}/sendMessage`
7. Login response returned to user (notification happens asynchronously)

---

## Notification Format

Login notifications include:

- 🔐 Login Alert header
- 👤 Username
- 📧 Email address
- 🕒 Login timestamp (in IST timezone)
- 🌐 IP address

**Example:**
```
🔐 Login Alert

👤 User: Test User
📧 Email: testuser@erp.com
🕒 Time: 7 Feb 2026, 9:31:36 pm
🌐 IP Address: ::1
```

The message uses Markdown formatting for better readability in Telegram.

---

## Features Not Used

The following Telegram features are **not** required for this implementation:

- ❌ Webhooks
- ❌ Polling (getUpdates)
- ❌ Bot commands
- ❌ Inline mode
- ❌ Bot profile customization
- ❌ Reply keyboards
- ❌ Callback queries

We only use the simple `sendMessage` API endpoint.

---

## Security Notes

✅ **Do's:**
- Keep bot tokens private and secure
- Use environment variables for credentials
- Never commit `.env` files to Git
- Rotate tokens if exposure is suspected
- Use HTTPS for all API communication (handled automatically)

❌ **Don'ts:**
- Do not include passwords in notifications
- Do not hardcode credentials in source code
- Do not share bot tokens publicly
- Do not send sensitive user data in notifications

**What's Safe to Include:**
- Username (public identifier)
- Email (already known to the user)
- Timestamp (when the event occurred)
- IP address (for security monitoring)

**What to Never Include:**
- Passwords
- Password hashes
- JWT tokens
- Credit card information
- Personal identification numbers

---

## Error Handling

The implementation includes robust error handling:

1. **Missing Credentials:**
   ```
   Telegram credentials not configured. Skipping notification.
   ```
   → Login still succeeds, notification is skipped

2. **Network Errors:**
   ```
   Failed to send Telegram notification: [error message]
   ```
   → Login still succeeds, error is logged

3. **API Errors:**
   ```
   Telegram API error: [status code] [response]
   ```
   → Login still succeeds, error is logged

**Key Point:** Notification failures never break the login flow!

---

## Troubleshooting

### Issue: "Telegram credentials not configured"

**Solution:** 
- Ensure `.env` file exists in `server/` directory
- Check that `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Restart the server after adding credentials

### Issue: "injecting env (0) from .env"

**Solution:**
- The `.env` file is not in the correct location
- Server runs from `server/` directory, so `.env` must be in `server/.env`
- Copy the file: `cp .env server/.env`

### Issue: No notification received

**Solution:**
1. Check server logs for "Telegram notification sent successfully"
2. Verify bot token is correct
3. Verify chat ID is correct
4. Ensure you've started a chat with the bot (send `/start` to your bot)
5. Check if bot is blocked or deleted

### Issue: "Unauthorized" error from Telegram API

**Solution:**
- Bot token is invalid or expired
- Create a new bot or regenerate the token from @BotFather

---

## Setup Checklist

- [ ] Telegram bot created via @BotFather
- [ ] Bot token copied and stored securely
- [ ] Chat ID obtained from @userinfobot
- [ ] `.env` file created in `server/` directory
- [ ] `TELEGRAM_BOT_TOKEN` configured in `.env`
- [ ] `TELEGRAM_CHAT_ID` configured in `.env`
- [ ] Server restarted to load new environment variables
- [ ] Test login performed
- [ ] Notification received in Telegram
- [ ] Server logs show "Telegram notification sent successfully"

---

## Production Deployment

For production environments:

1. **Use Environment Variables** instead of `.env` files
2. **Store credentials in a secrets manager** (AWS Secrets Manager, Azure Key Vault, etc.)
3. **Rotate tokens periodically** for security
4. **Monitor notification delivery** to detect issues
5. **Set up alerts** if notifications fail repeatedly

### Example: Heroku

```bash
heroku config:set TELEGRAM_BOT_TOKEN="your_token_here"
heroku config:set TELEGRAM_CHAT_ID="your_chat_id_here"
```

### Example: Docker

```yaml
environment:
  - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
  - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
```

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify credentials are correct
4. Test the bot manually by sending a message to it
5. Consult the [Telegram Bot API documentation](https://core.telegram.org/bots/api)

---

## Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [Telegram Bot Features](https://core.telegram.org/bots/features)
