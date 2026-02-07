const https = require('https');
const notificationTemplates = require('./notificationTemplates');

/**
 * Sends a notification to Telegram
 * @param {string} type - Notification type (e.g., 'LOGIN_SUCCESS', 'LOW_STOCK')
 * @param {object} data - Data to populate the template
 * @param {object} user - Optional user object for audit trail
 */
function sendNotification(type, data, user = null) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Skip if in test mode
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    // Skip if credentials are not configured
    if (!botToken || !chatId) {
        console.warn('Telegram credentials not configured. Skipping notification.');
        return;
    }

    // Skip if notifications are disabled
    if (process.env.ENABLE_NOTIFICATIONS === 'false') {
        console.log('Notifications disabled. Skipping notification.');
        return;
    }

    // Get the template function
    const template = notificationTemplates[type];
    if (!template) {
        console.error(`Unknown notification type: ${type}`);
        return;
    }

    // Add timestamp if not provided
    if (!data.timestamp) {
        data.timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    }

    // Generate message from template
    const message = template(data);

    const payload = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
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
            } else {
                console.error(`❌ Telegram API error (${type}):`, res.statusCode, responseData);
            }
        });
    });

    req.on('error', (error) => {
        // Log error but don't throw - we don't want to break the application flow
        console.error(`❌ Failed to send Telegram notification (${type}):`, error.message);
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
    sendLoginNotification // Keep for backward compatibility
};
