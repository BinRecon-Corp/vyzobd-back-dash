const fs = require('fs');
const file = 'prisma/schema.prisma';
let schema = fs.readFileSync(file, 'utf8');

// Function to safely inject an @@index declaration at the end of a model block
function addIndexToModel(modelName, indexField) {
  const modelRegex = new RegExp(`(model\\s+${modelName}\\s+{[\\s\\S]*?)(})`, 'g');
  schema = schema.replace(modelRegex, (match, p1, p2) => {
    // If it already has this index, skip
    if (p1.includes(`@@index([${indexField}])`)) {
      return match;
    }
    // Append index right before closing brace
    return p1 + `  @@index([${indexField}])\n` + p2;
  });
}

const indexesToAdd = [
  ['Product', 'categoryId'],
  ['Product', 'brandId'],
  ['ProductVariant', 'productId'],
  ['ProductAttributeValue', 'variantId'],
  ['ProductAttributeValue', 'attributeId'],
  ['ProductImage', 'productId'],
  ['Inventory', 'productId'],
  ['Inventory', 'variantId'],
  ['Inventory', 'warehouseId'],
  ['Cart', 'customerId'],
  ['Cart', 'couponId'],
  ['CartItem', 'cartId'],
  ['CartItem', 'productId'],
  ['CartItem', 'variantId'],
  ['Order', 'customerId'],
  ['Order', 'couponId'],
  ['OrderItem', 'orderId'],
  ['OrderItem', 'productId'],
  ['OrderItem', 'variantId'],
  ['OrderTimeline', 'orderId'],
  ['Payment', 'orderId'],
  ['Payment', 'customerId'],
  ['PaymentTransaction', 'paymentId'],
  ['Refund', 'paymentId'],
  ['Refund', 'orderId'],
  ['Refund', 'customerId'],
  ['RefundTransaction', 'refundId'],
  ['Shipment', 'orderId'],
  ['Shipment', 'courierId'],
  ['ShipmentItem', 'shipmentId'],
  ['ShipmentItem', 'orderItemId'],
  ['ShipmentTracking', 'shipmentId'],
  ['ReturnRequest', 'orderId'],
  ['ReturnRequest', 'customerId'],
  ['ReturnItem', 'returnRequestId'],
  ['ReturnItem', 'orderItemId'],
  ['Review', 'productId'],
  ['Review', 'customerId'],
  ['Wishlist', 'customerId'],
  ['WishlistItem', 'wishlistId'],
  ['WishlistItem', 'productId'],
  ['Notification', 'customerId'],
  ['ActivityLog', 'userId']
];

for (const [model, field] of indexesToAdd) {
  addIndexToModel(model, field);
}

fs.writeFileSync(file, schema);
