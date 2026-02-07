const https = require('https');

/**
 * Sends a login notification to Telegram
 * @param {string} username - The name of the user who logged in
 * @param {string} email - The email of the user who logged in
 * @param {string} ipAddress - The IP address from which the login occurred
 */
function sendLoginNotification(username, email, ipAddress) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Skip if credentials are not configured
    if (!botToken || !chatId) {
        console.warn('Telegram credentials not configured. Skipping notification.');
        return;
    }

    const timestamp = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium'
    });

    const message = `🔐 *Login Alert*\n\n` +
                   `👤 *User:* ${username}\n` +
                   `📧 *Email:* ${email}\n` +
                   `🕒 *Time:* ${timestamp}\n` +
                   `🌐 *IP Address:* ${ipAddress}`;

    const data = JSON.stringify({
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
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('Telegram notification sent successfully');
            } else {
                console.error('Telegram API error:', res.statusCode, responseData);
            }
        });
    });

    req.on('error', (error) => {
        // Log error but don't throw - we don't want to break the login flow
        console.error('Failed to send Telegram notification:', error.message);
    });

    req.write(data);
    req.end();
}

module.exports = {
    sendLoginNotification
};
