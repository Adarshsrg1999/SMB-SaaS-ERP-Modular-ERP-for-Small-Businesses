/**
 * Notification message templates for Telegram
 * Each template is a function that takes data and returns a formatted message
 */

const notificationTemplates = {
    // Security & Authentication
    LOGIN_SUCCESS: (data) => `🔐 *Login Alert*\n\n👤 *User:* ${data.username}\n📧 *Email:* ${data.email}\n🕒 *Time:* ${data.timestamp}\n🌐 *IP Address:* ${data.ipAddress}`,

    LOGIN_FAILED: (data) => `⚠️ *Failed Login Attempt*\n\n📧 *Email:* ${data.email}\n🕒 *Time:* ${data.timestamp}\n🌐 *IP Address:* ${data.ipAddress}\n❌ *Reason:* ${data.reason}`,

    USER_CREATED: (data) => `👤 *New User Registered*\n\n✨ *Name:* ${data.name}\n📧 *Email:* ${data.email}\n🎭 *Role:* ${data.role}\n👨‍💼 *Created By:* ${data.createdBy}\n🕒 *Time:* ${data.timestamp}`,

    USER_UPDATED: (data) => `🔄 *User Role Changed*\n\n👤 *User:* ${data.name}\n📧 *Email:* ${data.email}\n🎭 *Old Role:* ${data.oldRole} → *New Role:* ${data.newRole}\n👨‍💼 *Changed By:* ${data.changedBy}\n🕒 *Time:* ${data.timestamp}`,

    USER_DELETED: (data) => `🗑️ *User Account Deleted*\n\n👤 *Deleted User:* ${data.name}\n📧 *Email:* ${data.email}\n🎭 *Role:* ${data.role}\n👨‍💼 *Deleted By:* ${data.deletedBy}\n🕒 *Time:* ${data.timestamp}`,

    // Inventory Notifications
    LOW_STOCK: (data) => `⚠️ *Low Stock Alert*\n\n📦 *Product:* ${data.productName}\n🔢 *SKU:* ${data.sku}\n📊 *Current Stock:* ${data.currentStock} units\n⚡ *Minimum Level:* ${data.minLevel} units\n🚨 *Action Required:* Reorder soon!`,

    OUT_OF_STOCK: (data) => `🚨 *OUT OF STOCK*\n\n📦 *Product:* ${data.productName}\n🔢 *SKU:* ${data.sku}\n📊 *Stock:* 0 units\n⛔ *Status:* Cannot fulfill orders\n🕒 *Time:* ${data.timestamp}`,

    PRODUCT_ADDED: (data) => `✨ *New Product Added*\n\n📦 *Product:* ${data.name}\n🔢 *SKU:* ${data.sku}\n💰 *Price:* ₹${data.price}\n📊 *Initial Stock:* ${data.stock} units\n👨‍💼 *Added By:* ${data.addedBy}`,

    LARGE_STOCK_ADJUSTMENT: (data) => `📊 *Large Stock Adjustment*\n\n📦 *Product:* ${data.productName}\n🔢 *Change:* ${data.type === 'in' ? '+' : '-'}${data.amount} units\n📈 *Type:* ${data.type === 'in' ? 'Stock In' : 'Stock Out'}\n📝 *Reason:* ${data.reason}\n👨‍💼 *Adjusted By:* ${data.adjustedBy}\n🕒 *Time:* ${data.timestamp}`,

    // Sales Notifications
    SALE_CREATED: (data) => `💰 *New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Created*\n\n📄 *Document ID:* #${data.documentId}\n👤 *Customer:* ${data.customerName}\n💵 *Total Amount:* ₹${data.total.toLocaleString('en-IN')}\n📦 *Items:* ${data.itemCount} product${data.itemCount > 1 ? 's' : ''}\n👨‍💼 *Created By:* ${data.createdBy}\n🕒 *Time:* ${data.timestamp}`,

    LARGE_ORDER: (data) => `🎉 *Large Order Received!*\n\n📄 *Document:* ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} #${data.documentId}\n👤 *Customer:* ${data.customerName}\n💰 *Amount:* ₹${data.total.toLocaleString('en-IN')}\n📦 *Items:* ${data.itemCount} product${data.itemCount > 1 ? 's' : ''}\n⭐ *Status:* ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}\n🕒 *Time:* ${data.timestamp}`,

    ORDER_CONVERTED: (data) => `✅ *Quotation Converted to Order*\n\n📄 *Document ID:* #${data.documentId}\n👤 *Customer:* ${data.customerName}\n💵 *Amount:* ₹${data.total.toLocaleString('en-IN')}\n🔄 *Status:* Pending → Confirmed\n👨‍💼 *Converted By:* ${data.convertedBy}`,

    ORDER_CANCELLED: (data) => `❌ *Order Cancelled*\n\n📄 *Document:* ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} #${data.documentId}\n👤 *Customer:* ${data.customerName}\n💵 *Lost Amount:* ₹${data.total.toLocaleString('en-IN')}\n👨‍💼 *Cancelled By:* ${data.cancelledBy}\n🕒 *Time:* ${data.timestamp}`,

    // Customer Management
    CUSTOMER_ADDED: (data) => `🎉 *New Customer Added*\n\n👤 *Name:* ${data.name}\n📧 *Email:* ${data.email}\n📱 *Phone:* ${data.phone}\n📍 *Location:* ${data.address}\n👨‍💼 *Added By:* ${data.addedBy}`,

    CUSTOMER_DELETED: (data) => `🗑️ *Customer Deleted*\n\n👤 *Name:* ${data.name}\n📧 *Email:* ${data.email}\n⚠️ *Warning:* All history will be lost\n👨‍💼 *Deleted By:* ${data.deletedBy}\n🕒 *Time:* ${data.timestamp}`,

    // System Notifications
    DATABASE_RESET: (data) => `🚨 *DATABASE RESET PERFORMED*\n\n⚠️ *CRITICAL ACTION*\n🗑️ *All data cleared except admin accounts*\n👨‍💼 *Performed By:* ${data.performedBy}\n🕒 *Time:* ${data.timestamp}\n⚠️ *This action cannot be undone!*`,
};

module.exports = notificationTemplates;
