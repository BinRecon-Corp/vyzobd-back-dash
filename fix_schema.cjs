const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('abandonedCarts')) {
  schema = schema.replace(/returnRequests  ReturnRequest\[\]/, 'returnRequests  ReturnRequest[]\n  notifications  Notification[]\n  notificationPref NotificationPreference?\n  activities     CustomerActivity[]\n  analyticsEvents AnalyticsEvent[]\n  abandonedCarts AbandonedCart[]');
}

if (!schema.includes('abandonedCart ')) {
  schema = schema.replace(/items      CartItem\[\]/, 'items      CartItem[]\n  abandonedCart AbandonedCart?');
}

if (!schema.includes('abandonedCart')) {
  // Check order model
  if (!schema.match(/abandonedCart\s+AbandonedCart\?/)) {
     schema = schema.replace(/returnRequests  ReturnRequest\[\]/, 'returnRequests  ReturnRequest[]\n  abandonedCart   AbandonedCart?');
  }
}

fs.writeFileSync('prisma/schema.prisma', schema);
