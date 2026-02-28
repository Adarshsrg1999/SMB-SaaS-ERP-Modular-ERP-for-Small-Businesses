const https = require('https');
const notificationTemplates = require('./notificationTemplates');
const db = require('../database');
const os = require('os');

/**
 * Parses User-Agent string for basic browser/device info
 */
function parseUserAgent(ua) {
    if (!ua) return { browser: 'Unknown', device: 'Unknown', os: 'Unknown' };

    let browser = 'Other';
    let device = 'Desktop';
    let osInfo = 'Unknown';

    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Mobi')) device = 'Mobile';
    else if (ua.includes('Tablet')) device = 'Tablet';

    if (ua.includes('Windows')) osInfo = 'Windows';
    else if (ua.includes('Macintosh')) osInfo = 'macOS';
    else if (ua.includes('Android')) osInfo = 'Android';
    else if (ua.includes('iPhone')) osInfo = 'iOS';
    else if (ua.includes('Linux')) osInfo = 'Linux';

    return { browser, device, os: osInfo };
}

/**
 * Sends a notification to Telegram and logs it to the database
 * @param {string} type - Notification type (e.g., 'LOGIN_SUCCESS', 'LOW_STOCK')
 * @param {object} data - Data to populate the template
 * @param {object} user - Optional user object for audit trail
 */
function sendNotification(type, data, user = null) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Parse User-Agent if provided
    if (data.userAgent) {
        const uaInfo = parseUserAgent(data.userAgent);
        data.browser = uaInfo.browser;
        data.device = uaInfo.device;
        data.os = uaInfo.os;
    }

    // Add timestamp if not provided
    if (!data.timestamp) {
        data.timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    }

    // Get the template function
    const template = notificationTemplates[type];
    if (!template) {
        console.error(`Unknown notification type: ${type}`);
        return;
    }

    // Generate message from template
    const message = template(data);

    // Helper function to log to DB (always async)
    const logToDb = (finalStatus, errorMsg = null) => {
        const query = `INSERT INTO notification_logs (type, message, data, status, error_message) VALUES (?, ?, ?, ?, ?)`;
        const params = [type, message, JSON.stringify(data), finalStatus, errorMsg];

        db.run(query, params, (err) => {
            if (err) {
                console.error('❌ Error logging notification to DB:', err.message);
            }
        });
    };

    // Skip if in test mode (but still log to DB as 'test_mode')
    if (process.env.NODE_ENV === 'test') {
        logToDb('test_mode');
        return;
    }

    // Skip if credentials are not configured
    if (!botToken || !chatId) {
        console.warn('Telegram credentials not configured. Skipping notification.');
        logToDb('failed', 'Credentials not configured');
        return;
    }

    // Skip if notifications are disabled
    if (process.env.ENABLE_NOTIFICATIONS === 'false') {
        console.log('Notifications disabled. Skipping notification.');
        logToDb('disabled', 'Explicitly disabled in ENV');
        return;
    }

    // Escape HTML special characters
    const escapedMessage = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const payload = JSON.stringify({
        chat_id: chatId,
        text: escapedMessage,
        parse_mode: 'HTML'
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log(`✅ Telegram notification sent: ${type}`);
                logToDb('sent');
            } else {
                console.error(`❌ Telegram API error (${type}):`, res.statusCode, responseData);
                logToDb('failed', `Telegram API Error: ${res.statusCode} - ${responseData}`);
            }
        });
    });

    req.on('error', (error) => {
        console.error(`❌ Failed to send Telegram notification (${type}):`, error.message);
        logToDb('failed', error.message);
    });

    req.write(payload);
    req.end();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use sendNotification('LOGIN_SUCCESS', data) instead
 */
function sendLoginNotification(username, email, ipAddress) {
    sendNotification('LOGIN_SUCCESS', {
        username,
        email,
        ipAddress
    });
}

module.exports = {
    sendNotification,
    sendLoginNotification
};
